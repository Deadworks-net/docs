import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { promises as fs } from "node:fs";
import { resolve, sep } from "node:path";

const PORT = Number(process.env.EDIT_SERVER_PORT ?? 3001);
const ROOT = resolve(process.cwd(), "docs");

function send(res: ServerResponse, status: number, body: unknown) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": typeof body === "string" ? "text/plain" : "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(data);
}

function safePath(rel: string): string | null {
  const cleaned = rel.replace(/^@site[\\/]/, "").replace(/^[\\/]+/, "");
  const abs = resolve(process.cwd(), cleaned);
  const docsRoot = ROOT + sep;
  if (abs !== ROOT && !abs.startsWith(docsRoot)) return null;
  if (!/\.(md|mdx)$/.test(abs)) return null;
  return abs;
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") return send(res, 204, "");

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/api/source") {
    const rel = url.searchParams.get("path");
    if (!rel) return send(res, 400, { error: "missing path" });
    const abs = safePath(rel);
    if (!abs) return send(res, 400, { error: "path outside docs/" });
    try {
      const content = await fs.readFile(abs, "utf8");
      return send(res, 200, { path: rel, content });
    } catch (e: any) {
      return send(res, 404, { error: e.message });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/source") {
    const body = JSON.parse(await readBody(req));
    const abs = safePath(body.path);
    if (!abs) return send(res, 400, { error: "path outside docs/" });
    if (typeof body.content !== "string") return send(res, 400, { error: "content must be string" });
    await fs.writeFile(abs, body.content, "utf8");
    return send(res, 200, { ok: true });
  }

  if (req.method === "PATCH" && url.pathname === "/api/source/range") {
    const body = JSON.parse(await readBody(req));
    const abs = safePath(body.path);
    if (!abs) return send(res, 400, { error: "path outside docs/" });
    const { startLine, endLine, replacement } = body;
    if (
      !Number.isInteger(startLine) ||
      !Number.isInteger(endLine) ||
      typeof replacement !== "string" ||
      startLine < 1 ||
      endLine < startLine
    ) {
      return send(res, 400, { error: "invalid range or replacement" });
    }
    const original = await fs.readFile(abs, "utf8");
    const usesCRLF = /\r\n/.test(original);
    const eol = usesCRLF ? "\r\n" : "\n";
    const trailingEol = original.endsWith(eol);
    const normalized = usesCRLF ? original.replace(/\r\n/g, "\n") : original;
    const lines = normalized.split("\n");
    if (trailingEol) lines.pop();
    if (endLine > lines.length) return send(res, 400, { error: "endLine past EOF" });
    const replacementLines = replacement.replace(/\r\n/g, "\n").split("\n");
    const nextLines = [
      ...lines.slice(0, startLine - 1),
      ...replacementLines,
      ...lines.slice(endLine),
    ];
    const next = nextLines.join(eol) + (trailingEol ? eol : "");
    await fs.writeFile(abs, next, "utf8");
    return send(res, 200, { ok: true, newLineCount: replacementLines.length });
  }

  send(res, 404, { error: "not found" });
}

const server = createServer((req, res) => {
  handle(req, res).catch((e) => send(res, 500, { error: String(e?.message ?? e) }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[edit-server] listening on http://127.0.0.1:${PORT} (root: ${ROOT})`);
});
