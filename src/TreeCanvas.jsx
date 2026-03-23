import { useMemo } from "react";
import { NODE_H, LABEL_W } from "./treeHelpers";
import NodeBox from "./NodeBox";

export default function TreeCanvas({ layout, treeContainerRef, svgW, svgH,
  nodeTheme, editing, drag, onMouseDown, onStartEdit, onCommitEdit, onSetEditing,
  onAddChild, onDeleteNode, onDeleteTree }) {

  const allNodes = useMemo(() => layout.trees.flatMap(t => t.nodes), [layout]);

  return (
    <div ref={treeContainerRef} style={{
      marginLeft: LABEL_W, position: "relative",
      width: svgW, height: svgH,
      background: "#FAFAFA",
    }}>
      <svg width={svgW} height={svgH} style={{ position: "absolute", inset: 0, overflow: "visible", zIndex: 1 }}>
        {/* Edges */}
        {layout.trees.flatMap(({ nodes }) => nodes.map(node => {
          if (!node.parentId) return null;
          const par = allNodes.find(n => n.id === node.parentId);
          if (!par) return null;
          const x1 = par.cx,  y1 = par.cy + NODE_H / 2 + 3;
          const x2 = node.cx, y2 = node.cy - NODE_H / 2 - 3;
          const my = (y1 + y2) / 2;
          const isDraggedEdge = drag?.nodeId === node.id || drag?.nodeId === par.id;
          return (
            <path key={`${par.id}-${node.id}`}
              d={`M${x1},${y1} V${my} H${x2} V${y2}`}
              fill="none"
              stroke={isDraggedEdge ? "rgba(249,115,22,0.4)" : "#E4E4E7"}
              strokeWidth="1"
              strokeDasharray={isDraggedEdge ? "4,3" : undefined}
            />
          );
        }))}
        {/* Tree separators */}
        {layout.trees.slice(0, -1).map(({ colEnd }) => (
          <line key={`sep${colEnd}`}
            x1={colEnd * layout.effectiveColW} y1={10}
            x2={colEnd * layout.effectiveColW} y2={svgH - 10}
            stroke="#E4E4E7" strokeWidth="1" strokeDasharray="5,4" />
        ))}
      </svg>

      {layout.trees.flatMap(({ treeId, nodes }) => nodes.map(node => (
        <NodeBox key={node.id} node={node} treeId={treeId}
          nodeTheme={nodeTheme} editing={editing} drag={drag}
          onMouseDown={onMouseDown}
          onStartEdit={onStartEdit} onCommitEdit={onCommitEdit} onSetEditing={onSetEditing}
          onAddChild={onAddChild} onDeleteNode={onDeleteNode} onDeleteTree={onDeleteTree} />
      )))}
    </div>
  );
}
