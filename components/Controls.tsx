
import React, { useRef } from 'react';
import { VizMode, AudioSlot } from '../types';
import { VIZ_MODES_INFO } from '../constants';

interface ControlsProps {
  slots: AudioSlot[];
  activeSlotId: number | null;
  onUpload: (id: number, file: File) => void;
  onSelect: (id: number) => void;
  onReset: () => void;
  currentMode: VizMode;
  setMode: (mode: VizMode) => void;
  isPlaying: boolean;
  activeColor: string;
}

const Controls: React.FC<ControlsProps> = ({ 
  slots, 
  activeSlotId, 
  onUpload, 
  onSelect, 
  onReset,
  currentMode, 
  setMode, 
  isPlaying,
  activeColor
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadingIdRef = useRef<number | null>(null);

  const triggerUpload = (id: number) => {
    uploadingIdRef.current = id;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && uploadingIdRef.current !== null) {
      onUpload(uploadingIdRef.current, e.target.files[0]);
      uploadingIdRef.current = null;
    }
  };

  return (
    <div className="flex flex-col gap-6 pointer-events-auto">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="audio/mp3,audio/mpeg" 
        className="hidden" 
      />

      {/* Mode Navigation */}
      <div className="flex flex-col gap-1">
        <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em] mb-2 px-1">Geometry Engine</p>
        <div className="flex flex-col gap-1">
          {VIZ_MODES_INFO.map((mode) => {
            const isSelected = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setMode(mode.id as VizMode)}
                className="px-4 py-2 text-left transition-all duration-500 relative group overflow-hidden border-l-[1px]"
                style={{ 
                  borderColor: isSelected ? activeColor : 'rgba(255,255,255,0.05)',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.03)' : 'transparent',
                }}
              >
                <span 
                    className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isSelected ? '' : 'text-white/20 group-hover:text-white/60'}`}
                    style={{ color: isSelected ? activeColor : '' }}
                >
                    {mode.label}
                </span>
                {isSelected && (
                    <div 
                        className="absolute right-0 top-0 bottom-0 w-[2px] opacity-50"
                        style={{ backgroundColor: activeColor }}
                    />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Playback Global Controls */}
      {activeSlotId !== null && (
        <div className="px-1">
           <button 
             onClick={onReset}
             className="w-full py-2.5 text-[9px] font-black uppercase tracking-[0.3em] border border-white/5 hover:border-white/20 text-white/40 hover:text-white transition-all bg-white/[0.02]"
           >
             [ Reset_Signal ]
           </button>
        </div>
      )}

      {/* Audio Slots Inventory */}
      <div className="flex flex-col gap-2">
        <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em] mb-1 px-1">Sound Modules</p>
        <div className="flex flex-col gap-1.5">
          {slots.map((slot) => {
            const isActive = activeSlotId === slot.id;
            return (
              <div 
                key={slot.id}
                className={`relative p-3 transition-all duration-500 border-b border-white/[0.03] flex items-center gap-4 ${isActive ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}
              >
                <span className={`text-[8px] font-mono transition-colors ${isActive ? '' : 'text-white/10'}`} style={{ color: isActive ? activeColor : '' }}>
                    {isActive ? '>>' : `0${slot.id + 1}`}
                </span>
                
                <div className="flex-1 truncate">
                  <p className={`text-[10px] font-bold uppercase tracking-widest truncate transition-colors duration-500 ${isActive ? 'text-white' : 'text-white/10 group-hover:text-white/30'}`}>
                    {slot.file ? slot.name : 'empty_array'}
                  </p>
                </div>

                <div className="flex gap-2">
                    {!slot.file ? (
                        <button 
                            onClick={() => triggerUpload(slot.id)}
                            className="p-1.5 text-white/20 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </button>
                    ) : (
                        <button 
                            onClick={() => onSelect(slot.id)}
                            className={`px-3 py-1 text-[8px] font-black uppercase border transition-all duration-500`}
                            style={{ 
                                backgroundColor: isActive && isPlaying ? activeColor : 'transparent',
                                color: isActive && isPlaying ? 'black' : 'white',
                                borderColor: isActive && isPlaying ? activeColor : 'rgba(255,255,255,0.1)'
                            }}
                        >
                            {isActive && isPlaying ? 'PAUSE' : 'START'}
                        </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Controls;
