/**
 * Deadworks API Documentation Generator
 *
 * Parses DeadworksManaged.Api.xml and generates markdown reference pages
 * for the Docusaurus documentation website.
 *
 * Usage: npx tsx scripts/generate-api-docs.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Configuration ───────────────────────────────────────────────────────────

const XML_PATH = path.resolve(__dirname, '../../managed/DeadworksManaged.Api.xml');
const OUTPUT_DIR = path.resolve(__dirname, '../docs/api-reference/generated');
const CORE_NAMESPACE = 'DeadworksManaged.Api';

/** Type grouping: each entry produces one generated markdown page */
const PAGE_GROUPS: PageGroup[] = [
  { slug: 'DeadworksPluginBase', title: 'DeadworksPluginBase', types: ['DeadworksPluginBase', 'IDeadworksPlugin'], guide: '../plugin-base', position: 1 },
  { slug: 'ChatCommand', title: 'Chat Commands', types: ['ChatCommandAttribute', 'ChatCommandContext', 'ChatMessage'], guide: '../chat-commands', position: 2 },
  { slug: 'ConCommand', title: 'Console Commands', types: ['ConCommandAttribute', 'ConCommandContext', 'ConVarAttribute'], guide: '../console-commands', position: 3 },
  { slug: 'CBaseEntity', title: 'CBaseEntity', types: ['CBaseEntity', 'NativeEntity', 'CGameSceneNode', 'CBodyComponent', 'CEntitySubclassVDataBase'], guide: '../entities', position: 4 },
  { slug: 'Entities', title: 'Entities', types: ['Entities', 'EntityData', 'EntityDataRegistry', 'IEntityData'], guide: '../entities', position: 5 },
  { slug: 'CCitadelPlayerController', title: 'CCitadelPlayerController', types: ['CCitadelPlayerController', 'CBasePlayerController', 'PlayerDataGlobal'], guide: '../players', position: 6 },
  { slug: 'CCitadelPlayerPawn', title: 'CCitadelPlayerPawn', types: ['CCitadelPlayerPawn', 'CBasePlayerPawn', 'CCitadelAbilityComponent', 'AbilityResource', 'CCitadel_Ability_Jump', 'CCitadel_Ability_Dash'], guide: '../players', position: 7 },
  { slug: 'Modifiers', title: 'Modifiers', types: ['CModifierProperty', 'EModifierState', 'CBaseModifier', 'EKnockDownTypes'], guide: '../modifiers', position: 8 },
  { slug: 'CParticleSystem', title: 'CParticleSystem', types: ['CParticleSystem'], guide: '../particles', position: 9 },
  { slug: 'WorldText', title: 'World Text', types: ['CPointWorldText', 'ScreenText'], guide: '../world-text', position: 10 },
  { slug: 'ConVar', title: 'ConVar', types: ['ConVar'], guide: '../console-commands', position: 11 },
  { slug: 'EntityIO', title: 'Entity I/O', types: ['EntityIO', 'EntityOutputEvent', 'EntityInputEvent'], guide: '../entity-io', position: 12 },
  { slug: 'GameEvents', title: 'Game Events', types: ['GameEvents', 'GameEvent', 'GameEventWriter', 'GameEventHandler', 'GameEventHandlerAttribute'], guide: '../game-events', position: 13 },
  { slug: 'NetMessages', title: 'NetMessages', types: ['NetMessages', 'NetMessageRegistry', 'NetMessageHandlerAttribute', 'NetMessageDirection'], guide: '../networking', position: 14 },
  { slug: 'RecipientFilter', title: 'RecipientFilter', types: ['RecipientFilter', 'OutgoingMessageContext', 'IncomingMessageContext'], guide: '../networking', position: 15 },
  { slug: 'Tracing', title: 'Tracing', types: ['Trace', 'TraceResult', 'CGameTrace', 'CTraceFilter'], guide: '../tracing', position: 16 },
  { slug: 'TraceShapes', title: 'Trace Shapes', types: ['Ray_t', 'LineTrace', 'SphereTrace', 'HullTrace', 'CapsuleTrace', 'MeshTrace', 'BBox_t', 'CTransform'], guide: '../tracing', position: 17 },
  { slug: 'CollisionTypes', title: 'Collision Types', types: ['RayType_t', 'CollisionGroup', 'InteractionLayer', 'MaskTrace', 'RnQueryObjectSet', 'CollisionFunctionMask_t', 'NameMatchType', 'RnCollisionAttr_t', 'RnQueryShapeAttr_t'], guide: '../tracing', position: 18 },
  { slug: 'Damage', title: 'Damage', types: ['CTakeDamageInfo', 'TakeDamageFlags', 'TakeDamageEvent', 'ModifyCurrencyEvent'], guide: '../damage', position: 19 },
  { slug: 'Heroes', title: 'Heroes', types: ['Heroes', 'HeroTypeExtensions', 'CitadelHeroData'], guide: '../heroes', position: 20 },
  { slug: 'Timers', title: 'Timers', types: ['ITimer', 'IHandle', 'IStep', 'Pace', 'WaitPace', 'DonePace', 'TimerResolver'], guide: '../timers', position: 21 },
  { slug: 'KeyValues3', title: 'KeyValues3', types: ['KeyValues3'], guide: '../modifiers', position: 22 },
  { slug: 'Precache', title: 'Precache', types: ['Precache'], guide: '../precaching', position: 23 },
  { slug: 'Server', title: 'Server', types: ['Server'], guide: '../plugin-base', position: 24 },
  { slug: 'HookResult', title: 'HookResult', types: ['HookResult', 'CallbackHandle', 'NativeClassAttribute'], guide: '../plugin-base', position: 25 },
  { slug: 'Duration', title: 'Duration', types: ['Duration', 'DurationExtensions'], guide: '../timers', position: 26 },
  { slug: 'Enums', title: 'Enums', types: ['LaneColor', 'ECurrencyType', 'ECurrencySource', 'LifeState', 'EKnockDownTypes'], guide: '../plugin-base', position: 27 },
  { slug: 'Events', title: 'Event Types', types: ['ClientConCommandEvent', 'ClientPutInServerEvent', 'ClientFullConnectEvent', 'ClientDisconnectedEvent', 'EntityCreatedEvent', 'EntitySpawnedEvent', 'EntityDeletedEvent', 'EntityTouchEvent', 'TakeDamageEvent', 'ModifyCurrencyEvent'], guide: '../plugin-base', position: 28 },
  { slug: 'Schema', title: 'Schema Accessors', types: ['SchemaAccessor', 'SchemaStringAccessor', 'SchemaArrayAccessor'], guide: '../entities', position: 29 },
  { slug: 'Configuration', title: 'Configuration', types: ['IPluginConfig', 'BasePluginConfig'], guide: '../configuration', position: 30 },
  { slug: 'Players', title: 'Players Utility', types: ['Players'], guide: '../players', position: 31 },
];

interface PageGroup {
  slug: string;
  title: string;
  types: string[];
  guide?: string;
  position: number;
}

// ─── Type System ─────────────────────────────────────────────────────────────

interface ParsedMember {
  kind: 'type' | 'method' | 'property' | 'field';
  fullName: string;
  namespace: string;
  typeName: string;       // The owning type (e.g. "CBaseEntity")
  memberName?: string;    // The member name (e.g. "CreateByName") - undefined for types
  summary: string;
  params: { name: string; description: string }[];
  returns?: string;
  typeParams: { name: string; description: string }[];
  rawName: string;        // Original XML name attribute
  isConstructor: boolean;
}

interface TypeInfo {
  name: string;
  fullName: string;
  summary: string;
  constructors: ParsedMember[];
  methods: ParsedMember[];
  properties: ParsedMember[];
  fields: ParsedMember[];
}

// ─── XML Parsing ─────────────────────────────────────────────────────────────

function parseXml(xmlPath: string): ParsedMember[] {
  const xml = fs.readFileSync(xmlPath, 'utf-8');

  // Use regex to extract members — more reliable for mixed content
  const memberRegex = /<member name="([^"]+)">([\s\S]*?)<\/member>/g;
  const members: ParsedMember[] = [];
  let match;

  while ((match = memberRegex.exec(xml)) !== null) {
    const parsed = parseMemberFromRaw(match[1], match[2]);
    if (parsed) members.push(parsed);
  }

  // Also catch self-closing members: <member name="..."></member> or <member name="..."/>
  const emptyRegex = /<member name="([^"]+)"\s*(?:\/>|><\/member>)/g;
  while ((match = emptyRegex.exec(xml)) !== null) {
    const parsed = parseMemberFromRaw(match[1], '');
    if (parsed) members.push(parsed);
  }

  return members;
}

function parseMemberFromRaw(name: string, body: string): ParsedMember | null {
  if (!name || name.length < 3) return null;

  const kindChar = name[0];
  const fullName = name.substring(2);

  let kind: ParsedMember['kind'];
  switch (kindChar) {
    case 'T': kind = 'type'; break;
    case 'M': kind = 'method'; break;
    case 'P': kind = 'property'; break;
    case 'F': kind = 'field'; break;
    default: return null;
  }

  const { typeName, memberName, namespace } = parseFullName(fullName, kind);
  const isConstructor = kind === 'method' && (memberName === '#ctor' || memberName?.includes('#ctor') === true);

  // Extract summary
  const summaryMatch = body.match(/<summary>([\s\S]*?)<\/summary>/);
  const summary = summaryMatch ? processXmlText(summaryMatch[1]) : '';

  // Extract params
  const params: { name: string; description: string }[] = [];
  const paramRegex = /<param name="([^"]+)">([\s\S]*?)<\/param>/g;
  let pm;
  while ((pm = paramRegex.exec(body)) !== null) {
    params.push({ name: pm[1], description: processXmlText(pm[2]) });
  }

  // Extract returns
  const returnsMatch = body.match(/<returns>([\s\S]*?)<\/returns>/);
  const returns = returnsMatch ? processXmlText(returnsMatch[1]) : undefined;

  // Extract typeparams
  const typeParams: { name: string; description: string }[] = [];
  const tpRegex = /<typeparam name="([^"]+)">([\s\S]*?)<\/typeparam>/g;
  let tp;
  while ((tp = tpRegex.exec(body)) !== null) {
    typeParams.push({ name: tp[1], description: processXmlText(tp[2]) });
  }

  return {
    kind,
    fullName,
    namespace,
    typeName,
    memberName,
    summary,
    params,
    returns,
    typeParams,
    rawName: name,
    isConstructor,
  };
}

/** Convert inline XML tags to markdown within summary text */
function processXmlText(xml: string): string {
  let text = xml;

  // <see cref="T:DeadworksManaged.Api.Foo"/> -> `Foo`
  text = text.replace(/<see\s+cref="[TMPFE]:([^"]+)"\s*\/>/g, (_match, cref) => {
    const cleaned = cref.replace(/`\d+/g, '');
    const parts = cleaned.split('.');
    return `\`${parts[parts.length - 1]}\``;
  });

  // <see langword="null"/> -> `null`
  text = text.replace(/<see\s+langword="([^"]+)"\s*\/>/g, '`$1`');

  // <c>...</c> -> `...`
  text = text.replace(/<c>([\s\S]*?)<\/c>/g, '`$1`');

  // <paramref name="x"/> -> *x*
  text = text.replace(/<paramref\s+name="([^"]+)"\s*\/>/g, '*$1*');

  // <typeparamref name="T"/> -> `T`
  text = text.replace(/<typeparamref\s+name="([^"]+)"\s*\/>/g, '`$1`');

  // Strip any remaining XML tags
  text = text.replace(/<[^>]+>/g, '');

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

// (parseMember removed — parseMemberFromRaw handles everything via regex)

function parseFullName(fullName: string, kind: 'type' | 'method' | 'property' | 'field'): { typeName: string; memberName?: string; namespace: string } {
  if (kind === 'type') {
    // Handle generic types: EntityData`1 -> EntityData
    const cleaned = fullName.replace(/`\d+/g, '');
    const lastDot = cleaned.lastIndexOf('.');
    return {
      typeName: cleaned.substring(lastDot + 1),
      namespace: cleaned.substring(0, lastDot),
      memberName: undefined,
    };
  }

  // For members, strip parameters first
  let base = fullName;
  const parenIdx = base.indexOf('(');
  if (parenIdx !== -1) base = base.substring(0, parenIdx);

  // Separate the member name (last segment after last dot, preserving backtick notation)
  // But dots can appear in the namespace/type. Strategy: find the namespace prefix,
  // then split only the remainder.

  // Strip method-level generic backticks (``1) to find the member name boundary,
  // but preserve them in the member name for signature formatting.
  const baseNoGenerics = base.replace(/``\d+/g, '').replace(/`\d+/g, '');
  const parts = baseNoGenerics.split('.');
  const memberNameClean = parts.pop()!;

  // Now extract the actual member name WITH generics from the original
  // Find where memberNameClean starts in base
  const memberStartIdx = base.lastIndexOf('.' + memberNameClean);
  let memberName: string;
  if (memberStartIdx !== -1) {
    // Everything after the last dot is the member name (including ``1)
    memberName = base.substring(memberStartIdx + 1);
  } else {
    memberName = memberNameClean;
  }

  let typeName: string;
  let namespace: string;

  if (parts.length > 0) {
    const nsPrefix = `${CORE_NAMESPACE}.`;
    const rejoined = parts.join('.');
    if (rejoined.startsWith(CORE_NAMESPACE)) {
      namespace = CORE_NAMESPACE;
      const afterNs = rejoined.substring(nsPrefix.length);
      typeName = afterNs || parts[parts.length - 1];
    } else {
      namespace = '';
      typeName = parts[parts.length - 1];
    }
  } else {
    namespace = '';
    typeName = '';
  }

  return { typeName, memberName, namespace };
}

// (Summary text extraction is handled by processXmlText in the parsing section)

// ─── Signature Formatting ───────────────────────────────────────────────────

const TYPE_MAP: Record<string, string> = {
  'System.String': 'string',
  'System.Int32': 'int',
  'System.Int64': 'long',
  'System.UInt32': 'uint',
  'System.UInt64': 'ulong',
  'System.Single': 'float',
  'System.Double': 'double',
  'System.Boolean': 'bool',
  'System.Void': 'void',
  'System.Byte': 'byte',
  'System.IntPtr': 'IntPtr',
  'System.Object': 'object',
  'System.Void*': 'void*',
  'System.Numerics.Vector3': 'Vector3',
  'System.Drawing.Color': 'Color',
};

function simplifyType(fullType: string): string {
  // Handle nullable: System.Nullable{X} -> X?
  const nullableMatch = fullType.match(/^System\.Nullable\{(.+)\}$/);
  if (nullableMatch) {
    return simplifyType(nullableMatch[1]) + '?';
  }

  // Handle generic types: System.Action{X,Y} -> Action<X, Y>
  const genericMatch = fullType.match(/^(.+?)\{(.+)\}$/);
  if (genericMatch) {
    const baseType = simplifyType(genericMatch[1]);
    const args = splitGenericArgs(genericMatch[2]).map(simplifyType);
    return `${baseType}<${args.join(', ')}>`;
  }

  // Handle arrays
  if (fullType.endsWith('[]')) {
    return simplifyType(fullType.slice(0, -2)) + '[]';
  }

  // Direct map
  if (TYPE_MAP[fullType]) return TYPE_MAP[fullType];

  // Strip DeadworksManaged.Api namespace
  if (fullType.startsWith(`${CORE_NAMESPACE}.`)) {
    return fullType.substring(CORE_NAMESPACE.length + 1);
  }

  // Strip System. for common types
  if (fullType.startsWith('System.')) {
    const short = fullType.substring(7);
    // Only strip for well-known types
    if (['Action', 'Func', 'ReadOnlySpan', 'Span', 'IDisposable', 'IEnumerable'].some(t => short.startsWith(t))) {
      return short;
    }
  }

  // Handle by-ref parameters (@ suffix)
  if (fullType.endsWith('@')) {
    return simplifyType(fullType.slice(0, -1));
  }

  // Generic type params like `0, `1, ``0, ``1
  if (fullType.match(/^`+\d+$/)) {
    const idx = parseInt(fullType.replace(/`/g, ''));
    return String.fromCharCode(84 + idx); // T, U, V...
  }

  // Last segment of fully qualified name
  const lastDot = fullType.lastIndexOf('.');
  if (lastDot !== -1) return fullType.substring(lastDot + 1);

  return fullType;
}

function splitGenericArgs(args: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of args) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function formatMethodSignature(member: ParsedMember): string {
  const raw = member.rawName;
  let name = member.memberName || '';

  // Handle constructors
  if (member.isConstructor) {
    name = member.typeName;
  }

  // Handle generic methods: name``1 or name`1 -> name<T>
  const genericMethodMatch = name.match(/^(.+?)`+(\d+)$/);
  if (genericMethodMatch) {
    const count = parseInt(genericMethodMatch[2]);
    const typeArgs = Array.from({ length: count }, (_, i) => String.fromCharCode(84 + i));
    name = `${genericMethodMatch[1]}<${typeArgs.join(', ')}>`;
  }

  // Extract parameters from the raw XML name
  const parenIdx = raw.indexOf('(');
  if (parenIdx === -1) {
    return `${name}()`;
  }

  const paramStr = raw.substring(parenIdx + 1, raw.length - 1);
  if (!paramStr) return `${name}()`;

  const paramTypes = splitGenericArgs(paramStr);
  const paramNames = member.params.map(p => p.name);

  const formattedParams = paramTypes.map((type, i) => {
    const simplified = simplifyType(type);
    const paramName = paramNames[i] || `arg${i}`;
    return `${simplified} ${paramName}`;
  }).join(', ');

  return `${name}(${formattedParams})`;
}

// ─── Type Organization ──────────────────────────────────────────────────────

function organizeIntoTypes(members: ParsedMember[]): Map<string, TypeInfo> {
  const types = new Map<string, TypeInfo>();

  // First pass: create TypeInfo for all T: entries
  for (const m of members) {
    if (m.kind === 'type') {
      types.set(m.typeName, {
        name: m.typeName,
        fullName: m.fullName,
        summary: m.summary,
        constructors: [],
        methods: [],
        properties: [],
        fields: [],
      });
    }
  }

  // Second pass: assign members to their types
  for (const m of members) {
    if (m.kind === 'type') continue;

    const type = types.get(m.typeName);
    if (!type) continue;

    if (m.isConstructor) {
      type.constructors.push(m);
    } else if (m.kind === 'method') {
      type.methods.push(m);
    } else if (m.kind === 'property') {
      type.properties.push(m);
    } else if (m.kind === 'field') {
      type.fields.push(m);
    }
  }

  return types;
}

// ─── Markdown Rendering ─────────────────────────────────────────────────────

function renderPage(group: PageGroup, allTypes: Map<string, TypeInfo>): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`title: "${group.title}"`);
  lines.push(`sidebar_label: "${group.title}"`);
  lines.push(`sidebar_position: ${group.position}`);
  lines.push('---');
  lines.push('');
  lines.push('<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->');
  lines.push('');

  // (guide link removed)

  // Render each type in the group
  const typesInGroup = group.types
    .map(name => findType(name, allTypes))
    .filter((t): t is TypeInfo => t !== null);

  for (let i = 0; i < typesInGroup.length; i++) {
    const type = typesInGroup[i];
    if (i === 0) {
      lines.push(`# ${type.name}`);
    } else {
      lines.push('---');
      lines.push('');
      lines.push(`## ${type.name}`);
    }
    lines.push('');

    if (type.summary) {
      lines.push(`> **Namespace:** \`${CORE_NAMESPACE}\``);
      lines.push('');
      lines.push(type.summary);
      lines.push('');
    }

    // Constructors
    if (type.constructors.length > 0) {
      const heading = i === 0 ? '##' : '###';
      lines.push(`${heading} Constructors`);
      lines.push('');
      lines.push(renderMemberTable(type.constructors, 'method'));
      lines.push('');
    }

    // Properties
    if (type.properties.length > 0) {
      const heading = i === 0 ? '##' : '###';
      lines.push(`${heading} Properties`);
      lines.push('');
      lines.push(renderPropertyTable(type.properties));
      lines.push('');
    }

    // Fields (only if meaningful — skip protobuf FieldNumber constants)
    const meaningfulFields = type.fields.filter(f =>
      !f.memberName?.endsWith('FieldNumber') &&
      !f.summary.includes('Field number for')
    );
    if (meaningfulFields.length > 0) {
      const heading = i === 0 ? '##' : '###';
      lines.push(`${heading} Fields`);
      lines.push('');
      lines.push(renderPropertyTable(meaningfulFields));
      lines.push('');
    }

    // Methods
    const regularMethods = type.methods.filter(m => !m.isConstructor);
    if (regularMethods.length > 0) {
      const heading = i === 0 ? '##' : '###';
      lines.push(`${heading} Methods`);
      lines.push('');
      lines.push(renderMemberTable(regularMethods, 'method'));
      lines.push('');
    }
  }

  return lines.join('\n');
}

function findType(name: string, allTypes: Map<string, TypeInfo>): TypeInfo | null {
  // Exact match
  if (allTypes.has(name)) return allTypes.get(name)!;

  // Try with generic suffix stripped (e.g., "EntityData" matches "EntityData`1")
  for (const [key, value] of allTypes) {
    const stripped = key.replace(/`\d+/g, '');
    if (stripped === name) return value;
  }

  return null;
}

function renderMemberTable(members: ParsedMember[], type: 'method'): string {
  const lines: string[] = [];
  lines.push('| Method | Description |');
  lines.push('|--------|-------------|');
  for (const m of members) {
    const sig = escapeTableCell(formatMethodSignature(m));
    const desc = escapeTableCell(m.summary || buildParamDescription(m));
    lines.push(`| \`${sig}\` | ${desc} |`);
  }
  return lines.join('\n');
}

function renderPropertyTable(members: ParsedMember[]): string {
  const lines: string[] = [];
  lines.push('| Property | Description |');
  lines.push('|----------|-------------|');
  for (const m of members) {
    const name = m.memberName || m.typeName;
    const desc = escapeTableCell(m.summary);
    lines.push(`| \`${name}\` | ${desc} |`);
  }
  return lines.join('\n');
}

function buildParamDescription(m: ParsedMember): string {
  if (m.params.length === 0) return m.returns || '';
  return m.params.map(p => `*${p.name}*: ${p.description}`).join('. ');
}

function escapeTableCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

// ─── Protobuf Index Page ────────────────────────────────────────────────────

function renderProtobufIndex(members: ParsedMember[]): string {
  const lines: string[] = [];

  lines.push('---');
  lines.push('title: "Protobuf Message Types"');
  lines.push('sidebar_label: "Protobuf Messages"');
  lines.push('sidebar_position: 99');
  lines.push('---');
  lines.push('');
  lines.push('<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->');
  lines.push('');
  lines.push('# Protobuf Message Types');
  lines.push('');
  lines.push('These are auto-generated protobuf message types from Valve\'s game definitions.');
  lines.push('They are used with the [NetMessages](../networking) system for sending and hooking network messages.');
  lines.push('');
  lines.push('Each message type has standard protobuf accessors (`Has*`, `Clear*`, field number constants)');
  lines.push('following [Google.Protobuf](https://protobuf.dev/reference/csharp/api-docs/) conventions.');
  lines.push('');

  // Group protobuf types by prefix pattern
  const protoTypes = members.filter(m => m.kind === 'type');
  const groups: Record<string, { name: string; summary: string }[]> = {
    'Citadel User Messages': [],
    'Citadel Client Messages': [],
    'Server Messages': [],
    'User Messages': [],
    'Game Coordinator Messages': [],
    'Other Messages': [],
  };

  for (const t of protoTypes) {
    const name = t.typeName;
    // Skip nested types and reflection holders
    if (name.includes('.') || name.endsWith('Reflection') || name === 'Types') continue;

    const entry = { name, summary: t.summary };
    if (name.startsWith('CCitadelUserMsg_')) groups['Citadel User Messages'].push(entry);
    else if (name.startsWith('CCitadelClientMsg_')) groups['Citadel Client Messages'].push(entry);
    else if (name.startsWith('CSVCMsg') || name.startsWith('CNETMsg')) groups['Server Messages'].push(entry);
    else if (name.startsWith('CUserMessage_')) groups['User Messages'].push(entry);
    else if (name.startsWith('CMsgGC') || name.startsWith('CGCToGCMsg') || name.startsWith('CMsgClientToGC')) groups['Game Coordinator Messages'].push(entry);
    else groups['Other Messages'].push(entry);
  }

  for (const [category, types] of Object.entries(groups)) {
    if (types.length === 0) continue;
    types.sort((a, b) => a.name.localeCompare(b.name));

    lines.push(`## ${category}`);
    lines.push('');
    lines.push('| Type | Description |');
    lines.push('|------|-------------|');
    for (const t of types) {
      lines.push(`| \`${t.name}\` | ${escapeTableCell(t.summary || '')} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log('Parsing XML...');
  const allMembers = parseXml(XML_PATH);
  console.log(`  Parsed ${allMembers.length} members`);

  // Split into core API and protobuf
  const coreMembers = allMembers.filter(m =>
    m.namespace === CORE_NAMESPACE || m.fullName.startsWith(CORE_NAMESPACE + '.')
  );
  const protoMembers = allMembers.filter(m =>
    m.namespace !== CORE_NAMESPACE && !m.fullName.startsWith(CORE_NAMESPACE + '.')
  );

  console.log(`  Core API: ${coreMembers.length} members`);
  console.log(`  Protobuf: ${protoMembers.length} members`);

  // Organize core members into type structures
  const allTypes = organizeIntoTypes(coreMembers);
  console.log(`  Types: ${allTypes.size}`);

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Clean existing generated files
  const existingFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md'));
  for (const f of existingFiles) {
    fs.unlinkSync(path.join(OUTPUT_DIR, f));
  }

  // Track which types are assigned to groups
  const assignedTypes = new Set<string>();
  for (const group of PAGE_GROUPS) {
    for (const typeName of group.types) {
      assignedTypes.add(typeName);
    }
  }

  // Generate grouped pages
  let pageCount = 0;
  for (const group of PAGE_GROUPS) {
    const content = renderPage(group, allTypes);
    const filePath = path.join(OUTPUT_DIR, `${group.slug}.md`);
    fs.writeFileSync(filePath, content, 'utf-8');
    pageCount++;
  }

  // Generate individual pages for unmapped core types
  for (const [name, type] of allTypes) {
    const simpleName = name.replace(/`\d+/g, '');
    if (assignedTypes.has(simpleName)) continue;
    // Skip types with no members and no summary
    if (!type.summary && type.methods.length === 0 && type.properties.length === 0 && type.fields.length === 0) continue;

    const group: PageGroup = {
      slug: simpleName,
      title: simpleName,
      types: [simpleName],
      position: 50 + pageCount,
    };
    const content = renderPage(group, allTypes);
    const filePath = path.join(OUTPUT_DIR, `${group.slug}.md`);
    fs.writeFileSync(filePath, content, 'utf-8');
    pageCount++;
  }

  // Generate protobuf index
  const protoContent = renderProtobufIndex(protoMembers);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'protobuf-messages.md'), protoContent, 'utf-8');
  pageCount++;

  // Generate _category_.json
  const categoryJson = {
    label: 'Class Reference',
    position: 99,
    link: {
      type: 'generated-index',
      title: 'API Class Reference',
      description: 'Auto-generated reference documentation for all DeadworksManaged.Api types.',
    },
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '_category_.json'),
    JSON.stringify(categoryJson, null, 2),
    'utf-8'
  );

  console.log(`\nGenerated ${pageCount} pages in ${OUTPUT_DIR}`);
}

main();
