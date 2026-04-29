const fs = require('fs');
const content = fs.readFileSync('components/CueList.tsx', 'utf8');

const regex = /const areEqual = \([\s\S]*?\};\n/;

const replacement = `const areEqual = (prevProps: any, nextProps: any) => {
    const wasDrag = prevProps.draggedIndex === prevProps.index || prevProps.overIndex === prevProps.index;
    const isDrag  = nextProps.draggedIndex === nextProps.index || nextProps.overIndex === nextProps.index;
    if (wasDrag !== isDrag) return false;

    const prevTimeDrag = prevProps.timelineDragInfo?.cueIndex === prevProps.index ? prevProps.timelineDragInfo : null;
    const nextTimeDrag = nextProps.timelineDragInfo?.cueIndex === nextProps.index ? nextProps.timelineDragInfo : null;
    if (prevTimeDrag !== nextTimeDrag) return false;

    return prevProps.cue === nextProps.cue &&
           prevProps.index === nextProps.index &&
           prevProps.isActive === nextProps.isActive &&
           prevProps.isSelected === nextProps.isSelected &&
           prevProps.isLineOverlap === nextProps.isLineOverlap &&
           prevProps.viewMode === nextProps.viewMode &&
           prevProps.currentMillis === nextProps.currentMillis &&
           prevProps.playingTTSId === nextProps.playingTTSId &&
           prevProps.ttsLanguage === nextProps.ttsLanguage;
};
`;

const match = content.match(regex);
if (match) {
    fs.writeFileSync('components/CueList.tsx', content.replace(match[0], replacement));
    console.log("Updated areEqual");
} else {
    console.error("Match not found");
}
