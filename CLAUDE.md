# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A **Classification Tree test design tool** (分類木テスト設計ツール) — a browser-based SPA for creating hierarchical classification trees and mapping leaf nodes to test cases in a matrix view. All state is stored in localStorage (no backend).

## TDD 必須ルール ⚠️

**すべての機能実装・バグ修正において RED → GREEN → Refactor サイクルを厳守すること。**

このルールは `/plan` で起動した場合も含め、いかなる場合も省略禁止。

### サイクルの手順

1. **RED** — 失敗するテストを先に書く。`npx vitest run` でテストが失敗することを確認する
2. **GREEN** — テストが通る最小限の実装を書く。`npx vitest run` で全テストがパスすることを確認する
3. **Refactor** — テストを壊さずコードを整理する。`npx vitest run` で全テストがパスすることを再確認する

### /plan 使用時の注意

プランのステップに必ず以下を含めること：

- 「RED: ○○のテストを書く（失敗を確認）」
- 「GREEN: ○○を実装する（テスト通過を確認）」
- 「Refactor: コードを整理する（テスト通過を再確認）」

実装フェーズでサイクルを省略していた場合は **最初からやり直す**。

## Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint check
npx vitest run    # Run all tests (Vitest + jsdom)
npx vitest        # Watch mode
```

## Architecture

### ファイル構成

```
src/
  App.jsx          # メインコンポーネント（state・ハンドラ・レイアウト）
  Sidebar.jsx      # プロジェクト一覧サイドメニュー
  TreeCanvas.jsx   # ツリー描画（SVG エッジ + NodeBox）
  MatrixTable.jsx  # テストケースマトリクス表
  NodeBox.jsx      # 単一ノードの表示・編集・ホバーメニュー
  treeHelpers.js   # 純粋関数（ツリー操作・レイアウト計算）+ 定数
  __tests__/
    App.test.jsx         # コンポーネント統合テスト
    treeHelpers.test.js  # 純粋関数ユニットテスト
```

### Data model

```js
// localStorage: "ct-tool-projects"
{
  activeId: "p1",
  projects: [
    {
      id: "p1",
      name: "プロジェクト名",
      trees: [{ id, root: TreeNode }],
      testCases: [{ id, sel: { [leafId]: bool } }]
    }
  ]
}
```

`TreeNode` は `{ id, name, children: TreeNode[] }`。ツリー操作はすべてイミュータブルスタイル（`updateNode`, `deleteNodeFrom`, `extractNode`, `insertAfter`, `insertBefore`）。

### Layout

`computeLayout(root, colOffset, treeId, colW)` がツリーをフラットな配置オブジェクト（`cx`/`cy` ピクセル値）に変換。`useMemo` でツリー変更・コンテナ幅変更のたびに再計算。コンテナ幅は `ResizeObserver` で取得し、列幅を動的に拡張（画面幅いっぱいに広がる）。

### Key state

| State | Purpose |
|---|---|
| `store` | `{ activeId, projects[] }` — 全プロジェクトデータ |
| `data` | `store` から導出したアクティブプロジェクトの `{ trees, testCases }` |
| `editing` | `{ nodeId, treeId, value }` — リネーム中のノード |
| `drag` | `{ nodeId, treeId, ghostName, ghostX, ghostY, targetId, targetTreeId }` |

### Drag-and-drop

`mousemove`/`mouseup` をドラッグ中のみ `document` にアタッチ（`useEffect` を `!!drag` でキー）。stale closure 回避のため `dragRef`, `allNodesRef`, `dataRef` を使用。

## Conventions

- Plain JS/JSX（TypeScript なし）
- ID は `uid()` — モジュールレベルのオートインクリメントカウンタ
- ESLint: 未使用変数は `^[A-Z_]` にマッチする名前なら許容
- スタイルはすべてインライン CSS（`#FAFAFA` ベースのライトテーマ）
