import { useState } from "react";
import { NODE_W, NODE_H } from "./treeHelpers";

const sBtn = (variant) => ({
  width: 28, height: 28, fontSize: 15, padding: 0, cursor: "pointer",
  backgroundColor: "#FFFFFF",
  color: variant === "del" ? "#A1A1AA" : "#18181B",
  border: "1px solid #E4E4E7",
  borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  flexShrink: 0,
});

export default function NodeBox({ node, treeId, nodeTheme, editing, drag, onMouseDown,
  onStartEdit, onCommitEdit, onSetEditing, onAddChild, onDeleteNode, onDeleteTree }) {
  const isRoot    = !node.parentId;
  const isEditing = editing?.nodeId === node.id;
  const isDragging = drag?.nodeId === node.id;
  const isTarget  = drag?.targetId === node.id;
  const [hovered, setHovered] = useState(false);

  let borderStyle = isRoot ? "1.5px solid #18181B" : "1px solid #D4D4D8";
  let fontWeight  = isRoot ? 600 : node.isLeaf ? 500 : 400;
  let textColor   = isRoot ? "#18181B" : node.isLeaf ? "#18181B" : "#71717A";
  let bgColor     = "#FFFFFF";

  if (nodeTheme === "color" && node.isLeaf && !isTarget) {
    bgColor     = "rgba(99,102,241,0.06)";
    borderStyle = "1px solid rgba(99,102,241,0.25)";
  }
  if (isTarget) {
    borderStyle = "1.5px solid #F97316";
    bgColor     = "#FFFFFF";
    textColor   = "#C2410C";
  }

  return (
    <div
      onMouseDown={e => !isEditing && onMouseDown(e, node.id, treeId, node.name)}
      onClick={() => !isEditing && !drag && onStartEdit(node.id, treeId, node.name)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: node.cx - NODE_W / 2, top: node.cy - NODE_H / 2,
        width: NODE_W, height: NODE_H,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: borderStyle, borderRadius: 99,
        backgroundColor: bgColor, color: textColor,
        fontSize: 11, fontWeight,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.3 : 1,
        zIndex: isTarget ? 4 : 3,
        userSelect: "none",
        transition: "all 0.1s",
        transform: isTarget ? "scale(1.06)" : "scale(1)",
      }}
    >
      {isEditing ? (
        <input autoFocus value={editing.value}
          onChange={e => onSetEditing(v => ({ ...v, value: e.target.value }))}
          onBlur={onCommitEdit}
          onKeyDown={e => e.key === "Enter" && onCommitEdit()}
          style={{ width: "85%", border: "none", textAlign: "center", fontSize: 11, outline: "none", background: "transparent", color: "inherit" }}
          onClick={e => e.stopPropagation()} />
      ) : (
        <span style={{ textAlign: "center", padding: "0 5px", lineHeight: 1.3, wordBreak: "break-all" }}>{node.name}</span>
      )}
      {hovered && !isEditing && !drag && (
        <div style={{
          position: "absolute",
          top: NODE_H / 2 + 8, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 6, zIndex: 10,
        }}>
          <button title="子ノードを追加"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onAddChild(treeId, node.id); }}
            style={sBtn("add")}>+</button>
          {isRoot
            ? <button title="分類を削除"
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); if (window.confirm("この分類を削除しますか？")) onDeleteTree(treeId); }}
                style={sBtn("del")}>×</button>
            : <button title="削除"
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); if (window.confirm("このノードを削除しますか？")) onDeleteNode(treeId, node.id); }}
                style={sBtn("del")}>×</button>
          }
        </div>
      )}
    </div>
  );
}
