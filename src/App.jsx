import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  COL_W, ROW_H, LABEL_W,
  countLeaves, computeLayout,
  updateNode, deleteNodeFrom,
  extractNode, isAncestorOf, insertAfter, insertBefore,
} from "./treeHelpers";
import TreeCanvas from "./TreeCanvas";
import MatrixTable from "./MatrixTable";
import Sidebar from "./Sidebar";

// ── ID generation ─────────────────────────────────────────────────
let _uid = 2000;
const uid = () => `u${_uid++}`;

// ── Initial data ──────────────────────────────────────────────────
const INIT_TREES = [
  { id: "t1", root: { id: "n1", name: "分類1", children: [
    { id: "n2", name: "値A", children: [] },
    { id: "n3", name: "値B", children: [] },
  ]}},
  { id: "t2", root: { id: "n4", name: "分類2", children: [
    { id: "n5", name: "値A", children: [] },
    { id: "n6", name: "値B", children: [] },
  ]}},
];
const INIT_TEST_CASES = [
  { id: "tc1", sel: {} },
  { id: "tc2", sel: {} },
  { id: "tc3", sel: {} },
];

const PROJECTS_KEY = "ct-tool-projects";
const LEGACY_KEY   = "ct-tool-data";

function scanIds(obj) {
  if (!obj || typeof obj !== "object") return;
  if (typeof obj.id === "string" && obj.id.startsWith("u")) {
    const n = parseInt(obj.id.slice(1));
    if (!isNaN(n) && n >= _uid) _uid = n + 1;
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) v.forEach(scanIds);
    else if (v && typeof v === "object") scanIds(v);
  }
}

function loadStore() {
  try {
    // 新形式
    const saved = localStorage.getItem(PROJECTS_KEY);
    if (saved) {
      const store = JSON.parse(saved);
      store.projects.forEach(scanIds);
      return store;
    }
    // 旧形式からマイグレーション
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy);
      scanIds(old);
      const project = { id: uid(), name: "デフォルト", trees: old.trees, testCases: old.testCases };
      return { activeId: project.id, projects: [project] };
    }
  } catch { /* fall through */ }
  // 初期データ
  const project = { id: "p1", name: "プロジェクト1", trees: INIT_TREES, testCases: INIT_TEST_CASES };
  return { activeId: "p1", projects: [project] };
}

function treeToMd(node, depth = 0) {
  let md = depth === 0 ? `## ${node.name}\n` : `${"  ".repeat(depth - 1)}- ${node.name}\n`;
  for (const child of (node.children || [])) md += treeToMd(child, depth + 1);
  return md;
}

// ── App ───────────────────────────────────────────────────────────
export default function App() {
  const [store, setStore]         = useState(loadStore);
  const [editing, setEditing]     = useState(null);
  const [drag, setDrag]           = useState(null);
  const [copied, setCopied]       = useState(false);
  const [nodeTheme, setNodeTheme] = useState(() => localStorage.getItem("ct-tool-node-theme") || "minimal");
  const [containerWidth, setContainerWidth] = useState(0);

  const treeContainerRef = useRef(null);
  const outerRef         = useRef(null);

  // Stable refs to avoid stale closures in drag handlers
  const dragRef     = useRef(null);
  const allNodesRef = useRef([]);
  const dataRef     = useRef(null);

  // ── Active project ───────────────────────────────────────────────
  const data = useMemo(() => {
    const p = store.projects.find(p => p.id === store.activeId);
    return { trees: p?.trees ?? [], testCases: p?.testCases ?? [] };
  }, [store]);

  // setData: アクティブプロジェクトの trees/testCases のみ更新
  const setData = useCallback((fn) => {
    setStore(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === s.activeId
          ? { ...p, ...fn({ trees: p.trees, testCases: p.testCases }) }
          : p
      ),
    }));
  }, []);

  // ── Layout ──────────────────────────────────────────────────────
  const layout = useMemo(() => {
    const totalCols = data.trees.reduce((s, t) => s + countLeaves(t.root), 0);
    const effectiveColW = containerWidth > 0
      ? Math.max(COL_W, Math.floor((containerWidth - LABEL_W) / Math.max(totalCols, 1)))
      : COL_W;
    let colOff = 0; const trees = []; let maxDepth = 0;
    for (const tree of data.trees) {
      const nodes = computeLayout(tree.root, colOff, tree.id, effectiveColW);
      const d     = Math.max(...nodes.map(n => n.depth), 0);
      const lc    = countLeaves(tree.root);
      trees.push({ treeId: tree.id, nodes, leaves: nodes.filter(n => n.isLeaf), colEnd: colOff + lc });
      colOff += lc; maxDepth = Math.max(maxDepth, d);
    }
    return { trees, allLeaves: trees.flatMap(t => t.leaves), totalCols: colOff, maxDepth, effectiveColW };
  }, [data.trees, containerWidth]);

  const allNodes = useMemo(() => layout.trees.flatMap(t => t.nodes), [layout]);
  const svgW = layout.totalCols * layout.effectiveColW;
  const svgH = (layout.maxDepth + 1) * ROW_H;

  // ── Effects ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { dragRef.current = drag; },          [drag]);
  useEffect(() => { allNodesRef.current = allNodes; },  [allNodes]);
  useEffect(() => { dataRef.current = data; },          [data]);

  useEffect(() => { localStorage.setItem(PROJECTS_KEY, JSON.stringify(store)); }, [store]);
  useEffect(() => { localStorage.setItem("ct-tool-node-theme", nodeTheme); }, [nodeTheme]);

  // ── Drag handlers ────────────────────────────────────────────────
  const handleNodeMouseDown = useCallback((e, nodeId, treeId, name) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const onMoveBeforeDrag = (moveE) => {
      if (Math.abs(moveE.clientX - startX) > 4 || Math.abs(moveE.clientY - startY) > 4) {
        setDrag({ nodeId, treeId, ghostName: name, ghostX: moveE.clientX, ghostY: moveE.clientY, targetId: null, targetTreeId: null });
        cleanup();
      }
    };
    const cleanup = () => {
      document.removeEventListener("mousemove", onMoveBeforeDrag);
      document.removeEventListener("mouseup", cleanup);
    };
    document.addEventListener("mousemove", onMoveBeforeDrag);
    document.addEventListener("mouseup", cleanup);
  }, []);

  useEffect(() => {
    if (!drag) return;

    const onMove = (e) => {
      if (!treeContainerRef.current) return;
      const rect = treeContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const current = dragRef.current;
      if (!current) return;

      let targetNode = null;
      for (const node of allNodesRef.current) {
        if (Math.abs(x - node.cx) > 51 || Math.abs(y - node.cy) > 23) continue;
        if (node.id === current.nodeId) break;
        const srcTree = dataRef.current.trees.find(t => t.id === current.treeId);
        if (srcTree && isAncestorOf(srcTree.root, current.nodeId, node.id)) break;
        targetNode = node;
        break;
      }
      setDrag(d => d ? { ...d, ghostX: e.clientX, ghostY: e.clientY, targetId: targetNode?.id ?? null, targetTreeId: targetNode?.treeId ?? null } : null);
    };

    const onUp = () => {
      const d = dragRef.current;
      if (d?.targetId) {
        setData(prev => {
          const { nodeId, treeId: fromTreeId, targetId, targetTreeId } = d;
          if (nodeId === targetId) return prev;
          const fromTree = prev.trees.find(t => t.id === fromTreeId);
          const toTree   = prev.trees.find(t => t.id === targetTreeId);
          if (!fromTree || !toTree) return prev;
          if (nodeId === fromTree.root.id) return prev;
          if (fromTreeId === targetTreeId && isAncestorOf(fromTree.root, nodeId, targetId)) return prev;

          const [newFromRoot, extracted] = extractNode(fromTree.root, nodeId);
          if (!extracted) return prev;

          const draggedNode  = allNodesRef.current.find(n => n.id === nodeId);
          const targetLNode  = allNodesRef.current.find(n => n.id === targetId);
          const useBefore    = draggedNode && targetLNode && draggedNode.cx > targetLNode.cx;
          const baseDestRoot = fromTreeId === targetTreeId ? newFromRoot : toTree.root;
          const newToRoot    = useBefore
            ? insertBefore(baseDestRoot, targetId, extracted)
            : insertAfter(baseDestRoot, targetId, extracted);

          return {
            ...prev,
            trees: prev.trees.map(t => {
              if (t.id === fromTreeId && t.id === targetTreeId) return { ...t, root: newToRoot };
              if (t.id === fromTreeId)   return { ...t, root: newFromRoot };
              if (t.id === targetTreeId) return { ...t, root: newToRoot };
              return t;
            }),
          };
        });
      }
      setDrag(null);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [!!drag]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data handlers ────────────────────────────────────────────────
  const toggle    = useCallback((tcId, leafId) =>
    setData(d => ({ ...d, testCases: d.testCases.map(tc =>
      tc.id === tcId ? { ...tc, sel: { ...tc.sel, [leafId]: !tc.sel[leafId] } } : tc) })), [setData]);

  const startEdit  = useCallback((nodeId, treeId, name) => setEditing({ nodeId, treeId, value: name }), []);
  const commitEdit = useCallback(() => {
    if (!editing) return;
    const { nodeId, treeId, value } = editing;
    setData(d => ({ ...d, trees: d.trees.map(t =>
      t.id === treeId ? { ...t, root: updateNode(t.root, nodeId, n => ({ ...n, name: value })) } : t) }));
    setEditing(null);
  }, [editing, setData]);

  const addChild  = useCallback((treeId, nodeId) =>
    setData(d => ({ ...d, trees: d.trees.map(t =>
      t.id === treeId ? { ...t, root: updateNode(t.root, nodeId, n =>
        ({ ...n, children: [...(n.children || []), { id: uid(), name: "新規", children: [] }] })) } : t) })), [setData]);

  const delNode   = useCallback((treeId, nodeId) =>
    setData(d => ({ ...d, trees: d.trees.map(t =>
      t.id === treeId ? { ...t, root: deleteNodeFrom(t.root, nodeId) } : t) })), [setData]);

  const delTree   = useCallback((treeId) =>
    setData(d => ({ ...d, trees: d.trees.filter(t => t.id !== treeId) })), [setData]);

  const addTree   = useCallback(() => {
    const [i1, i2, i3] = [uid(), uid(), uid()];
    setData(d => ({ ...d, trees: [...d.trees, { id: uid(), root:
      { id: i1, name: "新規分類", children: [
        { id: i2, name: "値A", children: [] },
        { id: i3, name: "値B", children: [] },
      ]}}]}));
  }, [setData]);

  const addTC     = useCallback(() =>
    setData(d => ({ ...d, testCases: [...d.testCases, { id: uid(), sel: {} }] })), [setData]);

  const delTC     = useCallback((tcId) =>
    setData(d => ({ ...d, testCases: d.testCases.filter(tc => tc.id !== tcId) })), [setData]);

  const exportMarkdown = useCallback(() => {
    const treeNameMap = Object.fromEntries(data.trees.map(t => [t.id, t.root.name]));
    let md = "# Classification Tree\n\n";
    for (const tree of data.trees) md += treeToMd(tree.root) + "\n";
    if (data.testCases.length > 0 && layout.allLeaves.length > 0) {
      const headers = layout.allLeaves.map(l => `${treeNameMap[l.treeId]} / ${l.name}`);
      md += "## テストケース\n\n";
      md += `| TC | ${headers.join(" | ")} |\n`;
      md += `|----| ${"--- | ".repeat(headers.length)}\n`;
      for (let i = 0; i < data.testCases.length; i++) {
        const tc = data.testCases[i];
        md += `| ${i + 1} | ${layout.allLeaves.map(l => tc.sel[l.id] ? "●" : "").join(" | ")} |\n`;
      }
    }
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data, layout]);

  // ── Project handlers ─────────────────────────────────────────────
  const switchProject = useCallback((id) => {
    setEditing(null);
    setDrag(null);
    setStore(s => ({ ...s, activeId: id }));
  }, []);

  const addProject = useCallback(() => {
    const id = uid();
    setStore(s => {
      const project = {
        id,
        name: `プロジェクト ${s.projects.length + 1}`,
        trees: [{ id: uid(), root: { id: uid(), name: "新規分類", children: [
          { id: uid(), name: "値A", children: [] },
          { id: uid(), name: "値B", children: [] },
        ]}}],
        testCases: [{ id: uid(), sel: {} }],
      };
      return { activeId: id, projects: [...s.projects, project] };
    });
  }, []);

  const renameProject = useCallback((id, name) => {
    setStore(s => ({ ...s, projects: s.projects.map(p => p.id === id ? { ...p, name } : p) }));
  }, []);

  const deleteProject = useCallback((id) => {
    setStore(s => {
      if (s.projects.length <= 1) return s;
      const next = s.projects.filter(p => p.id !== id);
      const activeId = s.activeId === id ? next[0].id : s.activeId;
      return { activeId, projects: next };
    });
  }, []);

  // ── Footer stats ─────────────────────────────────────────────────
  const leafIds      = useMemo(() => new Set(layout.allLeaves.map(l => l.id)), [layout]);
  const selectedDots = useMemo(() =>
    data.testCases.reduce((s, tc) =>
      s + Object.entries(tc.sel).filter(([id, v]) => v && leafIds.has(id)).length, 0),
    [data.testCases, leafIds]);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: "#FAFAFA", minHeight: "100vh",
      display: "flex",
      color: "#18181B",
      userSelect: drag ? "none" : "auto",
    }}>
      <Sidebar
        store={store}
        onSwitch={switchProject}
        onAdd={addProject}
        onRename={renameProject}
        onDelete={deleteProject}
      />

      <main style={{ flex: 1, padding: "20px 24px", minWidth: 0 }}>
        {/* Drag ghost */}
        {drag && (
          <div style={{
            position: "fixed", left: drag.ghostX + 16, top: drag.ghostY - 20,
            zIndex: 9999, pointerEvents: "none",
            padding: "5px 12px", borderRadius: 7,
            background: "#18181B", color: "#FAFAFA",
            fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            ⠿ {drag.ghostName}
            {drag.targetId
              ? <span style={{ marginLeft: 8, opacity: 0.7, fontSize: 10 }}>→ ドロップ可</span>
              : <span style={{ marginLeft: 8, opacity: 0.4, fontSize: 10 }}>…</span>
            }
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 11, color: "#A1A1AA", letterSpacing: "0.12em", marginBottom: 2 }}>TEST DESIGN TOOL</div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#18181B" }}>Classification Tree</h1>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", border: "1px solid #E4E4E7", borderRadius: 6, overflow: "hidden", fontSize: 12 }}>
            {["minimal", "color"].map(t => (
              <button key={t} onClick={() => setNodeTheme(t)} style={{
                padding: "7px 14px", border: "none", cursor: "pointer",
                backgroundColor: nodeTheme === t ? "#18181B" : "transparent",
                color: nodeTheme === t ? "#FFFFFF" : "#71717A",
              }}>
                {t === "minimal" ? "ミニマル" : "カラー"}
              </button>
            ))}
          </div>
          <button onClick={exportMarkdown} style={{ padding: "7px 16px", borderRadius: 6, border: "1px solid #E4E4E7", backgroundColor: "transparent", color: copied ? "#6366F1" : "#71717A", cursor: "pointer", fontSize: 12 }}>
            {copied ? "✓ コピー済み" : "MD コピー"}
          </button>
          <button onClick={addTree} style={{ padding: "7px 16px", borderRadius: 6, border: "1px solid #E4E4E7", backgroundColor: "transparent", color: "#18181B", cursor: "pointer", fontSize: 12 }}>
            ＋ 分類追加
          </button>
        </div>

        {/* Instructions */}
        <div style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span><span style={{ color: "#18181B", fontWeight: 600 }}>太枠</span> = 分類ルート</span>
          <span><span style={{ color: "#F97316" }}>ドラッグ</span>でノード移動 ／ クリックで名前編集 ／ ホバーで＋／✕</span>
          <span>● マトリクスをクリックで点を打てます</span>
        </div>

        {/* Main canvas */}
        <div ref={outerRef} style={{ overflowX: "auto" }}>
          <div style={{ display: "inline-block", minWidth: "max-content" }}>
            <TreeCanvas
              layout={layout} treeContainerRef={treeContainerRef}
              svgW={svgW} svgH={svgH}
              nodeTheme={nodeTheme} editing={editing} drag={drag}
              onMouseDown={handleNodeMouseDown}
              onStartEdit={startEdit} onCommitEdit={commitEdit} onSetEditing={setEditing}
              onAddChild={addChild} onDeleteNode={delNode} onDeleteTree={delTree}
            />
            <MatrixTable
              layout={layout} testCases={data.testCases}
              onToggle={toggle} onAddTC={addTC} onDelTC={delTC}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, fontSize: 11, color: "#D4D4D8", display: "flex", gap: 20 }}>
          <span>分類: {data.trees.length}</span>
          <span>葉ノード: {layout.allLeaves.length}</span>
          <span>テストケース: {data.testCases.length}</span>
          <span>選択済みドット: {selectedDots}</span>
        </div>
      </main>
    </div>
  );
}
