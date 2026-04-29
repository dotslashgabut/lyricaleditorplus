const fs = require('fs');
let content = fs.readFileSync('components/CueList.tsx', 'utf8');

// Update MemoCueRow props 
content = content.replace(
    'setTimelineDragInfo, getDisplayWords, itemRef, cues, onEditWords',
    'setTimelineDragInfo, getDisplayWords, itemRef, prevCueEnd, nextCueStart, onEditWords'
);

// Update cues[index - 1].end to prevCueEnd
content = content.replace(/const prevCueEnd = index > 0 \? cues\[index - 1\]\.end : 0;/g, '');

// Update cues[index + 1].start to nextCueStart
content = content.replace(/const nextCueStart = index < cues\.length - 1 \? cues\[index \+ 1\]\.start : cue\.end \+ 60000;/g, '');

// Add to MemoCueRow in map
content = content.replace(
    'cues={cues}',
    'prevCueEnd={index > 0 ? cues[index - 1].end : 0}\n            nextCueStart={index < cues.length - 1 ? cues[index + 1].start : cue.end + 60000}'
);

// Update areEqual
content = content.replace(
    '    return prevProps.cue === nextProps.cue &&',
    '    return prevProps.cue === nextProps.cue &&\n           prevProps.prevCueEnd === nextProps.prevCueEnd &&\n           prevProps.nextCueStart === nextProps.nextCueStart &&'
);

fs.writeFileSync('components/CueList.tsx', content);
console.log('Patched MemoCueRow cues usage!');
