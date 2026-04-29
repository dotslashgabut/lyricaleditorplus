const fs = require('fs');
const content = fs.readFileSync('components/CueList.tsx', 'utf8');

const regex = /\{cues\.map\(\(cue, index\) \=\> \{([\s\S]*?)        \);(?:[^\n]*)\n      \}\)\}/;

const replacement = `{cues.map((cue, index) => {
        const isActive = activeIndex === index;
        const isDragging = draggedIndex === index;
        const isSelected = selectedCueIds.has(cue.id);
        
        // --- Overlap Detection (Lines) ---
        const prevCue = index > 0 ? cues[index - 1] : null;
        const isLineOverlap = prevCue ? (cue.start < prevCue.end - 1) : false; // 1ms tolerance
        
        return (
          <MemoCueRow
            key={cue.id}
            cue={cue}
            index={index}
            isActive={isActive}
            isDragging={isDragging}
            isSelected={isSelected}
            isLineOverlap={isLineOverlap}
            draggedIndex={draggedIndex}
            overIndex={overIndex}
            viewMode={viewMode}
            currentMillis={isActive ? currentMillis : -1}
            timelineDragInfo={timelineDragInfo}
            onInsert={onInsert}
            onToggleSelection={onToggleSelection}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            updateCue={updateCue}
            onSeek={onSeek}
            playTTS={handlePlayTTS}
            playingTTSId={playingTTSId}
            removeCue={removeCue}
            updateWordInCue={updateWordInCue}
            ttsLanguage={ttsLanguage}
            setTimelineDragInfo={setTimelineDragInfo}
            getDisplayWords={getDisplayWords}
            itemRef={(el) => { itemRefs.current[index] = el; }}
            cues={cues}
            onEditWords={onEditWords}
          />
        );
      })}`;

const match = content.match(regex);
if (!match) {
    console.error("No match found!");
} else {
    fs.writeFileSync('components/CueList.tsx', content.replace(match[0], replacement));
    console.log("Replaced cues.map successfully.");
}
