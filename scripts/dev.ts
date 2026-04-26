import {spawn} from "node:child_process";

const procs = [
  spawn("tsx", ["scripts/edit-server.ts"], {
    stdio: "inherit",
    shell: true,
    env: {...process.env},
  }),
  spawn("docusaurus", ["start"], {
    stdio: "inherit",
    shell: true,
    env: {...process.env, NODE_ENV: "development"},
  }),
];

const shutdown = (code = 0) => {
  for (const p of procs) {
    if (!p.killed) p.kill();
  }
  process.exit(code);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

procs.forEach((p, i) => {
  p.on("exit", (code) => {
    const name = i === 0 ? "edit-server" : "docusaurus";
    console.log(`[${name}] exited with code ${code}`);
    shutdown(code ?? 0);
  });
});
