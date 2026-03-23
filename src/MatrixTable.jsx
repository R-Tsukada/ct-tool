import { LABEL_W, MATRIX_ROW_H, DOT_SIZE } from "./treeHelpers";

export default function MatrixTable({ layout, testCases, onToggle, onAddTC, onDelTC }) {
  const { allLeaves, effectiveColW } = layout;

  return (
    <>
      <table style={{ borderCollapse: "collapse", tableLayout: "fixed", border: "1px solid #E4E4E7", borderTop: "2px solid #D4D4D8" }}>
        <thead>
          <tr>
            <th style={{ width: LABEL_W, minWidth: LABEL_W, padding: 0 }} />
            {allLeaves.map((leaf, i) => {
              const prev = allLeaves[i - 1];
              return (
                <th key={leaf.id} style={{
                  width: effectiveColW, minWidth: effectiveColW, maxWidth: effectiveColW,
                  fontSize: 10.5, fontWeight: 600, color: "#71717A",
                  textAlign: "center", padding: "8px 3px",
                  borderBottom: "2px solid #D4D4D8",
                  borderLeft: prev?.treeId === leaf.treeId ? "1px solid #F4F4F5" : "2px dashed #D4D4D8",
                  background: "#FAFAFA", wordBreak: "break-all",
                  lineHeight: 1.3, verticalAlign: "bottom",
                }}>
                  {leaf.name}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {testCases.map((tc, i) => (
            <tr key={tc.id}>
              <td style={{
                textAlign: "center", fontSize: 12, fontWeight: 700,
                borderRight: "2px solid #D4D4D8", background: "#FAFAFA",
                color: "#A1A1AA", padding: "4px 2px",
                height: MATRIX_ROW_H, verticalAlign: "middle",
              }}>
                <div>{i + 1}</div>
                <button
                  onClick={() => { if (window.confirm("このテストケースを削除しますか？")) onDelTC(tc.id); }}
                  style={{
                    fontSize: 8, padding: "1px 4px", cursor: "pointer",
                    backgroundColor: "transparent", color: "#EF4444",
                    border: "1px solid #D4D4D8", borderRadius: 2,
                    display: "block", width: "80%", margin: "2px auto 0",
                  }}>del</button>
              </td>
              {allLeaves.map((leaf, li) => {
                const prev = allLeaves[li - 1];
                const selected = !!tc.sel[leaf.id];
                return (
                  <td key={leaf.id} onClick={() => onToggle(tc.id, leaf.id)}
                    style={{
                      textAlign: "center", verticalAlign: "middle",
                      borderLeft: prev?.treeId === leaf.treeId ? "1px solid #F4F4F5" : "2px dashed #D4D4D8",
                      borderBottom: "1px solid #F4F4F5",
                      cursor: "pointer", height: MATRIX_ROW_H,
                      background: selected ? "rgba(99,102,241,0.05)" : "#FFFFFF",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => !selected && (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={e => !selected && (e.currentTarget.style.background = "#FFFFFF")}
                  >
                    {selected && (
                      <div style={{ width: DOT_SIZE, height: DOT_SIZE, borderRadius: "50%", background: "#6366F1", margin: "auto" }} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 10, marginLeft: LABEL_W }}>
        <button onClick={onAddTC} style={{
          padding: "7px 20px", borderRadius: 6,
          border: "1px solid #E4E4E7", backgroundColor: "transparent",
          color: "#6366F1", cursor: "pointer", fontSize: 12,
        }}>
          ＋ テストケース追加
        </button>
      </div>
    </>
  );
}
