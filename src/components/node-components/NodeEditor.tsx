import { useContext, useEffect, useState } from "react";
import "../../styles/NodeEditor.css";
// import References from "./References";
import { Box, Button, IconButton, TextField } from "@mui/material";
import { PaperContext } from "../../contexts/PaperContext";
import { Close } from "@mui/icons-material";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type NodeData = {
  label: string;
  content: string;
  summary: string;
  references: string[];
  notes: string;
};

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

function NodeEditor() {
  const paperContext = useContext(PaperContext);
  if (!paperContext) {
    throw new Error("PaperContext not found");
  }
  const { nodes, updateNodeData, deleteHighlight, selectedHighlightId, setSelectedHighlightId, setOnSelectNode } = paperContext;

  const [label, setLabel] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  // const [references, setReferences] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [edited, setEdited] = useState<boolean>(false);
  const [closing, setClosing] = useState<boolean>(false);

  // Fetch node data from the nodes array when the selected highlight changes
  useEffect(() => {
    const selectedNode = nodes.find((node) => node.id === selectedHighlightId);
    if (selectedNode) {
      setLabel(selectedNode.data.label as string);
      const content = selectedNode.data.content as string;
      setSummary(selectedNode.data.summary as string);
      // setReferences(selectedNode.data.references as string[]);
      setNotes(selectedNode.data.notes as string);
      setEdited(false);
      setClosing(false);

      if (!selectedNode.data.summary) {
        generateSummary(content);
      }
    }
  }, [selectedHighlightId]);

  // Generate summary from highlighted content
  const generateSummary = async (content: string) => {
    if (!content) {
      setSummary("No content to summarize.");
      return;
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      const summaryPrompt = `Summarize this in three sentences or less or if it's a single word/phrase give the definition: "${content}"`;
      const response = await model.generateContent(summaryPrompt);
      const result = await response.response;
      setSummary(result.text() || "No summary available.");
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummary("Failed to fetch summary.");
    }
  };

  const handleSave = () => {
    updateNodeData(selectedHighlightId as string, { label, summary, notes });
    setSelectedHighlightId(null);
    setOnSelectNode(false);
  };

  const handleClose = () => {
    setClosing(true);
    if (!edited) {
      setSelectedHighlightId(null);
      setOnSelectNode(false);
    }
  };

  return (
    <div className="wrapper" style={{ overflowY: closing ? "hidden" : "auto" }}>
      {edited && closing && (
        <div className="closing-popup">
          <div className="closing-background" onClick={() => setClosing(false)}></div>

          <div className="closing-modal">
            <h3>Would you like to save your changes?</h3>
            <div className="closing-modal-buttons">
              <Button variant="outlined" color="success" onClick={() => handleSave()}>
                Save
              </Button>
              <Button variant="outlined" color="error" onClick={() => setClosing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      <IconButton
        size="small"
        sx={{ position: "absolute", top: 0, right: 0, zIndex: 1000 }}
        onClick={() => handleClose()}
      >
        <Close />
      </IconButton>
      <Box className="field">
        <h3>Label</h3>
        <TextField
          id="label"
          variant="outlined"
          sx={{ width: "100%", textTransform: "none" }}
          value={label}
          onChange={(e) => {
            setEdited(true);
            setLabel(e.target.value);
          }}
        />
      </Box>
      <Box className="field summary-container">
        <h3 className="summary-title">Definition / Summary</h3>
        <p className="summary-generated">
          <span className="summary-label">(From Gemini)</span> {summary || "Generating summary..."}
        </p>
      </Box>
      {/* <References className="field" /> */}
      <Box className="field">
        <h3>Notes</h3>
        <TextField
          id="notes"
          variant="outlined"
          sx={{ width: "100%", textTransform: "none" }}
          value={notes}
          onChange={(e) => {
            setEdited(true);
            setNotes(e.target.value);
          }}
          multiline
          placeholder="Write your notes here..."
        />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
        {/* <Button variant="outlined" color="secondary" onClick={() => { }}>Link</Button> */}
        <Button variant="outlined" color="success" onClick={() => handleSave()}>
          Save
        </Button>
        <Button variant="outlined" color="error" onClick={() => deleteHighlight(selectedHighlightId as string)}>
          Delete
        </Button>
      </Box>
    </div>
  );
}

export default NodeEditor;
