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

// ── プロジェクト操作 ──────────────────────────────────────────────
describe("プロジェクト操作", () => {
  it("サイドバーに初期プロジェクト名が表示される", () => {
    render(<App />);
    expect(screen.getByText("プロジェクト1")).toBeInTheDocument();
  });

  it("「＋ 新規プロジェクト」でプロジェクトが追加される", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("＋ 新規プロジェクト"));
    const saved = JSON.parse(localStorage.getItem("ct-tool-projects"));
    expect(saved.projects).toHaveLength(2);
  });

  it("新規プロジェクトの名前が「プロジェクト N」形式になる", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("＋ 新規プロジェクト"));
    const saved = JSON.parse(localStorage.getItem("ct-tool-projects"));
    expect(saved.projects[1].name).toMatch(/^プロジェクト\s*\d+$/);
  });

  it("新規プロジェクト追加後にそのプロジェクトがアクティブになる", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("＋ 新規プロジェクト"));
    const saved = JSON.parse(localStorage.getItem("ct-tool-projects"));
    expect(saved.activeId).toBe(saved.projects[1].id);
  });

  it("プロジェクトを切り替えると別のデータが表示される", async () => {
    const user = userEvent.setup();
    render(<App />);
    // プロジェクト1でノードを編集
    await user.click(screen.getByText("分類1"));
    await user.clear(screen.getByDisplayValue("分類1"));
    await user.type(screen.getByDisplayValue(""), "プロジェクト1専用{Enter}");

    // 新規プロジェクトを追加
    await user.click(screen.getByText("＋ 新規プロジェクト"));
    // プロジェクト1専用 の文字は見えないはず（別プロジェクト）
    expect(screen.queryByText("プロジェクト1専用")).not.toBeInTheDocument();

    // プロジェクト1に戻す
    await user.click(screen.getByText("プロジェクト1"));
    expect(screen.getByText("プロジェクト1専用")).toBeInTheDocument();
  });

  it("プロジェクトのリネームが反映される", async () => {
    const user = userEvent.setup();
    render(<App />);
    // リネームボタンをホバーで表示させてクリック
    const projectItem = screen.getByText("プロジェクト1").closest("div");
    fireEvent.mouseEnter(projectItem);
    await user.click(screen.getByTitle("リネーム"));
    const input = screen.getByDisplayValue("プロジェクト1");
    await user.clear(input);
    await user.type(input, "renamed{Enter}");
    expect(screen.getByText("renamed")).toBeInTheDocument();
  });

  it("プロジェクトを削除するとリストから消える", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    // 2つにしてから削除
    await user.click(screen.getByText("＋ 新規プロジェクト"));
    // プロジェクト1に切り替えて削除
    await user.click(screen.getByText("プロジェクト1"));
    const projectItem = screen.getByText("プロジェクト1").closest("div");
    fireEvent.mouseEnter(projectItem);
    await user.click(within(projectItem).getByTitle("プロジェクトを削除"));
    const saved = JSON.parse(localStorage.getItem("ct-tool-projects"));
    expect(saved.projects).toHaveLength(1);
  });

  it("ホバーするとリネーム・削除ボタンが表示される", async () => {
    render(<App />);
    const projectItem = screen.getByText("プロジェクト1").closest("div");
    // ホバー前はボタンが見えない（opacity:0）
    fireEvent.mouseLeave(projectItem);
    const btnsBefore = within(projectItem).queryAllByRole("button");
    const allHidden = btnsBefore.every(b => b.style.opacity === "0" || b.style.opacity === "");
    expect(allHidden).toBe(true);
    // ホバー後はボタンが見える
    fireEvent.mouseEnter(projectItem);
    expect(within(projectItem).getByTitle("リネーム")).toBeInTheDocument();
    expect(within(projectItem).getByTitle("プロジェクトを削除")).toBeInTheDocument();
  });

  it("最後の1件はプロジェクトを削除できない", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    const projectItem = screen.getByText("プロジェクト1").closest("div");
    fireEvent.mouseEnter(projectItem);
    const delBtn = screen.getByTitle("プロジェクトを削除");
    expect(delBtn).toBeDisabled();
  });
});

// ── マイグレーション ──────────────────────────────────────────────
describe("マイグレーション", () => {
  it("旧形式(ct-tool-data)があれば新形式に取り込まれる", () => {
    const legacy = {
      trees: [{ id: "t1", root: { id: "n1", name: "旧分類", children: [] } }],
      testCases: [{ id: "tc1", sel: {} }],
    };
    localStorage.setItem("ct-tool-data", JSON.stringify(legacy));
    render(<App />);
    // 旧データのツリー名が表示されること（tree + matrixで複数出る）
    expect(screen.getAllByText("旧分類").length).toBeGreaterThan(0);
    // 新形式で保存されること
    const saved = JSON.parse(localStorage.getItem("ct-tool-projects"));
    expect(saved.projects).toHaveLength(1);
    expect(saved.projects[0].trees[0].root.name).toBe("旧分類");
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
