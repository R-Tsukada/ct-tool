import { describe, expect, it } from "vitest";
import {
  countLeaves,
  computeLayout,
  updateNode,
  deleteNodeFrom,
  extractNode,
  getParent,
  insertAfter,
  insertBefore,
  isAncestorOf,
  COL_W,
  ROW_H,
} from "../treeHelpers.js";

// ── テスト用ツリー ─────────────────────────────────────────────────
//   root
//   ├─ a
//   │  ├─ a1
//   │  └─ a2
//   └─ b
const makeTree = () => ({
  id: "root",
  name: "ルート",
  children: [
    {
      id: "a",
      name: "A",
      children: [
        { id: "a1", name: "A1", children: [] },
        { id: "a2", name: "A2", children: [] },
      ],
    },
    { id: "b", name: "B", children: [] },
  ],
});

// ── countLeaves ────────────────────────────────────────────────────
describe("countLeaves", () => {
  it("葉ノード単体は1を返す", () => {
    expect(countLeaves({ id: "x", children: [] })).toBe(1);
  });

  it("子なしchildrenも葉として扱う", () => {
    expect(countLeaves({ id: "x" })).toBe(1);
  });

  it("2つの葉を持つルートは2を返す", () => {
    const root = { id: "r", children: [{ id: "a", children: [] }, { id: "b", children: [] }] };
    expect(countLeaves(root)).toBe(2);
  });

  it("3階層ツリーの葉数を正しく数える", () => {
    expect(countLeaves(makeTree())).toBe(3); // a1, a2, b
  });
});

// ── updateNode ────────────────────────────────────────────────────
describe("updateNode", () => {
  it("ルートノードを更新する", () => {
    const root = makeTree();
    const result = updateNode(root, "root", n => ({ ...n, name: "更新済み" }));
    expect(result.name).toBe("更新済み");
    expect(result.children).toHaveLength(2); // 子は変わらない
  });

  it("中間ノードを更新する", () => {
    const result = updateNode(makeTree(), "a", n => ({ ...n, name: "A_updated" }));
    expect(result.children[0].name).toBe("A_updated");
  });

  it("葉ノードを更新する", () => {
    const result = updateNode(makeTree(), "a1", n => ({ ...n, name: "A1_updated" }));
    expect(result.children[0].children[0].name).toBe("A1_updated");
  });

  it("存在しないIDを指定しても元のツリーが返る", () => {
    const tree = makeTree();
    const result = updateNode(tree, "nonexistent", n => ({ ...n, name: "X" }));
    expect(result).toEqual(tree);
  });
});

// ── deleteNodeFrom ────────────────────────────────────────────────
describe("deleteNodeFrom", () => {
  it("直接の子ノードを削除する", () => {
    const result = deleteNodeFrom(makeTree(), "b");
    expect(result.children).toHaveLength(1);
    expect(result.children[0].id).toBe("a");
  });

  it("孫ノードを削除する", () => {
    const result = deleteNodeFrom(makeTree(), "a1");
    expect(result.children[0].children).toHaveLength(1);
    expect(result.children[0].children[0].id).toBe("a2");
  });

  it("中間ノードを削除するとその子孱も消える", () => {
    const result = deleteNodeFrom(makeTree(), "a");
    expect(result.children).toHaveLength(1);
    expect(result.children[0].id).toBe("b");
  });

  it("存在しないIDを指定しても元のツリーが返る", () => {
    const tree = makeTree();
    const result = deleteNodeFrom(tree, "nonexistent");
    expect(result).toEqual(tree);
  });
});

// ── getParent ─────────────────────────────────────────────────────
describe("getParent", () => {
  it("直接の子の親を返す", () => {
    const result = getParent(makeTree(), "a");
    expect(result.id).toBe("root");
  });

  it("孫の親を返す", () => {
    const result = getParent(makeTree(), "a1");
    expect(result.id).toBe("a");
  });

  it("ルートの親はnullを返す", () => {
    expect(getParent(makeTree(), "root")).toBeNull();
  });

  it("存在しないIDはnullを返す", () => {
    expect(getParent(makeTree(), "nonexistent")).toBeNull();
  });
});

// ── insertAfter ───────────────────────────────────────────────────
describe("insertAfter", () => {
  it("指定ノードの直後に挿入する", () => {
    const newNode = { id: "c", name: "C", children: [] };
    const result = insertAfter(makeTree(), "a", newNode);
    expect(result.children.map(c => c.id)).toEqual(["a", "c", "b"]);
  });

  it("末尾ノードの後に挿入する", () => {
    const newNode = { id: "c", name: "C", children: [] };
    const result = insertAfter(makeTree(), "b", newNode);
    expect(result.children.map(c => c.id)).toEqual(["a", "b", "c"]);
  });

  it("ルートIDを指定すると子の末尾に追加する", () => {
    const newNode = { id: "c", name: "C", children: [] };
    const result = insertAfter(makeTree(), "root", newNode);
    expect(result.children.map(c => c.id)).toEqual(["a", "b", "c"]);
  });

  it("孫の後に挿入する", () => {
    const newNode = { id: "a3", name: "A3", children: [] };
    const result = insertAfter(makeTree(), "a1", newNode);
    expect(result.children[0].children.map(c => c.id)).toEqual(["a1", "a3", "a2"]);
  });
});

// ── insertBefore ──────────────────────────────────────────────────
describe("insertBefore", () => {
  it("指定ノードの直前に挿入する", () => {
    const newNode = { id: "c", name: "C", children: [] };
    const result = insertBefore(makeTree(), "b", newNode);
    expect(result.children.map(c => c.id)).toEqual(["a", "c", "b"]);
  });

  it("先頭ノードの前に挿入する", () => {
    const newNode = { id: "z", name: "Z", children: [] };
    const result = insertBefore(makeTree(), "a", newNode);
    expect(result.children.map(c => c.id)).toEqual(["z", "a", "b"]);
  });

  it("孫の前に挿入する", () => {
    const newNode = { id: "a0", name: "A0", children: [] };
    const result = insertBefore(makeTree(), "a1", newNode);
    expect(result.children[0].children.map(c => c.id)).toEqual(["a0", "a1", "a2"]);
  });
});

// ── extractNode ───────────────────────────────────────────────────
describe("extractNode", () => {
  it("子ノードを取り出す", () => {
    const [newRoot, extracted] = extractNode(makeTree(), "b");
    expect(extracted.id).toBe("b");
    expect(newRoot.children).toHaveLength(1);
    expect(newRoot.children[0].id).toBe("a");
  });

  it("孫ノードを取り出す", () => {
    const [newRoot, extracted] = extractNode(makeTree(), "a1");
    expect(extracted.id).toBe("a1");
    expect(newRoot.children[0].children).toHaveLength(1);
    expect(newRoot.children[0].children[0].id).toBe("a2");
  });

  it("存在しないIDはnullを返す", () => {
    const [, extracted] = extractNode(makeTree(), "nonexistent");
    expect(extracted).toBeNull();
  });
});

// ── isAncestorOf ──────────────────────────────────────────────────
describe("isAncestorOf", () => {
  it("ルートは全ノードの祖先", () => {
    const tree = makeTree();
    expect(isAncestorOf(tree, "root", "a")).toBe(true);
    expect(isAncestorOf(tree, "root", "a1")).toBe(true);
    expect(isAncestorOf(tree, "root", "b")).toBe(true);
  });

  it("中間ノードはその子孙の祖先", () => {
    expect(isAncestorOf(makeTree(), "a", "a1")).toBe(true);
    expect(isAncestorOf(makeTree(), "a", "a2")).toBe(true);
  });

  it("兄弟ノードは祖先でない", () => {
    expect(isAncestorOf(makeTree(), "a", "b")).toBe(false);
    expect(isAncestorOf(makeTree(), "b", "a")).toBe(false);
  });

  it("子は親の祖先でない", () => {
    expect(isAncestorOf(makeTree(), "a1", "a")).toBe(false);
    expect(isAncestorOf(makeTree(), "a", "root")).toBe(false);
  });

  it("自身は祖先でない", () => {
    expect(isAncestorOf(makeTree(), "a", "a")).toBe(false);
  });
});

// ── computeLayout ─────────────────────────────────────────────────
describe("computeLayout", () => {
  // 葉1枚のシンプルなツリー: root(葉)
  const singleLeaf = { id: "r", name: "ルート", children: [] };

  // 葉2枚: root → [left, right]
  const twoLeaves = {
    id: "r", name: "ルート", children: [
      { id: "L", name: "左", children: [] },
      { id: "R", name: "右", children: [] },
    ],
  };

  // 3階層: root → [a → [a1, a2], b]  (葉: a1, a2, b)
  const threeLevel = {
    id: "r", name: "ルート", children: [
      { id: "a", name: "A", children: [
        { id: "a1", name: "A1", children: [] },
        { id: "a2", name: "A2", children: [] },
      ]},
      { id: "b", name: "B", children: [] },
    ],
  };

  it("葉1枚のルートは colOff=0 の中央に配置される", () => {
    const nodes = computeLayout(singleLeaf, 0, "t1");
    const root = nodes.find(n => n.id === "r");
    expect(root.cx).toBe(COL_W / 2);
    expect(root.cy).toBe(ROW_H / 2);
  });

  it("colOff を指定するとその分 cx がずれる", () => {
    const base = computeLayout(singleLeaf, 0, "t1");
    const shifted = computeLayout(singleLeaf, 3, "t1");
    expect(shifted[0].cx - base[0].cx).toBe(3 * COL_W);
  });

  it("葉2枚のツリーでルートが中央、葉が左右に配置される", () => {
    const nodes = computeLayout(twoLeaves, 0, "t1");
    const root = nodes.find(n => n.id === "r");
    const left = nodes.find(n => n.id === "L");
    const right = nodes.find(n => n.id === "R");
    expect(root.cx).toBe(COL_W);          // (0 + 1) * COL_W = 中央
    expect(left.cx).toBe(COL_W / 2);      // 左葉
    expect(right.cx).toBe(COL_W * 1.5);   // 右葉
  });

  it("depth が cx ではなく cy に反映される", () => {
    const nodes = computeLayout(twoLeaves, 0, "t1");
    const root = nodes.find(n => n.id === "r");
    const leaf = nodes.find(n => n.id === "L");
    expect(root.cy).toBe(ROW_H / 2);          // depth=0
    expect(leaf.cy).toBe(ROW_H + ROW_H / 2);  // depth=1
  });

  it("isLeaf フラグが正しく設定される", () => {
    const nodes = computeLayout(twoLeaves, 0, "t1");
    expect(nodes.find(n => n.id === "r").isLeaf).toBe(false);
    expect(nodes.find(n => n.id === "L").isLeaf).toBe(true);
    expect(nodes.find(n => n.id === "R").isLeaf).toBe(true);
  });

  it("parentId が正しく設定される", () => {
    const nodes = computeLayout(twoLeaves, 0, "t1");
    expect(nodes.find(n => n.id === "r").parentId).toBeNull();
    expect(nodes.find(n => n.id === "L").parentId).toBe("r");
    expect(nodes.find(n => n.id === "R").parentId).toBe("r");
  });

  it("treeId が全ノードに付与される", () => {
    const nodes = computeLayout(twoLeaves, 0, "myTree");
    expect(nodes.every(n => n.treeId === "myTree")).toBe(true);
  });

  it("カスタム colW を指定するとその幅で計算される", () => {
    const customColW = 200;
    const nodes = computeLayout(singleLeaf, 0, "t1", customColW);
    expect(nodes[0].cx).toBe(customColW / 2);
  });

  it("3階層ツリーで全ノードの位置が正しい", () => {
    const nodes = computeLayout(threeLevel, 0, "t1");
    const root = nodes.find(n => n.id === "r");
    const a    = nodes.find(n => n.id === "a");
    const a1   = nodes.find(n => n.id === "a1");
    const a2   = nodes.find(n => n.id === "a2");
    const b    = nodes.find(n => n.id === "b");

    // ルートは葉3枚の中央 → col 1.5
    expect(root.cx).toBe(1.5 * COL_W);
    // a は葉2枚(a1,a2)の中央 → col 1.0
    expect(a.cx).toBe(1.0 * COL_W);
    // a1 は col 0.5、a2 は col 1.5、b は col 2.5
    expect(a1.cx).toBe(0.5 * COL_W);
    expect(a2.cx).toBe(1.5 * COL_W);
    expect(b.cx).toBe(2.5 * COL_W);
    // depth
    expect(root.cy).toBe(ROW_H * 0.5);
    expect(a.cy).toBe(ROW_H * 1.5);
    expect(a1.cy).toBe(ROW_H * 2.5);
  });
});
