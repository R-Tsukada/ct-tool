import { useState } from "react";

export default function Sidebar({ store, onSwitch, onAdd, onRename, onDelete, onClose }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [hoveredId, setHoveredId] = useState(null);

  const startRename = (e, project) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditValue(project.name);
  };

  const commitRename = () => {
    if (editValue.trim()) onRename(editingId, editValue.trim());
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (store.projects.length <= 1) return;
    if (window.confirm("このプロジェクトを削除しますか？")) onDelete(id);
  };

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: "#F4F4F5",
      borderRight: "1px solid #E4E4E7",
      display: "flex", flexDirection: "column",
      minHeight: "100vh",
    }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #E4E4E7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, color: "#A1A1AA", letterSpacing: "0.1em" }}>PROJECTS</div>
        <button
          title="サイドバーを閉じる"
          onClick={onClose}
          style={{ border: "none", background: "transparent", cursor: "pointer", color: "#A1A1AA", fontSize: 16, padding: "0 2px", lineHeight: 1 }}
        >‹</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
        {store.projects.map(project => {
          const isActive  = project.id === store.activeId;
          const isEditing = editingId === project.id;
          const isHovered = hoveredId === project.id;

          let bg = isActive ? "#18181B" : isHovered ? "#E4E4E7" : "transparent";

          return (
            <div
              key={project.id}
              onClick={() => !isEditing && onSwitch(project.id)}
              onMouseEnter={() => setHoveredId(project.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 10px", borderRadius: 6, marginBottom: 2,
                cursor: isEditing ? "default" : "pointer",
                background: bg,
                color: isActive ? "#FFFFFF" : "#52525B",
                transition: "background 0.1s",
              }}
            >
              {isEditing ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditingId(null); }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    flex: 1, border: "none", outline: "1px solid #6366F1",
                    borderRadius: 3, padding: "1px 4px", fontSize: 12,
                    background: "#FFFFFF", color: "#18181B",
                  }}
                />
              ) : (
                <span style={{ flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {project.name}
                </span>
              )}
              {!isEditing && (
                <div style={{
                  display: "flex", gap: 2, flexShrink: 0,
                  opacity: (isHovered || isActive) ? 1 : 0,
                  transition: "opacity 0.1s",
                }}>
                  <button
                    title="リネーム"
                    onClick={e => startRename(e, project)}
                    style={iconBtn}
                  >✎</button>
                  <button
                    title="プロジェクトを削除"
                    onClick={e => handleDelete(e, project.id)}
                    disabled={store.projects.length <= 1}
                    style={{ ...iconBtn, color: store.projects.length <= 1 ? "#D4D4D8" : "#EF4444" }}
                  >×</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: "8px", borderTop: "1px solid #E4E4E7" }}>
        <button
          onClick={onAdd}
          style={{
            width: "100%", padding: "7px 0", borderRadius: 6,
            border: "1px dashed #D4D4D8", backgroundColor: "transparent",
            color: "#71717A", cursor: "pointer", fontSize: 12,
          }}
        >
          ＋ 新規プロジェクト
        </button>
      </div>
    </aside>
  );
}

const iconBtn = {
  width: 20, height: 20, padding: 0, border: "none",
  background: "transparent", cursor: "pointer",
  fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: 3, color: "#A1A1AA",
};
