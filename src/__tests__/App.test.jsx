import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App.jsx";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ── 初期表示 ──────────────────────────────────────────────────────
describe("初期表示", () => {
  it("2つの分類ツリーが表示される", () => {
    render(<App />);
    expect(screen.getByText("分類1")).toBeInTheDocument();
    expect(screen.getByText("分類2")).toBeInTheDocument();
  });

  it("各ツリーの初期葉ノードが表示される", () => {
    render(<App />);
    // ツリースパン(2) + マトリクスヘッダーth(2) = 合計4
    expect(screen.getAllByText("値A")).toHaveLength(4);
    expect(screen.getAllByText("値B")).toHaveLength(4);
  });

  it("テストケースが3行表示される（行番号1〜3）", () => {
    render(<App />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("ヘッダータイトルが表示される", () => {
    render(<App />);
    expect(screen.getByText("Classification Tree")).toBeInTheDocument();
    expect(screen.getByText("TEST DESIGN TOOL")).toBeInTheDocument();
  });
});

// ── テストケース操作 ──────────────────────────────────────────────
describe("テストケース操作", () => {
  it("「＋ テストケース追加」で行が増える", async () => {
    const user = userEvent.setup();
    render(<App />);
    const before = screen.getAllByRole("button", { name: /del/i }).length;
    await user.click(screen.getByText("＋ テストケース追加"));
    const after = screen.getAllByRole("button", { name: /del/i }).length;
    expect(after).toBe(before + 1);
  });

  it("delボタンでテストケースを削除できる", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    const before = screen.getAllByRole("button", { name: /del/i }).length;
    await user.click(screen.getAllByRole("button", { name: /del/i })[0]);
    const after = screen.getAllByRole("button", { name: /del/i }).length;
    expect(after).toBe(before - 1);
  });

  it("削除確認でキャンセルするとテストケースが残る", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />);
    const before = screen.getAllByRole("button", { name: /del/i }).length;
    await user.click(screen.getAllByRole("button", { name: /del/i })[0]);
    const after = screen.getAllByRole("button", { name: /del/i }).length;
    expect(after).toBe(before);
  });
});

// ── マトリクス操作 ────────────────────────────────────────────────
describe("マトリクス操作", () => {
  it("セルをクリックするとドットが表示される", async () => {
    const user = userEvent.setup();
    render(<App />);
    const cells = screen.getAllByRole("cell");
    // 最初のデータセル（行番号列の次）をクリック
    const dataCell = cells.find(c => c.style.cursor === "pointer");
    expect(dataCell).toBeDefined();
    expect(within(dataCell).queryByRole("img", { hidden: true })).toBeNull();
    await user.click(dataCell);
    // ドット(div)が出現することを確認
    expect(dataCell.querySelector("div")).toBeTruthy();
  });

  it("ドットのあるセルを再クリックするとドットが消える", async () => {
    const user = userEvent.setup();
    render(<App />);
    const cells = screen.getAllByRole("cell");
    const dataCell = cells.find(c => c.style.cursor === "pointer");
    await user.click(dataCell);
    expect(dataCell.querySelector("div")).toBeTruthy();
    await user.click(dataCell);
    expect(dataCell.querySelector("div")).toBeNull();
  });
});

// ── 分類追加 ─────────────────────────────────────────────────────
describe("分類追加", () => {
  it("「＋ 分類追加」で新しい分類が表示される", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("＋ 分類追加"));
    expect(screen.getByText("新規分類")).toBeInTheDocument();
  });
});

// ── ノード操作 ────────────────────────────────────────────────────
describe("ノード操作", () => {
  it("ノードをクリックすると名前編集用inputが表示される", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nodeSpan = screen.getByText("分類1");
    await user.click(nodeSpan);
    expect(screen.getByDisplayValue("分類1")).toBeInTheDocument();
  });

  it("inputでEnterを押すと名前が確定される", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("分類1"));
    const input = screen.getByDisplayValue("分類1");
    await user.clear(input);
    await user.type(input, "テスト分類{Enter}");
    expect(screen.getByText("テスト分類")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("テスト分類")).toBeNull();
  });

  it("ホバーで子ノード追加ボタンが表示される", async () => {
    render(<App />);
    // ツリーノードのspan（複数あるので最初の1つ）
    const nodeSpan = screen.getAllByText("値A")[0].parentElement;
    fireEvent.mouseEnter(nodeSpan);
    expect(screen.getByTitle("子ノードを追加")).toBeInTheDocument();
  });

  it("子ノード追加ボタンで新規ノードが追加される", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nodeSpan = screen.getAllByText("値A")[0].parentElement;
    fireEvent.mouseEnter(nodeSpan);
    await user.click(screen.getByTitle("子ノードを追加"));
    expect(screen.getAllByText("新規").length).toBeGreaterThan(0);
  });

  it("削除ボタンでノードを削除できる", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    const nodeSpan = screen.getAllByText("値A")[0].parentElement;
    fireEvent.mouseEnter(nodeSpan);
    await user.click(screen.getByTitle("削除"));
    // span 2個 + th 2個 → 削除後は span 1個 + th 1個 = 合計2
    expect(screen.getAllByText("値A")).toHaveLength(2);
  });

  it("削除確認でキャンセルするとノードが残る", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />);
    fireEvent.mouseEnter(screen.getAllByText("値A")[0].parentElement);
    await user.click(screen.getByTitle("削除"));
    expect(screen.getAllByText("値A")).toHaveLength(4);
  });
});

// ── localStorage 永続化 ───────────────────────────────────────────
describe("localStorage 永続化", () => {
  it("初期データがlocalStorageに保存される", () => {
    render(<App />);
    const saved = JSON.parse(localStorage.getItem("ct-tool-projects"));
    expect(saved).not.toBeNull();
    expect(saved.projects[0].trees).toHaveLength(2);
  });

  it("テストケース追加後にlocalStorageが更新される", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("＋ テストケース追加"));
    const saved = JSON.parse(localStorage.getItem("ct-tool-projects"));
    const activeProject = saved.projects.find(p => p.id === saved.activeId);
    expect(activeProject.testCases).toHaveLength(4);
  });

  it("ページ再読み込みを模して保存済みデータを復元する", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    // 分類名を変更
    await user.click(screen.getByText("分類1"));
    const input = screen.getByDisplayValue("分類1");
    await user.clear(input);
    await user.type(input, "保存テスト{Enter}");
    unmount();
    // 再マウント → localStorageから復元されるはず
    render(<App />);
    expect(screen.getByText("保存テスト")).toBeInTheDocument();
  });
});

// ── Markdown エクスポート ─────────────────────────────────────────
describe("Markdownエクスポート", () => {
  it("「MD コピー」でクリップボードにMarkdownが書き込まれる", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<App />);
    await user.click(screen.getByText("MD コピー"));
    expect(writeText).toHaveBeenCalledOnce();
    const md = writeText.mock.calls[0][0];
    expect(md).toContain("# Classification Tree");
    expect(md).toContain("## 分類1");
    expect(md).toContain("## 分類2");
    expect(md).toContain("## テストケース");
  });

  it("コピー後にボタンテキストが「✓ コピー済み」に変わる", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(<App />);
    await user.click(screen.getByText("MD コピー"));
    expect(screen.getByText("✓ コピー済み")).toBeInTheDocument();
  });
});
