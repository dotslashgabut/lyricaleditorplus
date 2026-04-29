

import React, { useRef, useEffect, useState } from 'react';
import { Cue, Word } from '../types';
import { msToSrt, msToLrc, msToVtt, msToMmSsMmm, timeToMs } from '../utils/timeUtils';
import { AlignLeft, GripVertical, Mic, PlayCircle, Plus, Minus, Trash2, Bold, Italic, AlertCircle, CheckSquare, Square, Volume2, Loader2 } from 'lucide-react';
import { playTTS, stopTTS } from '../services/aiService';

interface CueListProps {
  cues: Cue[];
  onChange: (updatedCues: Cue[]) => void;
  onEditWords: (cueIndex: number) => void;
  currentMillis: number;
  onSeek?: (ms: number, shouldPlay?: boolean, endTime?: number) => void;
  viewMode: 'line' | 'word' | 'timeline';
  selectedCueIds: Set<string>;
  onToggleSelection: (id: string, shiftKey: boolean) => void;
  onInsert: (index: number) => void;
  ttsLanguage: string;
}

// Helper for UI input to handle local state and prevent cursor jumping
const TimeInput = ({ ms, onChange, label, className = '' }: { ms: number, onChange: (val: number) => void, label: string, className?: string }) => {
  // Use msToVtt for UI to display dots for milliseconds
  const [localText, setLocalText] = useState(msToVtt(ms));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalText(msToVtt(ms));
    }
  }, [ms, isFocused]);

  const handleStep = (amount: number) => {
    onChange(Math.max(0, ms + amount));
  };

  const commitChange = () => {
    const val = timeToMs(localText);
    // validation to prevent accidental zeroing on typo
    if (val === 0 && ms !== 0) {
         // rough check if it is really zero
         const digits = localText.replace(/[^\d]/g, '');
         const allZero = digits.length > 0 && Number(digits) === 0;
         if (!allZero && localText.trim() !== '') {
             // invalid input, revert
             setLocalText(msToVtt(ms));
             return;
         }
    }
    onChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.currentTarget.blur();
          return;
      }
      // Handle +/- shortcuts
      if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          const newVal = Math.max(0, ms - 100);
          onChange(newVal);
          setLocalText(msToVtt(newVal));
      }
      if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          const newVal = ms + 100;
          onChange(newVal);
          setLocalText(msToVtt(newVal));
      }
  };

  return (
    <div className={`relative group/time ${className}`}>
      <div className="flex items-center gap-1">
          <button 
            onClick={() => handleStep(-100)}
            className="h-11 w-11 flex-shrink-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 transition"
            tabIndex={-1}
            title="-0.1s"
          >
            <Minus size={16} />
          </button>
          
          <div className="relative flex-1 min-w-0">
             <input 
                type="text" 
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => { setIsFocused(false); commitChange(); }}
                onKeyDown={handleKeyDown}
                className="w-full text-center py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm md:text-base font-mono text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition shadow-sm"
                placeholder={label}
             />
             <div className="absolute inset-x-0 bottom-full mb-1 text-center text-[10px] text-neutral-400 uppercase tracking-wider font-semibold opacity-0 group-focus-within/time:opacity-100 transition-opacity pointer-events-none">
               {label}
             </div>
          </div>

          <button 
            onClick={() => handleStep(100)}
            className="h-11 w-11 flex-shrink-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 transition"
            tabIndex={-1}
            title="+0.1s"
          >
            <Plus size={16} />
          </button>
      </div>
    </div>
  );
};

// Specialized input for Word timestamps
const WordTimeInput = ({ ms, onChange }: { ms: number, onChange: (val: number) => void }) => {
    // Use msToMmSsMmm for 3 digit precision (00:00.000)
    const [localText, setLocalText] = useState(msToMmSsMmm(ms));
    const [isFocused, setIsFocused] = useState(false);
  
    useEffect(() => {
      if (!isFocused) {
        setLocalText(msToMmSsMmm(ms));
      }
    }, [ms, isFocused]);
  
    const commitChange = () => {
      const val = timeToMs(localText);
      onChange(val);
    };
  
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
            return;
        }
        // Handle +/- shortcuts
        if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            const newVal = Math.max(0, ms - 100);
            onChange(newVal);
            setLocalText(msToMmSsMmm(newVal));
        }
        if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            const newVal = ms + 100;
            onChange(newVal);
            setLocalText(msToMmSsMmm(newVal));
        }
    };
  
    return (
        <input 
            type="text"
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => { setIsFocused(false); commitChange(); }}
            onKeyDown={handleKeyDown}
            className="w-20 text-xs font-mono text-center bg-transparent text-neutral-500 focus:text-primary-600 outline-none"
            placeholder="00:00.000"
            onClick={(e) => e.stopPropagation()} 
        />
    );
};

// Component for Line Text (Textarea)
const LocalTextarea = ({ value, onChange, className, placeholder, rows, onInsert }: { value: string, onChange: (val: string) => void, className?: string, placeholder?: string, rows?: number, onInsert?: (tag: string) => void }) => {
    const [localText, setLocalText] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
  
    useEffect(() => {
      if (!isFocused) {
        setLocalText(value);
      }
    }, [value, isFocused]);

    const handleInsert = (tag: 'b' | 'i') => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = localText;
        const selected = text.substring(start, end);
        
        let newText;
        if (selected) {
            newText = text.substring(0, start) + `<${tag}>` + selected + `</${tag}>` + text.substring(end);
        } else {
             newText = text.substring(0, start) + `<${tag}></${tag}>` + text.substring(end);
        }
        
        setLocalText(newText);
        onChange(newText);
        textareaRef.current.focus();
    };

    return (
        <div className="relative group/textarea">
            <textarea 
                ref={textareaRef}
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => { setIsFocused(false); if (localText !== value) onChange(localText); }}
                className={className}
                placeholder={placeholder}
                rows={rows}
            />
            <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 group-hover/textarea:opacity-100 group-focus-within/textarea:opacity-100 transition-opacity">
                <button 
                  onMouseDown={(e) => { e.preventDefault(); handleInsert('b'); }}
                  className="p-1.5 bg-neutral-100/80 dark:bg-neutral-800/80 backdrop-blur rounded hover:bg-primary-100 dark:hover:bg-primary-900/40 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 transition"
                  title="Bold"
                >
                    <Bold size={14} />
                </button>
                <button 
                  onMouseDown={(e) => { e.preventDefault(); handleInsert('i'); }}
                  className="p-1.5 bg-neutral-100/80 dark:bg-neutral-800/80 backdrop-blur rounded hover:bg-primary-100 dark:hover:bg-primary-900/40 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 transition"
                  title="Italic"
                >
                    <Italic size={14} />
                </button>
            </div>
        </div>
    );
};

// Component for Word Text (Input)
const LocalInput = ({ value, onChange, className, placeholder }: { value: string, onChange: (val: string) => void, className?: string, placeholder?: string }) => {
    const [localText, setLocalText] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
  
    useEffect(() => {
      if (!isFocused) {
        setLocalText(value);
      }
    }, [value, isFocused]);
  
    return (
        <input 
            type="text"
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => { setIsFocused(false); if (localText !== value) onChange(localText); }}
            className={className}
            placeholder={placeholder}
            onClick={(e) => e.stopPropagation()} 
        />
    );
};

// New Component: Insert Separator
const InsertSeparator = ({ onClick }: { onClick: () => void }) => (
  <div className="h-5 flex items-center justify-center group cursor-pointer relative z-10" onClick={onClick} title="Insert new line here">
     <div className="w-full h-px bg-transparent group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors relative flex items-center justify-center">
        <button className="absolute w-6 h-6 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-400 group-hover:text-primary-500 group-hover:border-primary-300 dark:group-hover:border-primary-700 shadow-sm flex items-center justify-center transition-all transform scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100">
           <Plus size={14} />
        </button>
     </div>
  </div>
);

const areEqual = (prevProps: any, nextProps: any) => {
    const wasDrag = prevProps.draggedIndex === prevProps.index || prevProps.overIndex === prevProps.index;
    const isDrag  = nextProps.draggedIndex === nextProps.index || nextProps.overIndex === nextProps.index;
    if (wasDrag !== isDrag) return false;

    const prevTimeDrag = prevProps.timelineDragInfo?.cueIndex === prevProps.index ? prevProps.timelineDragInfo : null;
    const nextTimeDrag = nextProps.timelineDragInfo?.cueIndex === nextProps.index ? nextProps.timelineDragInfo : null;
    if (prevTimeDrag !== nextTimeDrag) return false;

    return prevProps.cue === nextProps.cue &&
           prevProps.prevCueEnd === nextProps.prevCueEnd &&
           prevProps.nextCueStart === nextProps.nextCueStart &&
           prevProps.index === nextProps.index &&
           prevProps.isActive === nextProps.isActive &&
           prevProps.isSelected === nextProps.isSelected &&
           prevProps.isLineOverlap === nextProps.isLineOverlap &&
           prevProps.viewMode === nextProps.viewMode &&
           prevProps.currentMillis === nextProps.currentMillis &&
           prevProps.playingTTSId === nextProps.playingTTSId &&
           prevProps.ttsLanguage === nextProps.ttsLanguage;
};

const MemoCueRow = React.memo(({
    cue, index, isActive, isDragging, isSelected, isLineOverlap, draggedIndex, overIndex,
    viewMode, currentMillis, timelineDragInfo,
    onInsert, onToggleSelection, handleDragOver, handleDrop,
    handleDragStart, handleDragEnd, updateCue, onSeek, playTTS, playingTTSId,
    removeCue, updateWordInCue, ttsLanguage,
    setTimelineDragInfo, getDisplayWords, itemRef, prevCueEnd, nextCueStart, onEditWords
}: any) => {
    return (
        <React.Fragment>
             <InsertSeparator onClick={() => onInsert(index)} />
             <div 
                ref={itemRef}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  group relative rounded-2xl transition-all duration-300 flex flex-col md:flex-row ${viewMode === 'timeline' ? 'p-3 md:p-4 gap-2 md:gap-2' : 'p-5 md:p-6 gap-6 md:gap-10'} items-start border
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 dark:border-primary-600 shadow-xl shadow-primary-500/10 scale-[1.01] z-10' 
                    : isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md'
                  }
                  ${isDragging ? 'opacity-40 border-dashed border-primary-500' : ''}
                  cursor-default
                `}
              >
                {/* Drag Insertion Indicator */}
                {draggedIndex !== null && overIndex === index && draggedIndex !== index && (
                  <div 
                    className={`absolute left-0 right-0 h-1 bg-primary-500 rounded-full shadow-sm shadow-primary-500/50 z-20 pointer-events-none transition-all duration-200
                      ${draggedIndex < index ? '-bottom-2 md:-bottom-3' : '-top-2 md:-top-3'}
                    `}
                  >
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full"></div>
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full"></div>
                  </div>
                )}
                
                {/* Selection Checkbox */}
                 <div className="absolute -left-3 md:-left-4 top-1/2 -translate-y-1/2 z-20">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleSelection(cue.id, e.shiftKey); }}
                        className={`p-1.5 rounded-lg transition-all ${isSelected ? 'text-blue-600 bg-white shadow-sm dark:bg-neutral-800 dark:text-blue-400' : 'text-neutral-300 hover:text-neutral-500 dark:text-neutral-700 dark:hover:text-neutral-500'}`}
                    >
                        {isSelected ? <CheckSquare size={20} fill="currentColor" className="text-blue-100 dark:text-blue-900" /> : <Square size={20} />}
                    </button>
                 </div>

                {/* Desktop Index & Grip */}
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300 dark:text-neutral-700 hidden md:flex items-center gap-2 cursor-grab active:cursor-grabbing hover:text-primary-500 transition-colors p-2 -ml-2 select-none"
                >
                    <GripVertical size={20} />
                    <span className={`text-sm font-mono font-medium min-w-[1.5rem] flex items-center gap-1 ${isActive ? 'text-primary-600' : ''}`}>
                        {index + 1}
                        {isLineOverlap && (
                            <div className="text-red-500 animate-pulse" title={`Overlap warning: Starts before Line ${index} ends`}>
                                <AlertCircle size={14} />
                            </div>
                        )}
                    </span>
                </div>

                {/* Mobile Index / Handle */}
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  className="md:hidden absolute top-3 left-4 text-xs font-mono font-bold text-neutral-400 flex items-center gap-1 cursor-grab active:cursor-grabbing p-2 -m-2 select-none touch-none"
                >
                  <GripVertical size={16} />
                  #{index + 1}
                  {isLineOverlap && <AlertCircle size={14} className="text-red-500" />}
                </div>

                {/* Timing Controls */}
                <div className={`flex flex-col gap-3 shrink-0 ${viewMode === 'timeline' ? 'w-auto justify-center mt-8 md:mt-0 md:ml-6 lg:ml-10' : 'w-full md:w-64 mt-8 md:mt-0 md:ml-20'}`}>
                     {viewMode !== 'timeline' && (
                        <div className="flex flex-row md:flex-col gap-3">
                           <TimeInput 
                             ms={cue.start} 
                             onChange={(val) => updateCue(index, 'start', val)}
                             label="Start"
                             className={`flex-1 ${isLineOverlap ? 'ring-1 ring-red-500 rounded-lg' : ''}`}
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
                           className={`flex items-center justify-center transition font-medium ${viewMode === 'timeline' ? 'text-primary-500 hover:text-primary-600 p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg shrink-0' : 'w-full gap-2 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 mt-1 text-sm'}`}
                           title="Play from this line"
                         >
                           <PlayCircle size={viewMode === 'timeline' ? 24 : 18} /> 
                           {viewMode !== 'timeline' && ' Play Line'}
                         </button>
                     )}
                </div>

                {/* Text Content */}
                <div className={`flex-1 w-full relative flex flex-col ${viewMode === 'timeline' ? 'min-h-0' : 'min-h-[140px]'}`}>
                  <div className="absolute left-4 top-4 text-neutral-400 pointer-events-none">
                    <AlignLeft size={20} />
                  </div>
                  
                  {viewMode === 'word' ? (
                     <div className="pl-12 w-full py-4 leading-relaxed">
                        <div className="flex flex-wrap gap-4 mb-6">
                           {getDisplayWords(cue, index).map((word, wIdx) => {
                               const isWordActive = currentMillis >= (word.start || 0) && currentMillis < (word.end || 0);
                               const wordId = `${cue.id}-${wIdx}`;
                               return (
                                   <div 
                                      key={`w-${index}-${wIdx}`}
                                      className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg border transition min-w-[110px] relative cursor-pointer group/word
                                         ${isWordActive 
                                            ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-300 dark:border-primary-700 shadow-sm' 
                                            : 'bg-neutral-50 dark:bg-neutral-800/20 border-neutral-200 dark:border-neutral-800'}
                                      `}
                                      onClick={() => onSeek && onSeek(word.start || 0, true, (word.end || (word.start || 0) + 800))}
                                   >
                                      {/* Word Timing Header */}
                                      <div className="flex items-center gap-1.5 w-full justify-between pb-0.5">
                                          <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const current = word.start || 0;
                                                updateWordInCue(index, wIdx, 'start', Math.max(cue.start, current - 50));
                                            }}
                                            className="w-5 h-5 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition text-neutral-500 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                            title="-50ms"
                                          >
                                              <Minus size={10} />
                                          </button>
                                          <div className="text-[10px] font-mono text-neutral-500">
                                              {msToMmSsMmm(word.start || 0).split(':').slice(1).join(':')}
                                          </div>
                                          <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const current = word.start || 0;
                                                updateWordInCue(index, wIdx, 'start', current + 50);
                                            }}
                                            className="w-5 h-5 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition text-neutral-500 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                            title="+50ms"
                                          >
                                              <Plus size={10} />
                                          </button>
                                      </div>
                                      
                                      {/* Word Text */}
                                      <div 
                                        className="text-sm md:text-base py-0.5 text-neutral-800 dark:text-neutral-200 select-none cursor-pointer hover:text-primary-600 transition truncate w-full text-center"
                                      >
                                          {word.text}
                                      </div>

                                      {/* Speaker Icon */}
                                      <div className="flex items-center justify-center">
                                          <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playTTS && playTTS(wordId, word.text);
                                            }}
                                            className={`p-1 rounded-full transition ${playingTTSId === wordId ? 'text-primary-500 bg-primary-100 dark:bg-primary-900/40' : 'text-neutral-400 hover:text-primary-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
                                            title="Speak word"
                                          >
                                              {playingTTSId === wordId ? <Square size={10} fill="currentColor" /> : <Volume2 size={10} />}
                                          </button>
                                      </div>
                                   </div>
                               );
                           })}
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={() => onEditWords && onEditWords(index)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition font-bold text-xs"
                              >
                                <Mic size={14} />
                                <span>Word Timing</span>
                              </button>
                              <button 
                                onClick={() => playTTS && playTTS(cue.id, cue.text)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition font-bold text-xs"
                              >
                                {playingTTSId === cue.id ? <Square size={14} fill="currentColor" className="text-primary-500" /> : <Volume2 size={14} />}
                                <span>Speak Line</span>
                              </button>
                           </div>
                           <button 
                             onClick={() => removeCue(index)}
                             className="flex items-center gap-2 px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition font-bold text-xs"
                           >
                             <Trash2 size={14} />
                             <span>Delete</span>
                           </button>
                        </div>
                     </div>
                  ) : viewMode === 'timeline' ? (
                     <div className="pl-10 w-full py-2 flex items-center gap-2">
                         <div className="flex-1 flex flex-col">
                            <div className="relative h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 flex select-none">
                               {(() => {
                                   let renderCue = { ...cue };
                                   let renderWords = getDisplayWords(cue, index).map((w: any) => ({ ...w }));
                                   
                                   if (timelineDragInfo && timelineDragInfo.cueIndex === index) {
                                       const currentMs = timelineDragInfo.currentBoundaryMs;
                                       if (timelineDragInfo.type === 'cue-start') {
                                           renderCue.start = currentMs;
                                           if (renderWords[0]?.start !== undefined) {
                                               renderWords[0].start = currentMs;
                                           }
                                       } else if (timelineDragInfo.type === 'cue-end') {
                                           renderCue.end = currentMs;
                                           const lastW = renderWords[renderWords.length - 1];
                                           if (lastW?.end !== undefined) {
                                               lastW.end = currentMs;
                                           }
                                       } else if (timelineDragInfo.type === 'word' && timelineDragInfo.wordIdx !== undefined) {
                                           const wIdx = timelineDragInfo.wordIdx;
                                           if (renderWords.length > wIdx + 1) {
                                               renderWords[wIdx].end = currentMs;
                                               renderWords[wIdx + 1].start = currentMs;
                                           }
                                       } else if (timelineDragInfo.type === 'word-move' && timelineDragInfo.wordIdx !== undefined && timelineDragInfo.duration !== undefined) {
                                           const wIdx = timelineDragInfo.wordIdx;
                                           renderWords[wIdx].start = currentMs;
                                           renderWords[wIdx].end = currentMs + timelineDragInfo.duration;
                                       }
                                   }

                                   const cueDuration = Math.max(renderCue.end - renderCue.start, 100);
                                   const isCueActive = currentMillis >= renderCue.start && currentMillis < renderCue.end;
                                   
                                   return (
                                       <>
                                           {/* Playback Slider */}
                                           {isCueActive && (
                                               <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-30">
                                                   <div 
                                                     className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                                     style={{ left: `${Math.max(0, Math.min(100, ((currentMillis - renderCue.start) / cueDuration) * 100))}%` }}
                                                   />
                                               </div>
                                           )}

                                           {/* Gray out trims */}
                                           {timelineDragInfo?.cueIndex === index && timelineDragInfo.type === 'cue-start' && (
                                               <div 
                                                  className="absolute left-0 top-0 bottom-0 bg-black/30 dark:bg-black/50 z-20 pointer-events-none"
                                                  style={{ 
                                                      width: `${Math.max(0, ((timelineDragInfo.currentBoundaryMs - cue.start) / Math.max(cue.end - cue.start, 100)) * 100)}%` 
                                                  }}
                                               />
                                           )}
                                           {timelineDragInfo?.cueIndex === index && timelineDragInfo.type === 'cue-end' && (
                                               <div 
                                                  className="absolute right-0 top-0 bottom-0 bg-black/30 dark:bg-black/50 z-20 pointer-events-none"
                                                  style={{ 
                                                      width: `${Math.max(0, ((cue.end - timelineDragInfo.currentBoundaryMs) / Math.max(cue.end - cue.start, 100)) * 100)}%` 
                                                  }}
                                               />
                                           )}
                                           
                                           {renderWords.map((word: any, wIdx: number, allWords: any[]) => {
                                               const wordStart = word.start || renderCue.start;
                                               const wordEnd = word.end || (wordStart + 300);
                                               
                                               const leftPxPercent = Math.max(0, (wordStart - renderCue.start) / cueDuration * 100);
                                               const widthPercent = Math.max(0, (wordEnd - wordStart) / cueDuration * 100);
                                               
                                               const isWordActive = currentMillis >= wordStart && currentMillis < wordEnd;
                                               
                                               return (
                                                   <div 
                                                      key={`tw-${index}-${wIdx}`}
                                                      className={`absolute h-full flex flex-col justify-center items-center border-r border-neutral-300 dark:border-neutral-600 box-border cursor-pointer transition-shadow group/word ${isWordActive ? 'bg-primary-100 dark:bg-primary-900/60' : 'bg-white dark:bg-neutral-800'} ${timelineDragInfo?.type === 'word-move' && timelineDragInfo.wordIdx === wIdx ? 'ring-2 ring-primary-500 z-40 shadow-lg' : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                                                      style={{
                                                          left: `${leftPxPercent}%`,
                                                          width: `${widthPercent}%`
                                                      }}
                                                      onMouseDown={(e) => {
                                                          if (e.button !== 0) return;
                                                          e.preventDefault();
                                                          e.stopPropagation();
                                                          
                                                          const parentEl = e.currentTarget.parentElement;
                                                          if (!parentEl) return;
                                                          const pixelsPerMs = parentEl.offsetWidth / cueDuration;
                                                          
                                                          const words = getDisplayWords(cue, index);
                                                          const wordStart = word.start || renderCue.start;
                                                          const wordEnd = word.end || (wordStart + 300);
                                                          const minLimit = wIdx === 0 ? renderCue.start : (words[wIdx-1].end || renderCue.start);
                                                          const maxLimit = wIdx === words.length - 1 ? renderCue.end : (words[wIdx+1].start || renderCue.end);
                                                          const duration = wordEnd - wordStart;

                                                          setTimelineDragInfo({
                                                              type: 'word-move',
                                                              cueIndex: index,
                                                              wordIdx: wIdx,
                                                              startX: e.clientX,
                                                              initialBoundaryMs: wordStart,
                                                              currentBoundaryMs: wordStart,
                                                              minMs: minLimit,
                                                              maxMs: maxLimit - duration,
                                                              pixelsPerMs,
                                                              duration
                                                          });
                                                      }}
                                                      onClick={() => onSeek && onSeek(word.start || renderCue.start, true, word.end || (word.start || renderCue.start) + 300)}
                                                   >
                                                       <div className="px-1 w-full text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis text-center text-neutral-800 dark:text-neutral-200 pointer-events-none">
                                                          {word.text}
                                                       </div>
                                                       <div className="flex items-center gap-1.5 px-1 w-full text-[8px] text-neutral-400 pointer-events-none justify-center">
                                                          <span className="opacity-0 group-hover/word:opacity-100 transition-opacity">{msToMmSsMmm(wordStart).split(':').slice(1).join(':')}</span>
                                                          <span className="text-neutral-500 font-bold">{((wordEnd - wordStart) / 1000).toFixed(2)}s</span>
                                                          <span className="opacity-0 group-hover/word:opacity-100 transition-opacity">{msToMmSsMmm(wordEnd).split(':').slice(1).join(':')}</span>
                                                       </div>
                                                       
                                                       {wIdx + 1 < allWords.length && (
                                                           <div 
                                                              className="absolute -right-2 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-primary-500/50 z-50 flex items-center justify-center group/handle"
                                                              title="Drag to adjust boundary"
                                                              onMouseDown={(e) => {
                                                                  e.preventDefault();
                                                                  e.stopPropagation();
                                                                  const parentEl = e.currentTarget.parentElement?.parentElement;
                                                                  if (!parentEl) return;
                                                                  const pixelsPerMs = parentEl.offsetWidth / cueDuration;
                                                                  
                                                                  const nextWordEnd = allWords[wIdx + 1].end || (allWords[wIdx + 1].start || 0) + 100;
                                                                  
                                                                  setTimelineDragInfo({
                                                                      type: 'word',
                                                                      cueIndex: index,
                                                                      wordIdx: wIdx,
                                                                      startX: e.clientX,
                                                                      initialBoundaryMs: wordEnd,
                                                                      currentBoundaryMs: wordEnd,
                                                                      minMs: wordStart + 50,
                                                                      maxMs: nextWordEnd - 50,
                                                                      pixelsPerMs
                                                                  });
                                                              }}
                                                           >
                                                               <div className="w-1 h-4 bg-neutral-300 dark:bg-neutral-600 rounded-full group-hover/handle:bg-primary-500 transition-colors" />
                                                           </div>
                                                       )}
                                                   </div>
                                               );
                                           })}

                                           {/* Cue Start Handle */}
                                           <div 
                                              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-amber-500/50 z-30 tooltip flex flex-col justify-center items-center"
                                              title="Drag to adjust line start"
                                              onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  const parentEl = e.currentTarget.parentElement;
                                                  if (!parentEl) return;
                                                  const pixelsPerMs = parentEl.offsetWidth / Math.max(cue.end - cue.start, 100);
                                                  
                                                  
                                                  const firstWordEnd = renderWords[0]?.end || cue.start + 100;
                                                  
                                                  setTimelineDragInfo({
                                                      type: 'cue-start',
                                                      cueIndex: index,
                                                      startX: e.clientX,
                                                      initialBoundaryMs: cue.start,
                                                      currentBoundaryMs: cue.start,
                                                      minMs: prevCueEnd,
                                                      maxMs: firstWordEnd - 50,
                                                      pixelsPerMs
                                                  });
                                              }}
                                           >
                                              <div className="w-0.5 h-4 bg-black/40 dark:bg-white/40 rounded-full pointer-events-none" />
                                           </div>

                                           {/* Cue End Handle */}
                                           <div 
                                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-amber-500/50 z-30 tooltip flex flex-col justify-center items-center"
                                              title="Drag to adjust line end"
                                              onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  const parentEl = e.currentTarget.parentElement;
                                                  if (!parentEl) return;
                                                  const pixelsPerMs = parentEl.offsetWidth / Math.max(cue.end - cue.start, 100);
                                                  
                                                  
                                                  const lastWordStart = renderWords[renderWords.length - 1]?.start || cue.end - 100;
                                                  
                                                  setTimelineDragInfo({
                                                      type: 'cue-end',
                                                      cueIndex: index,
                                                      startX: e.clientX,
                                                      initialBoundaryMs: cue.end,
                                                      currentBoundaryMs: cue.end,
                                                      minMs: lastWordStart + 50,
                                                      maxMs: nextCueStart,
                                                      pixelsPerMs
                                                  });
                                              }}
                                           >
                                              <div className="w-0.5 h-4 bg-black/40 dark:bg-white/40 rounded-full pointer-events-none" />
                                           </div>
                                       </>
                                   );
                               })()}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1 uppercase font-semibold">
                                <span>{msToMmSsMmm(timelineDragInfo?.cueIndex === index && timelineDragInfo.type === 'cue-start' ? timelineDragInfo.currentBoundaryMs : cue.start)}</span>
                                <span>Timeline View (Drag words or boundaries to adjust)</span>
                                <span>{msToMmSsMmm(timelineDragInfo?.cueIndex === index && timelineDragInfo.type === 'cue-end' ? timelineDragInfo.currentBoundaryMs : cue.end)}</span>
                            </div>
                         </div>
                         <button 
                           onClick={() => removeCue(index)}
                           className="shrink-0 text-red-500 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                           title="Delete Line"
                         >
                           <Trash2 size={20} />
                         </button>
                      </div>
                  ) : (
                     <>
                       <LocalTextarea
                        rows={2}
                        value={cue.text}
                        onChange={(val) => updateCue(index, 'text', val)}
                        className={`
                          w-full pl-12 pr-4 py-4 rounded-xl border outline-none resize-none transition leading-relaxed
                          ${isActive 
                              ? 'bg-white dark:bg-neutral-950 border-primary-200 dark:border-primary-800 text-primary-900 dark:text-white font-medium ring-2 ring-primary-100 dark:ring-primary-900/20' 
                              : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                          }
                          text-lg md:text-xl
                        `}
                        placeholder="Subtitle text..."
                      />
                      <div className="flex items-center gap-3 mt-3">
                          <button 
                            onClick={() => onEditWords && onEditWords(index)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition text-sm font-medium"
                            title="Edit Word Timestamps (Karaoke)"
                          >
                            <Mic size={16} />
                            <span>Word Timing</span>
                            {/* Fix: Strictly check if words array exists and has items */}
                            {cue.words && Array.isArray(cue.words) && cue.words.length > 0 ? <span className="w-2 h-2 rounded-full bg-green-500 ml-1"></span> : null}
                          </button>
                          
                          {/* TTS Button for Line */}
                          <button 
                            onClick={() => playTTS && playTTS(cue.id, cue.text)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition text-sm font-medium"
                            title={playingTTSId === cue.id ? "Stop TTS" : "Speak Line (TTS)"}
                          >
                            {playingTTSId === cue.id ? <Square size={16} fill="currentColor" className="text-primary-500" /> : <Volume2 size={16} />}
                            <span className="hidden sm:inline">{playingTTSId === cue.id ? "Stop" : "Speak"}</span>
                          </button>

                          <button 
                            onClick={() => removeCue(index)}
                            className="ml-auto text-sm text-red-500 hover:text-red-600 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition font-medium flex items-center gap-1"
                          >
                            <span className="hidden sm:inline">Delete</span>
                            <span className="sm:hidden">Del</span>
                          </button>
                      </div>
                     </>
                  )}
                </div>
              </div>
        </React.Fragment>
    );
}, areEqual);

const CueList: React.FC<CueListProps> = ({ cues, onChange, onEditWords, currentMillis, onSeek, viewMode, selectedCueIds, onToggleSelection, onInsert, ttsLanguage }) => {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [playingTTSId, setPlayingTTSId] = useState<string | null>(null);

  const getDisplayWords = (cue: Cue, index: number): Word[] => {
    if (cue.words && cue.words.length > 0) return cue.words;
    return cue.text.trim().split(/\s+/).filter(Boolean).map((text, i) => ({
      id: `gen-${cue.id}-${i}`,
      text,
      start: cue.start + (i * 200),
      end: cue.start + ((i + 1) * 200)
    }));
  };

  // Timeline dragging state
  const [timelineDragInfo, setTimelineDragInfo] = useState<{
    type: 'word' | 'cue-start' | 'cue-end' | 'word-move';
    cueIndex: number;
    wordIdx?: number;
    startX: number;
    initialBoundaryMs: number;
    currentBoundaryMs: number;
    minMs: number;
    maxMs: number;
    pixelsPerMs: number;
    duration?: number;
  } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!timelineDragInfo) return;
        
        const deltaX = e.clientX - timelineDragInfo.startX;
        const deltaMs = Math.round(deltaX / timelineDragInfo.pixelsPerMs);
        
        let newBoundaryMs = timelineDragInfo.initialBoundaryMs + deltaMs;
        
        if (newBoundaryMs < timelineDragInfo.minMs) newBoundaryMs = timelineDragInfo.minMs;
        if (newBoundaryMs > timelineDragInfo.maxMs) newBoundaryMs = timelineDragInfo.maxMs;

        setTimelineDragInfo(prev => prev ? { ...prev, currentBoundaryMs: newBoundaryMs } : null);
    };

    const handleMouseUp = () => {
        setTimelineDragInfo(prev => {
            if (!prev) return null;
            
            const { type, cueIndex, wordIdx, currentBoundaryMs, initialBoundaryMs, duration } = prev;
            
            if (currentBoundaryMs !== initialBoundaryMs) {
                const newCues = [...cues];
                const cue = { ...newCues[cueIndex] };
                let words = getDisplayWords(cue, cueIndex).map(w => ({ ...w }));
                
                if (type === 'word' && wordIdx !== undefined) {
                    words[wordIdx].end = currentBoundaryMs;
                    words[wordIdx + 1].start = currentBoundaryMs;
                } else if (type === 'word-move' && wordIdx !== undefined && duration !== undefined) {
                    words[wordIdx].start = currentBoundaryMs;
                    words[wordIdx].end = currentBoundaryMs + duration;
                } else if (type === 'cue-start') {
                    cue.start = currentBoundaryMs;
                    if (words[0]?.start !== undefined) {
                        words[0].start = currentBoundaryMs;
                    }
                } else if (type === 'cue-end') {
                    cue.end = currentBoundaryMs;
                    const lastW = words[words.length - 1];
                    if (lastW?.end !== undefined) {
                        lastW.end = currentBoundaryMs;
                    }
                }
                
                cue.words = words;
                newCues[cueIndex] = cue;
                onChange(newCues);
            }
            return null;
        });
    };

    if (timelineDragInfo) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [timelineDragInfo, cues, onChange]);

  // Calculate active index
  const activeIndex = cues.findIndex(c => currentMillis >= c.start && currentMillis < c.end);

  // Auto-scroll to active cue
  useEffect(() => {
    if (activeIndex !== -1 && itemRefs.current[activeIndex]) {
      if (draggedIndex === null) {
          const scrollTimer = setTimeout(() => {
              itemRefs.current[activeIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
          }, 50);
          return () => clearTimeout(scrollTimer);
      }
    }
  }, [activeIndex, draggedIndex, viewMode]);

  const updateCue = (index: number, field: keyof Cue, value: string | number) => {
    const newCues = [...cues];
    if (field === 'start' || field === 'end') {
      const msValue = typeof value === 'string' ? timeToMs(value) : value;
      newCues[index] = { ...newCues[index], [field]: msValue };

      // SYNC: If Start time changed, sync First Word Start if it exists
      if (field === 'start') {
          const cue = newCues[index];
          if (cue.words && cue.words.length > 0) {
              const updatedWords = [...cue.words];
              // Update first word start to match line start
              updatedWords[0] = { ...updatedWords[0], start: msValue };
              newCues[index].words = updatedWords;
          }
      }

      // SYNC: If End time changed, sync Last Word End if it exists
      if (field === 'end') {
          const cue = newCues[index];
          if (cue.words && cue.words.length > 0) {
              const updatedWords = [...cue.words];
              const lastIdx = updatedWords.length - 1;
              // Sync the end time of the last word to the new line end time
              updatedWords[lastIdx] = { ...updatedWords[lastIdx], end: msValue as number };
              newCues[index].words = updatedWords;
          }
      }

    } else {
      newCues[index] = { ...newCues[index], [field]: value };
    }
    onChange(newCues);
  };

  const removeCue = (index: number) => {
    const newCues = cues.filter((_, i) => i !== index);
    onChange(newCues);
  };

  const handlePlayTTS = async (id: string, text: string) => {
      // If clicking the currently playing/loading item, stop it
      if (playingTTSId === id) {
          stopTTS();
          setPlayingTTSId(null);
          return;
      }
      
      // Stop any other active playback first
      if (playingTTSId) {
          stopTTS();
      }

      setPlayingTTSId(id);
      try {
          // Pass the selected language
          await playTTS(text, ttsLanguage);
          // If execution finishes normally (audio ended), clear state
          setPlayingTTSId((current) => current === id ? null : current);
      } catch (e) {
          console.error(e);
          // On error or manual abort, ensure state is cleared
          setPlayingTTSId((current) => current === id ? null : current);
      }
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    setOverIndex(null);
    e.dataTransfer.effectAllowed = 'move';
    if (itemRefs.current[index]) {
       e.dataTransfer.setDragImage(itemRefs.current[index]!, 20, 20);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault(); 
    if (draggedIndex === index) return;
    e.dataTransfer.dropEffect = 'move';
    if (overIndex !== index) {
      setOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newCues = [...cues];
    const [movedItem] = newCues.splice(draggedIndex, 1);
    newCues.splice(dropIndex, 0, movedItem);
    
    onChange(newCues);
    setDraggedIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setOverIndex(null);
  };

  const updateWordInCue = (cueIndex: number, wordIndex: number, field: keyof Word, value: string | number) => {
    const cue = cues[cueIndex];
    let words = getDisplayWords(cue, cueIndex);
    const updatedWords = [...words];
    
    let msVal = value;
    if (field === 'start' || field === 'end') {
       msVal = typeof value === 'string' ? timeToMs(value) : value;
    }
    
    updatedWords[wordIndex] = { ...updatedWords[wordIndex], [field]: msVal };
    
    const newText = updatedWords.map(w => w.text).join(' ');
    const newCues = [...cues];
    newCues[cueIndex] = { ...cue, words: updatedWords, text: newText };

    // SYNC: If First Word Start changed, sync Line Start
    if (wordIndex === 0 && field === 'start') {
        newCues[cueIndex].start = msVal as number;
    }

    onChange(newCues);
  };

  return (
    <div className="w-full flex flex-col">
      {cues.map((cue, index) => {
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
            prevCueEnd={index > 0 ? cues[index - 1].end : 0}
            nextCueStart={index < cues.length - 1 ? cues[index + 1].start : cue.end + 60000}
            onEditWords={onEditWords}
          />
        );
      })}
      {/* Final separator at the bottom */}
      <InsertSeparator onClick={() => onInsert(cues.length)} />

      {/* Big Add Button at the end */}
      <button 
        onClick={() => onInsert(cues.length)}
        className="w-full py-6 mt-4 border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl text-neutral-400 hover:text-primary-600 hover:border-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition flex flex-col items-center justify-center gap-2 group"
      >
        <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition">
            <Plus size={24} />
        </div>
        <span className="font-medium">Add New Line</span>
      </button>
    </div>
  );
};

export default CueList;