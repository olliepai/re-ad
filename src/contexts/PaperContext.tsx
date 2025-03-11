import { createContext, useCallback, useEffect, useState } from "react";
import { Content, GhostHighlight, ScaledPosition } from "react-pdf-highlighter-extended";
import {
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  type OnNodesChange,
  type OnEdgesChange,
  addEdge,
  Connection,
  MarkerType,
} from "@xyflow/react";
import { ReadHighlight } from "../components/paper-components/HighlightContainer";

type PaperContextData = {
  highlights: Array<ReadHighlight>;
  addHighlight: (highlight: GhostHighlight) => void;
  updateHighlight: (highlightId: string, position: Partial<ScaledPosition>, content: Partial<Content>) => void;
  deleteHighlight: (highlightId: string) => void;
  resetHighlights: () => void;
  // Graph
  nodes: Array<Node>;
  setNodes: (nodes: Array<Node>) => void;
  onNodesChange: OnNodesChange;
  edges: Array<Edge>;
  setEdges: (edges: Array<Edge>) => void;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  // Shared
  readRecords: Record<string, ReadRecord>;
  isAddingNewRead: boolean;
  setIsAddingNewRead: (isAddingNewRead: boolean) => void;
  createRead: (title: string, color: string) => void;
  currentReadId: string;
  setCurrentReadId: (readId: string) => void;
  displayedReads: Array<string>;
  hideRead: (readId: string) => void;
  showRead: (readId: string) => void;
  selectedHighlightId: string | null;
  setSelectedHighlightId: (highlightId: string | null) => void;
};

export const PaperContext = createContext<PaperContextData | null>(null);

type ReadRecord = {
  id: string;
  title: string;
  color: string;
};

export const PaperContextProvider = ({ children }: { children: React.ReactNode }) => {
  // Paper
  const [paperUrl, setPaperUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Array<ReadHighlight>>([]);
  const [temporalSeq, setTemporalSeq] = useState(0);

  // Shared
  const [readRecords, setReadRecords] = useState<Record<string, ReadRecord>>({});
  const [isAddingNewRead, setIsAddingNewRead] = useState(false);
  const [currentReadId, setCurrentReadId] = useState("0");
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [displayedReads, setDisplayedReads] = useState<Array<string>>([]);

  // Graph
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const NODE_OFFSET_X = 150;
  const NODE_OFFSET_Y = 150;

  const onConnect = useCallback((connection: Connection) => {
    console.log("Connect", connection);
    const edge = { ...connection, type: "relation" };
    setEdges((prevEdges) => addEdge(edge, prevEdges));
  }, []);

  useEffect(() => {
    setTemporalSeq(highlights.filter((h) => h.id.startsWith(currentReadId.toString())).length);
  }, [currentReadId]);

  const processHighlightText = (highlight: GhostHighlight) => {
    if (highlight.type === "text") {
      const text = highlight.content.text?.trim() ?? "";
      const words = text.split(/\s+/);
      const truncatedText = words.length > 20 ? words.slice(0, 20).join(" ") + "..." : text;
      return {
        type: highlight.type,
        label: truncatedText,
        content: highlight.content.text,
      };
    }
    else if (highlight.type === "area") {
      return {
        type: highlight.type,
        label: highlight.content.image,
        content: "Image",
      };
    }
  }

  const addHighlight = (highlight: GhostHighlight) => {
    console.log("Add highlight", highlight, highlights);
    setHighlights((prevHighlights: Array<ReadHighlight>) => [
      ...prevHighlights,
      {
        ...highlight,
        id: `${currentReadId}-${temporalSeq}`,
        readRecordId: currentReadId,
      },
    ]);
    setTemporalSeq((prevTemporalSeq) => prevTemporalSeq + 1);

    // add a node to the graph
    const isFirstHighlight = temporalSeq === 0;
    setNodes((prevNodes: Array<Node>) => [
      ...prevNodes,
      {
        id: `${currentReadId}-${temporalSeq}`,
        type: "highlight",
        data: {
          id: `${currentReadId}-${temporalSeq}`,
          readRecordId: currentReadId,
          ...processHighlightText(highlight)
        },
        position: {
          x: isFirstHighlight
            ? Object.keys(readRecords).findIndex((id) => id === currentReadId) * NODE_OFFSET_X
            : nodes[nodes.length - 1].position.x,
          y: isFirstHighlight ? NODE_OFFSET_Y : nodes[nodes.length - 1].position.y + NODE_OFFSET_Y,
        },
      },
    ]);

    console.log("Nodes", nodes);

    // add an edge to the graph
    if (!isFirstHighlight) {
      setEdges((prevEdges: Array<Edge>) => [
        ...prevEdges,
        {
          id: `${currentReadId}-${temporalSeq}`,
          source: highlights[highlights.length - 1]?.id,
          target: `${currentReadId}-${temporalSeq}`,
          type: "temporal",
          markerEnd: { type: MarkerType.Arrow },
        },
      ]);
    }
  };

  const updateHighlight = (highlightId: string, position: Partial<ScaledPosition>, content: Partial<Content>) => {
    console.log("Update highlight", highlightId, position, content);
    setHighlights((prevHighlights: Array<ReadHighlight>) =>
      prevHighlights.map((h) => {
        const { id, position: originalPosition, content: originalContent, ...rest } = h;
        return id === highlightId
          ? {
            id,
            position: { ...originalPosition, ...position },
            content: { ...originalContent, ...content },
            ...rest,
          }
          : h;
      })
    );
  };

  const deleteHighlight = (highlightId: string) => {
    console.log("Delete highlight", highlightId);
    setHighlights(highlights.filter((h) => h.id !== highlightId));
    setNodes(nodes.filter((n) => n.id !== highlightId));
    setEdges(edges.filter((e) => e.id !== highlightId && e.source !== highlightId && e.target !== highlightId));
    setSelectedHighlightId(null);
    setTemporalSeq((prevTemporalSeq) => prevTemporalSeq - 1);
  };

  const resetHighlights = () => {
    console.log("Reset highlights");
    setHighlights([]);
    setNodes([]);
    setEdges([]);
    setSelectedHighlightId(null);
    setTemporalSeq(0);
  };

  const createRead = (title: string, color: string) => {
    const newReadId = Object.keys(readRecords).length.toString();
    setReadRecords((prevReadRecords) => ({
      ...prevReadRecords,
      [newReadId]: { id: newReadId, title, color },
    }));
    setCurrentReadId(newReadId);
    showRead(newReadId);
  };

  const hideRead = (readId: string) => {
    setDisplayedReads((prevDisplayedReads) => prevDisplayedReads.filter((id) => id !== readId));
  };

  const showRead = (readId: string) => {
    setDisplayedReads((prevDisplayedReads) => [...prevDisplayedReads, readId]);
  };

  return (
    <PaperContext.Provider
      value={{
        highlights,
        addHighlight,
        updateHighlight,
        deleteHighlight,
        resetHighlights,
        // Graph
        nodes,
        setNodes,
        onNodesChange,
        edges,
        setEdges,
        onEdgesChange,
        onConnect,
        // Shared
        readRecords,
        isAddingNewRead,
        setIsAddingNewRead,
        currentReadId,
        setCurrentReadId,
        selectedHighlightId,
        setSelectedHighlightId,
        createRead,
        displayedReads,
        hideRead,
        showRead,
      }}
    >
      {children}
    </PaperContext.Provider>
  );
};
