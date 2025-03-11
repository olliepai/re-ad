import {
    AreaHighlight,
    TextHighlight,
    useHighlightContainerContext,
} from "react-pdf-highlighter-extended";
import { Content, Highlight } from "react-pdf-highlighter-extended";

export interface ReadHighlight extends Highlight {
    id: string;
    readRecordId: string;
    content: Content;
}

interface HighlightContainerProps {
    readRecords: any;
    displayedReads: Array<string>;
}

function HighlightContainer({
    readRecords,
    displayedReads,
}: HighlightContainerProps) {
    const {
        highlight,
        isScrolledTo,
        highlightBindings,
    } = useHighlightContainerContext<ReadHighlight>();

    // Transparent Colors: #f2f2f2, #e6e6e6, #d9d9d9
    const color = displayedReads.includes(highlight.readRecordId) ? readRecords[highlight.readRecordId].color : "#e6e6e6";

    return (
        highlight.type === "text" ?
            <TextHighlight
                isScrolledTo={isScrolledTo}
                highlight={highlight}
                style={{
                    background: color,
                }}
            />
            :
            <AreaHighlight
                isScrolledTo={isScrolledTo}
                highlight={highlight}
                bounds={highlightBindings.textLayer}
                style={{
                    background: color,
                    pointerEvents: "none",
                }}
            />
    );
};

export default HighlightContainer;