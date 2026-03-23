import { describe, expect, it } from "vitest";
import {
  countLeaves,
  updateNode,
  deleteNodeFrom,
  extractNode,
  getParent,
  insertAfter,
  insertBefore,
  isAncestorOf,
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
