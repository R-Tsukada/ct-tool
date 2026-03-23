export const COL_W = 100;
export const ROW_H = 78;
export const NODE_W = 90;
export const NODE_H = 34;
export const LABEL_W = 56;
export const MATRIX_ROW_H = 38;
export const DOT_SIZE = 14;

// ── Tree structure helpers ────────────────────────────────────────

export function countLeaves(n) {
  return (!n.children?.length) ? 1 : n.children.reduce((s, c) => s + countLeaves(c), 0);
}

export function computeLayout(root, colOff, treeId, colW = COL_W) {
  const flat = [];
  function go(node, startCol, depth, parentId) {
    const lc = countLeaves(node);
    flat.push({
      id: node.id, name: node.name, treeId, parentId,
      isLeaf: !node.children?.length,
      cx: (colOff + startCol + lc / 2) * colW,
      cy: depth * ROW_H + ROW_H / 2,
      depth,
    });
    let cc = startCol;
    for (const c of (node.children || [])) { go(c, cc, depth + 1, node.id); cc += countLeaves(c); }
  }
  go(root, 0, 0, null);
  return flat;
}

export function updateNode(root, id, fn) {
  if (root.id === id) return fn(root);
  return { ...root, children: (root.children || []).map(c => updateNode(c, id, fn)) };
}

export function deleteNodeFrom(root, id) {
  return { ...root, children: (root.children || []).filter(c => c.id !== id).map(c => deleteNodeFrom(c, id)) };
}

// ── Drag & drop helpers ───────────────────────────────────────────

export function extractNode(root, nodeId) {
  let found = null;
  function go(node) {
    const children = [];
    for (const c of (node.children || [])) {
      if (c.id === nodeId) found = c;
      else children.push(go(c));
    }
    return { ...node, children };
  }
  return [go(root), found];
}

export function getParent(root, nodeId) {
  for (const c of (root.children || [])) {
    if (c.id === nodeId) return root;
    const p = getParent(c, nodeId);
    if (p) return p;
  }
  return null;
}

export function insertAfter(root, afterId, newNode) {
  if (root.id === afterId) {
    return { ...root, children: [...(root.children || []), newNode] };
  }
  const parent = getParent(root, afterId);
  if (!parent) return root;
  function go(node) {
    if (node.id !== parent.id) return { ...node, children: (node.children || []).map(go) };
    const idx = node.children.findIndex(c => c.id === afterId);
    const nc = [...node.children];
    nc.splice(idx + 1, 0, newNode);
    return { ...node, children: nc };
  }
  return go(root);
}

export function insertBefore(root, beforeId, newNode) {
  const parent = getParent(root, beforeId);
  if (!parent) return root;
  function go(node) {
    if (node.id !== parent.id) return { ...node, children: (node.children || []).map(go) };
    const idx = node.children.findIndex(c => c.id === beforeId);
    const nc = [...node.children];
    nc.splice(idx, 0, newNode);
    return { ...node, children: nc };
  }
  return go(root);
}

export function isAncestorOf(root, ancestorId, descId) {
  if (ancestorId === descId) return false;
  function find(node) {
    if (node.id === ancestorId) return check(node, descId);
    return (node.children || []).some(find);
  }
  function check(node, id) {
    if (node.id === id) return true;
    return (node.children || []).some(c => check(c, id));
  }
  return find(root);
}
