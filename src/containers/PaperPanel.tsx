import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box } from "@mui/material";

import {
  AreaHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
  Tip,
} from "react-pdf-highlighter";
import type {
  Content,
  IHighlight,
  NewHighlight,
  ScaledPosition,
} from "react-pdf-highlighter";

import { Sidebar } from "../components/paper-components/Sidebar";
import { Spinner } from "../components/paper-components/Spinner";


function PaperPanel() {

    const getNextId = () => String(Math.random()).slice(2);

    const parseIdFromHash = () =>
        document.location.hash.slice("#highlight-".length);

    const resetHash = () => {
        document.location.hash = "";
    };

    const HighlightPopup = ({
        comment,
    }: {
        comment: { text: string; emoji: string };
    }) =>
        comment.text ? (
            <div className="Highlight__popup">
                {comment.emoji} {comment.text}
            </div>
        ) : null;

    const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021";

    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const searchParams = new URLSearchParams(document.location.search);
    const initialUrl = searchParams.get("url") || PRIMARY_PDF_URL;

    const [url, setUrl] = useState(initialUrl);
    const [highlights, setHighlights] = useState<Array<IHighlight>>(
        [],
    );

    const resetHighlights = () => {
        setHighlights([]);
    };


    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file && file.type === "application/pdf") {
            const url = URL.createObjectURL(file);
            setPdfUrl(url);
            setUrl(url);
            setHighlights([]);
        } else {
            alert("Please upload a valid PDF file.");
        }
    };

    const scrollViewerTo = useRef((highlight: IHighlight) => { });

    const scrollToHighlightFromHash = useCallback(() => {
        const highlight = getHighlightById(parseIdFromHash());
        if (highlight) {
            scrollViewerTo.current(highlight);
        }
    }, []);

    useEffect(() => {
        window.addEventListener("hashchange", scrollToHighlightFromHash, false);
        return () => {
            window.removeEventListener(
                "hashchange",
                scrollToHighlightFromHash,
                false,
            );
        };
    }, [scrollToHighlightFromHash]);

    const getHighlightById = (id: string) => {
        return highlights.find((highlight) => highlight.id === id);
    };

    const addHighlight = (highlight: NewHighlight) => {
        console.log("Saving highlight", highlight);
        setHighlights((prevHighlights) => [
            { ...highlight, id: getNextId() },
            ...prevHighlights,
        ]);
    };

    const updateHighlight = (
        highlightId: string,
        position: Partial<ScaledPosition>,
        content: Partial<Content>,
    ) => {
        console.log("Updating highlight", highlightId, position, content);
        setHighlights((prevHighlights) =>
            prevHighlights.map((h) => {
                const {
                    id,
                    position: originalPosition,
                    content: originalContent,
                    ...rest
                } = h;
                return id === highlightId
                    ? {
                        id,
                        position: { ...originalPosition, ...position },
                        content: { ...originalContent, ...content },
                        ...rest,
                    }
                    : h;
            }),
        );
    };

    return (
        <Box style={{ width: '100%', height: '100%' }}>
            <div>
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="mb-4"
                />
            </div>
            <Sidebar
                highlights={highlights}
                resetHighlights={resetHighlights}
            />
            <div
                style={{
                    height: "100vh",
                    width: "75vw",
                    position: "relative",
                }}
            >
                <PdfLoader url={url} beforeLoad={<Spinner />}>
                    {(pdfDocument) => (
                        <PdfHighlighter
                            pdfDocument={pdfDocument}
                            enableAreaSelection={(event) => event.altKey}
                            onScrollChange={resetHash}
                            scrollRef={(scrollTo) => {
                                scrollViewerTo.current = scrollTo;
                                scrollToHighlightFromHash();
                            }}
                            onSelectionFinished={(
                                position,
                                content,
                                hideTipAndSelection,
                                transformSelection,
                            ) => (
                                <Tip
                                    onOpen={transformSelection}
                                    onConfirm={(comment) => {
                                        addHighlight({ content, position, comment });
                                        hideTipAndSelection();
                                    }}
                                />
                            )}
                            highlightTransform={(
                                highlight,
                                index,
                                setTip,
                                hideTip,
                                viewportToScaled,
                                screenshot,
                                isScrolledTo,
                            ) => {
                                const isTextHighlight = !highlight.content?.image;

                                const component = isTextHighlight ? (
                                    <Highlight
                                        isScrolledTo={isScrolledTo}
                                        position={highlight.position}
                                        comment={highlight.comment}
                                    />
                                ) : (
                                    <AreaHighlight
                                        isScrolledTo={isScrolledTo}
                                        highlight={highlight}
                                        onChange={(boundingRect) => {
                                            updateHighlight(
                                                highlight.id,
                                                { boundingRect: viewportToScaled(boundingRect) },
                                                { image: screenshot(boundingRect) },
                                            );
                                        }}
                                    />
                                );

                                return (
                                    <Popup
                                        popupContent={<HighlightPopup {...highlight} />}
                                        onMouseOver={(popupContent) =>
                                            setTip(highlight, (highlight) => popupContent)
                                        }
                                        onMouseOut={hideTip}
                                        key={index}
                                    >
                                        {component}
                                    </Popup>
                                );
                            }}
                            highlights={highlights}
                        />
                    )}
                </PdfLoader>
            </div>
        </Box>
    );
}

export default PaperPanel;