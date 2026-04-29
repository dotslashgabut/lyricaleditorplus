const fs = require('fs');
let content = fs.readFileSync('components/CueList.tsx', 'utf8');

const oldTiming = `                {/* Timing Controls */}
                <div className={\`flex flex-col gap-3 w-full shrink-0 \${viewMode === 'timeline' ? 'md:w-32 justify-center mt-8 md:mt-0 md:ml-20' : 'md:w-64 mt-8 md:mt-0 md:ml-20'}\`}>
                     {viewMode !== 'timeline' && (
                        <div className="flex flex-row md:flex-col gap-3">
                           <TimeInput 
                             ms={cue.start} 
                             onChange={(val) => updateCue(index, 'start', val)}
                             label="Start"
                             className={\`flex-1 \${isLineOverlap ? 'ring-1 ring-red-500 rounded-lg' : ''}\`}
                           />
                           <TimeInput 
                             ms={cue.end} 
                             onChange={(val) => updateCue(index, 'end', val)}
                             label="End"
                             className="flex-1"
                           />
                        </div>
                     )}
                      
                     {onSeek && (
                         <button 
                           onClick={() => onSeek(cue.start, true, cue.end)} 
                           className={\`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 transition font-medium \${viewMode === 'timeline' ? 'md:h-24 h-16 flex-row md:flex-col' : 'mt-1 text-sm'}\`}
                           title="Play from this line"
                         >
                           <PlayCircle size={viewMode === 'timeline' ? 24 : 18} /> 
                           {viewMode === 'timeline' ? <span className="md:text-[10px] text-xs uppercase tracking-wider font-bold">Play Line</span> : 'Play Line'}
                         </button>
                     )}
                </div>`;

const newTiming = `                {/* Timing Controls */}
                <div className={\`flex flex-col gap-3 shrink-0 \${viewMode === 'timeline' ? 'w-auto justify-center mt-8 md:mt-0 md:ml-12 lg:ml-20' : 'w-full md:w-64 mt-8 md:mt-0 md:ml-20'}\`}>
                     {viewMode !== 'timeline' && (
                        <div className="flex flex-row md:flex-col gap-3">
                           <TimeInput 
                             ms={cue.start} 
                             onChange={(val) => updateCue(index, 'start', val)}
                             label="Start"
                             className={\`flex-1 \${isLineOverlap ? 'ring-1 ring-red-500 rounded-lg' : ''}\`}
                           />
                           <TimeInput 
                             ms={cue.end} 
                             onChange={(val) => updateCue(index, 'end', val)}
                             label="End"
                             className="flex-1"
                           />
                        </div>
                     )}
                      
                     {onSeek && (
                         <button 
                           onClick={() => onSeek(cue.start, true, cue.end)} 
                           className={\`flex items-center justify-center transition font-medium \${viewMode === 'timeline' ? 'text-primary-500 hover:text-primary-600 p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg shrink-0' : 'w-full gap-2 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 mt-1 text-sm'}\`}
                           title="Play from this line"
                         >
                           <PlayCircle size={viewMode === 'timeline' ? 24 : 18} /> 
                           {viewMode !== 'timeline' && 'Play Line'}
                         </button>
                     )}
                </div>`;

if (content.includes(oldTiming)) {
    content = content.replace(oldTiming, newTiming);
    fs.writeFileSync('components/CueList.tsx', content);
    console.log('patched');
} else {
    console.log('not found');
}
