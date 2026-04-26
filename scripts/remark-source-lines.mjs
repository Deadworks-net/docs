const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "list",
  "blockquote",
  "code",
  "thematicBreak",
  "table",
]);

function walk(node, fn, depth = 0) {
  fn(node, depth);
  if (node.children) for (const c of node.children) walk(c, fn, depth + 1);
}

export default function remarkSourceLines() {
  return (tree, file) => {
    let tagged = 0;
    walk(tree, (node, depth) => {
      if (depth === 0) return;
      if (!BLOCK_TYPES.has(node.type)) return;
      if (!node.position) return;
      node.data ??= {};
      node.data.hProperties ??= {};
      node.data.hProperties["data-md-start"] = String(node.position.start.line);
      node.data.hProperties["data-md-end"] = String(node.position.end.line);
      tagged++;
    });
    if (process.env.DEV_EDITOR_DEBUG) {
      // eslint-disable-next-line no-console
      console.log(`[remark-source-lines] tagged ${tagged} blocks in ${file?.path ?? "<unknown>"}`);
    }
  };
}
