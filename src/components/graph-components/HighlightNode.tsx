import { Box, Typography } from "@mui/material";
import { Position, Handle, NodeProps, Node, useConnection } from "@xyflow/react";
import "../../styles/GraphNode.css";
import { PaperContext } from "../../contexts/PaperContext";
import { useContext } from "react";
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

export default function HighlightNode({ data }: NodeProps<Node>) {
  const { id, readRecordId, label, type, content, intersected } = data as {
    id: string;
    readRecordId: string;
    label: string;
    type: string;
    content: string;
    intersected: boolean;
  };
  const paperContext = useContext(PaperContext);
  if (!paperContext) {
    throw new Error("PaperContext not found");
  }
  const { readRecords, displayedReads, selectedHighlightId } = paperContext;
  const { color } = readRecords[readRecordId];
  const isDisplayed = displayedReads.includes(readRecordId);

  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode.id !== id;

  return (
    <Box
      className={`highlight-node ${id === selectedHighlightId ? "selected" : ""} ${intersected ? "intersected" : ""}`}
      id={`node-${id}`}
      sx={{ backgroundColor: isDisplayed ? color : "#e6e6e6" }}
    >

      {/* If handles are conditionally rendered and not present initially, you need to update the node internals https://reactflow.dev/docs/api/hooks/use-update-node-internals/ */}
      {/* In this case we don't need to use useUpdateNodeInternals, since !isConnecting is true at the beginning and all handles are rendered initially. */}
      {!connection.inProgress && (
        <Handle
          className="connection-handle"
          id={`relation-handle-${id}-source`}
          position={Position.Right}
          type="source"
        />
      )}
      {/* We want to disable the target handle, if the connection was started from this node */}
      {(!connection.inProgress || isTarget) && (
        <Handle
          className="connection-handle"
          id={`relation-handle-${id}-target`}
          position={Position.Left}
          type="target"
          isConnectableStart={false}
        />
      )}

      <Handle
        className="connection-handle"
        id={`chronological-handle-${id}-target`}
        position={Position.Top}
        type="target"
        isConnectableStart={false}
      />
      <Handle
        className="connection-handle"
        id={`chronological-handle-${id}-source`}
        position={Position.Bottom}
        type="source" isConnectableStart={false} 
      />

      <Typography variant="body1">{label}</Typography>

      {type === "area" &&
        <img src={content} alt="Node Content" style={{ maxWidth: "100%", maxHeight: "100px" }} />
      }

      <DragIndicatorIcon className="drag-handle__custom" />
    </Box>
  );
}
