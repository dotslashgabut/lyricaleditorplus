const fs = require('fs');
const content = fs.readFileSync('components/CueList.tsx', 'utf8');

const updated = content.replace(
    'setTimelineDragInfo, getDisplayWords, itemRef, cues\n}: any) => {',
    'setTimelineDragInfo, getDisplayWords, itemRef, cues, onEditWords\n}: any) => {'
);
fs.writeFileSync('components/CueList.tsx', updated);
console.log('patched MemoCueRow props');
