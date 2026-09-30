// Generates the API Reference pages (docs/api-reference/**) from api/api.json,
// which tools/api-extract writes from the Deadworks source, and from any
// hand-written notes in api/notes/<Type>.md.
//
// To regenerate, point the extractor at a Deadworks checkout of the commit to document:
//   dotnet run --project tools/api-extract -c Release -- <deadworks repo> <commit> api/api.json
//   bun scripts/gen-api.ts
//
// A notes file can have an intro before its first heading, which appears under
// the type's summary. Each "## Member" heading then holds that member's notes,
// split into "### Description", "### Example", "### Notes" and "### See also".
// "## Type" does the same for the type itself.
//
// Usage: bun scripts/gen-api.ts

import fs from 'node:fs';
import path from 'node:path';

type Doc = {
  summary?: string;
  remarks?: string;
  returns?: string;
  value?: string;
  example?: string;
  params: Record<string, string>;
  typeParams: Record<string, string>;
  exceptions: {type: string; text: string}[];
  seeAlso: string[];
};
type Member = {
  kind: string;
  name: string;
  signature: string;
  parameters?: string[];
  isStatic: boolean;
  isExtension: boolean;
  file: string;
  line: number;
  doc?: Doc;
  obsolete?: string;
};
type Type = {
  namespace: string;
  name: string;
  kind: string;
  folder: string;
  declaration: string;
  file: string;
  line: number;
  doc?: Doc;
  obsolete?: string;
  bases: string[];
  members: Member[];
};
type Notes = {
  intro: string;
  sections: Record<string, Record<string, string>>;
};

const ROOT = path.resolve(__dirname, '..');
const api: {commit: string; types: Type[]} = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'api/api.json'), 'utf8'),
);
const OUT = path.join(ROOT, 'docs/api-reference');
const NOTES = path.join(ROOT, 'api/notes');
const SOURCE = `https://github.com/Deadworks-net/deadworks/blob/${api.commit}/`;

// Types that exist for Deadworks itself, not for plugins.
const HIDDEN = new Set([
  'ConCommandEntry', 'ConVarEntry', 'EngineLogHandler', 'EntityDataRegistry', 'IEntityData',
  'NativeClassAttribute', 'PluginRegistry', 'Deadworks', 'Utf8', 'MurmurHash2', 'Pace',
  'IDeadworksPlugin',
]);

// Sidebar categories, in order. Root-folder types are placed by name.
const CATEGORIES: {label: string; slug: string; folders?: string[]; types?: string[]}[] = [
  {label: 'Plugin', slug: 'plugin', types: ['DeadworksPluginBase', 'Server', 'GlobalVars', 'GameRules', 'Precache', 'ContentAddons', 'ItemInfo', 'KeyValues3', 'PlayerCamera', 'Chat']},
  {label: 'Entities', slug: 'entities', folders: ['Entities'], types: ['CTakeDamageInfo', 'CitadelHeroData', 'HeroTypeExtensions']},
  {label: 'Events', slug: 'events', folders: ['Events']},
  {label: 'Commands', slug: 'commands', folders: ['Commands']},
  {label: 'ConVars', slug: 'convars', folders: ['ConCommands'], types: ['ConVar']},
  {label: 'Configuration', slug: 'config', folders: ['Config']},
  {label: 'Timers', slug: 'timers', folders: ['Timer']},
  {label: 'Networking', slug: 'networking', folders: ['NetMessages']},
  {label: 'Sound', slug: 'sound', folders: ['Sounds']},
  {label: 'UI', slug: 'ui', folders: ['UI']},
  {label: 'Tracing', slug: 'tracing', folders: ['Trace', 'Math']},
  {label: 'Zones and Helpers', slug: 'utils', folders: ['Utils']},
  {label: 'Permissions', slug: 'permissions', folders: ['Permissions']},
  {label: 'Admin', slug: 'admin', folders: ['Admin']},
  {label: 'Enums', slug: 'enums', folders: ['Enums']},
];

// <inheritdoc/>: a member with no doc comment of its own takes the one from the
// same member on a base type or interface, even a hidden one.
for (const t of api.types) {
  for (const m of t.members) {
    if (m.doc?.summary) continue;
    for (const b of t.bases) {
      const base = api.types.find(o => baseName(o.name) === baseName(b));
      const inherited = base?.members.find(
        o => o.name === m.name && o.kind === m.kind && (o.parameters?.length ?? 0) === (m.parameters?.length ?? 0),
      );
      if (inherited?.doc) {
        m.doc = inherited.doc;
        break;
      }
    }
  }
}

const types = api.types.filter(t => !HIDDEN.has(t.name));
const byName = new Map<string, Type>();
for (const t of types) byName.set(baseName(t.name), t);

function baseName(name: string): string {
  return name.replace(/<.*>$/, '');
}

function category(t: Type) {
  return (
    CATEGORIES.find(c => c.types?.includes(t.name)) ??
    CATEGORIES.find(c => c.folders?.includes(t.folder)) ??
    CATEGORIES[0]
  );
}

function slug(t: Type): string {
  return baseName(t.name).replace(/\./g, '-').toLowerCase();
}

function anchor(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'member';
}

function pageUrl(t: Type): string {
  return `/api-reference/${category(t).slug}/${slug(t)}`;
}

// Resolves "Type" or "Type.Member" to a link, or returns null.
function resolve(ref: string): string | null {
  const clean = ref.replace(/<.*?>/g, '');
  const whole = byName.get(clean);
  if (whole) return pageUrl(whole);
  const dot = clean.lastIndexOf('.');
  if (dot > 0) {
    const owner = byName.get(clean.slice(0, dot));
    const member = clean.slice(dot + 1);
    if (owner && owner.members.some(m => m.name === member))
      return `${pageUrl(owner)}#${anchor(member)}`;
  }
  return null;
}

function crefLink(ref: string): string {
  const url = resolve(ref);
  const label = '`' + ref + '`';
  return url ? `[${label}](${url})` : label;
}

// Escapes MDX-significant characters outside code, and turns {@cref X} into links.
function md(text: string | undefined): string {
  if (!text) return '';
  const parts = text.split(/(```[\s\S]*?```|`[^`\n]*`)/g);
  return parts
    .map((p, i) => {
      if (i % 2 === 1) return p;
      return p
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\{@cref ([^}]+)\}/g, (_, r) => '\u0000' + r + '\u0001')
        .replace(/[{}]/g, c => '\\' + c)
        .replace(/\u0000([^\u0001]+)\u0001/g, (_, r) => crefLink(r));
    })
    .join('');
}

function readNotes(t: Type): Notes {
  const file = path.join(NOTES, `${baseName(t.name)}.md`);
  const notes: Notes = {intro: '', sections: {}};
  if (!fs.existsSync(file)) return notes;
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const chunks = text.split(/^## /m);
  notes.intro = chunks[0].trim();
  for (const chunk of chunks.slice(1)) {
    const nl = chunk.indexOf('\n');
    const name = chunk.slice(0, nl === -1 ? undefined : nl).trim();
    const body = nl === -1 ? '' : chunk.slice(nl + 1);
    const parts: Record<string, string> = {};
    const sub = body.split(/^### /m);
    if (sub[0].trim()) parts['Description'] = sub[0].trim();
    for (const s of sub.slice(1)) {
      const n = s.indexOf('\n');
      parts[s.slice(0, n).trim()] = s.slice(n + 1).trim();
    }
    notes.sections[name] = parts;
  }
  return notes;
}

function source(file: string, line: number): string {
  const short = file.replace(/^managed\/DeadworksManaged\.Api\//, '');
  return `[${short}#L${line}](${SOURCE}${file}#L${line})`;
}

const KIND_ORDER: [string, string][] = [
  ['constructor', 'Constructors'],
  ['property', 'Properties'],
  ['indexer', 'Properties'],
  ['field', 'Fields'],
  ['method', 'Methods'],
  ['event', 'Events'],
  ['operator', 'Operators'],
];

function displayName(t: Type, m: Member): string {
  const owner = baseName(t.name);
  switch (m.kind) {
    case 'constructor': return `new ${owner}()`;
    case 'method': return `${owner}.${m.name}()`;
    case 'indexer': return `${owner}[]`;
    case 'operator': return `${owner} ${m.name}`;
    default: return `${owner}.${m.name}`;
  }
}

function label(name: string): string {
  return `**${name}**\n`;
}

function renderMember(t: Type, group: Member[], notes: Record<string, string> | undefined): string {
  const m = group[0];
  const docs = group.map(g => g.doc).filter(Boolean) as Doc[];
  const out: string[] = [];
  out.push(`### ${displayName(t, m)} {#${anchor(m.kind === 'constructor' ? 'constructor' : m.name)}}\n`);

  const obsolete = group.find(g => g.obsolete !== undefined)?.obsolete;
  if (obsolete !== undefined)
    out.push(`:::warning Obsolete\n${md(obsolete) || 'This member is obsolete.'}\n:::\n`);

  const summary = notes?.['Description'] ?? md(docs.find(d => d.summary)?.summary ?? docs.find(d => d.value)?.value);
  if (summary) out.push(summary + '\n');

  out.push(label('Signature'));
  out.push('```csharp\n' + group.map(g => g.signature).join('\n') + '\n```\n');

  const example = notes?.['Example'] ?? (docs.find(d => d.example)?.example ? md(docs.find(d => d.example)!.example) : '');
  if (example) out.push(label('Example') + example + '\n');

  const params = new Map<string, string>();
  for (const g of group)
    for (const p of g.parameters ?? [])
      if (!params.has(p) || !params.get(p)) params.set(p, g.doc?.params[p] ?? '');
  if (m.isExtension) params.delete(group[0].parameters?.[0] ?? '');
  const documented = [...params].filter(([, v]) => v);
  if (notes?.['Parameters']) out.push(label('Parameters') + notes['Parameters'] + '\n');
  else if (documented.length) {
    out.push(label('Parameters'));
    out.push(documented.map(([k, v]) => `- \`${k}\`: ${md(v)}`).join('\n') + '\n');
  }

  const returns = notes?.['Returns'] ?? md(docs.find(d => d.returns)?.returns);
  if (returns) out.push(label('Returns') + returns + '\n');

  const exceptions = docs.flatMap(d => d.exceptions);
  if (exceptions.length) {
    out.push(label('Throws'));
    out.push(exceptions.map(e => `- ${crefLink(e.type)}: ${md(e.text)}`).join('\n') + '\n');
  }

  const remarks = [md(docs.find(d => d.remarks)?.remarks), notes?.['Notes']].filter(Boolean).join('\n\n');
  if (remarks) out.push(label('Notes') + remarks + '\n');

  const seeAlso = [
    ...new Set(docs.flatMap(d => d.seeAlso)),
  ].map(crefLink);
  if (notes?.['See also']) out.push(label('See also') + [notes['See also'], ...seeAlso.map(s => `- ${s}`)].join('\n') + '\n');
  else if (seeAlso.length) out.push(label('See also') + seeAlso.map(s => `- ${s}`).join('\n') + '\n');

  out.push(`**Source:** ${group.map(g => source(g.file, g.line)).join(', ')}\n`);
  return out.join('\n');
}

function renderEnum(t: Type, notes: Notes): string {
  const out: string[] = [];
  out.push('## Values\n');
  out.push('| Name | Value | Description |');
  out.push('|------|-------|-------------|');
  let implicit = 0;
  const isFlags = t.members.some(m => /<<|0x/.test(m.signature));
  for (const m of t.members) {
    const eq = m.signature.indexOf('=');
    let value = '';
    if (eq > 0) {
      value = m.signature.slice(eq + 1).trim();
      const n = Number(value);
      if (!Number.isNaN(n)) implicit = n + 1;
    } else if (!isFlags) {
      value = String(implicit++);
    }
    const desc = notes.sections[m.name]?.['Description'] ?? md(m.doc?.summary);
    out.push(`| <Link id="${anchor(m.name)}" />\`${m.name}\` | ${value ? '`' + value.replace(/\|/g, '\\|') + '`' : ''} | ${desc.replace(/\n+/g, ' ').replace(/\|/g, '\\|')} |`);
  }
  out.push('');
  return out.join('\n');
}

function renderType(t: Type): string {
  const notes = readNotes(t);
  const typeNotes = notes.sections['Type'] ?? {};
  const name = baseName(t.name);
  const out: string[] = [];
  const description = (md(t.doc?.summary) || `The \`${t.name}\` ${t.kind}.`).replace(/\n+/g, ' ');
  out.push('---');
  out.push(`title: "${name}"`);
  out.push(`sidebar_label: "${name}"`);
  // Explicit, so a type named like its folder (entities/entities) isn't taken as the folder's index.
  out.push(`slug: "${pageUrl(t)}"`);
  out.push(`description: ${JSON.stringify(description.replace(/\\([{}])/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').slice(0, 300))}`);
  out.push('---\n');
  out.push(`{/* Generated by scripts/gen-api.ts from the Deadworks source. Edit api/notes/${name}.md instead. */}\n`);
  // Link, not a plain <a id>, so the broken-anchor check knows each enum value's anchor.
  if (t.kind === 'enum') out.push("import Link from '@docusaurus/Link';\n");
  out.push(`# ${t.name.replace(/</g, '&lt;')}\n`);
  if (t.obsolete !== undefined)
    out.push(`:::warning Obsolete\n${md(t.obsolete) || 'This type is obsolete.'}\n:::\n`);
  if (t.doc?.summary) out.push(md(t.doc.summary) + '\n');
  if (notes.intro) out.push(notes.intro + '\n');

  out.push('```csharp\n' + t.declaration.replace(/\b(unsafe|partial) /g, '') + '\n```\n');

  const facts: string[] = [];
  facts.push(`**Namespace:** \`${t.namespace}\``);
  const bases = t.bases.map(b => {
    const url = resolve(b);
    return url ? `[\`${b}\`](${url})` : `\`${b}\``;
  });
  if (bases.length) facts.push(`**Inherits / implements:** ${bases.join(', ')}`);
  const derived = types.filter(o => o.bases.some(b => baseName(b) === name)).map(o => `[\`${o.name}\`](${pageUrl(o)})`);
  if (derived.length) facts.push(`**Derived types:** ${derived.join(', ')}`);
  facts.push(`**Source:** ${source(t.file, t.line)}`);
  out.push(facts.join('  \n') + '\n');

  if (t.doc?.remarks || typeNotes['Notes']) out.push('## Notes\n\n' + [md(t.doc?.remarks), typeNotes['Notes']].filter(Boolean).join('\n\n') + '\n');
  const typeExample = typeNotes['Example'] ?? md(t.doc?.example);
  if (typeExample) out.push('## Example\n\n' + typeExample + '\n');

  if (t.kind === 'enum') {
    out.push(renderEnum(t, notes));
  } else if (t.kind !== 'delegate') {
    const seen = new Set<string>();
    for (const [kind, heading] of KIND_ORDER) {
      if (seen.has(heading)) continue;
      const kinds = KIND_ORDER.filter(([, h]) => h === heading).map(([k]) => k);
      const members = t.members.filter(m => kinds.includes(m.kind));
      if (!members.length) continue;
      seen.add(heading);
      out.push(`## ${heading}\n`);
      const groups = new Map<string, Member[]>();
      for (const m of members) {
        const key = m.kind === 'constructor' ? 'ctor' : m.name;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(m);
      }
      for (const group of groups.values())
        out.push(renderMember(t, group, notes.sections[group[0].kind === 'constructor' ? 'constructor' : group[0].name]));
    }
  }

  if (typeNotes['See also']) out.push('## See Also\n\n' + typeNotes['See also'] + '\n');
  return out.join('\n');
}

// Write pages.
fs.rmSync(OUT, {recursive: true, force: true});
fs.mkdirSync(OUT, {recursive: true});

const sidebar: unknown[] = [{type: 'doc', id: 'api-reference/index', label: 'Overview'}];
const index: string[] = [];
for (const c of CATEGORIES) {
  const inCat = types.filter(t => category(t) === c).sort((a, b) => a.name.localeCompare(b.name));
  if (!inCat.length) continue;
  const dir = path.join(OUT, c.slug);
  fs.mkdirSync(dir, {recursive: true});
  for (const t of inCat) fs.writeFileSync(path.join(dir, `${slug(t)}.mdx`), renderType(t));
  sidebar.push({
    type: 'category',
    label: c.label,
    collapsed: true,
    items: inCat.map(t => `api-reference/${c.slug}/${slug(t)}`),
  });
  index.push(`## ${c.label}\n`);
  index.push('| Type | Description |');
  index.push('|------|-------------|');
  for (const t of inCat) {
    const d = md(t.doc?.summary).replace(/\n+/g, ' ').replace(/\|/g, '\\|');
    index.push(`| [\`${t.name.replace(/</g, '&lt;')}\`](${pageUrl(t)}) | ${d} |`);
  }
  index.push('');
}

fs.writeFileSync(
  path.join(OUT, 'index.mdx'),
  [
    '---',
    'title: "API Reference"',
    'sidebar_label: "Overview"',
    'slug: "/api-reference"',
    '---\n',
    '{/* Generated by scripts/gen-api.ts. */}\n',
    '# API Reference\n',
    `Every public type in \`DeadworksManaged.Api\`, generated from the Deadworks source at commit [\`${api.commit.slice(0, 7)}\`](https://github.com/Deadworks-net/deadworks/tree/${api.commit}). Each member lists its signature and a link to its source. If you're new to Deadworks, start with the [Features](/features/commands) pages instead; they show how to do common things.\n`,
    ...index,
  ].join('\n'),
);
fs.writeFileSync(path.join(ROOT, 'api/sidebar.json'), JSON.stringify(sidebar, null, 2) + '\n');
console.log(`Generated ${types.length} type pages in docs/api-reference`);
