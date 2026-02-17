
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VizMode, AudioSlot } from './types';
import Visualizer from './components/Visualizer';
import Controls from './components/Controls';
import { COLOR_PALETTE } from './constants';

const App: React.FC = () => {
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [slots, setSlots] = useState<AudioSlot[]>(Array.from({ length: 5 }, (_, i) => ({
    id: i,
    file: null,
    name: `Slot ${i + 1}`,
    url: null
  })));
  const [mode, setMode] = useState<VizMode>(VizMode.ORGANIC_WAVE);
  const [colorIndex, setColorIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % COLOR_PALETTE.length);
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";
    }
    if (!audioSourceRef.current && audioRef.current && audioContextRef.current) {
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      setAudioAnalyser(analyser);
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      audioSourceRef.current = source;
    }
  }, []);

  const handleFileUpload = (id: number, file: File) => {
    const url = URL.createObjectURL(file);
    setSlots(prev => prev.map(s => s.id === id ? { ...s, file, name: file.name, url } : s));
  };

  const handleSlotSelect = (id: number) => {
    initAudio();
    const slot = slots.find(s => s.id === id);
    if (!slot || !slot.url) return;

    if (activeSlotId === id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = slot.url;
        audioRef.current.play();
        setActiveSlotId(id);
        setIsPlaying(true);
        setColorIndex((prev) => (prev + 1) % COLOR_PALETTE.length);
      }
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none cursor-crosshair">
      <Visualizer 
        analyser={audioAnalyser} 
        mode={mode} 
        activeColor={COLOR_PALETTE[colorIndex]}
        isPlaying={isPlaying}
      />

      {/* Aesthetic Brand Label - Minimalist Bottom Left */}
      <div className="absolute bottom-12 left-12 pointer-events-none z-10 flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tighter text-white opacity-80 italic flex items-center gap-3">
          <div className="w-1 h-8" style={{ backgroundColor: COLOR_PALETTE[colorIndex], transition: 'background-color 1.5s ease' }}></div>
          VIBE<span style={{ color: COLOR_PALETTE[colorIndex], transition: 'color 1.5s ease' }}>AUDIO</span>
        </h1>
        <div className="flex items-center gap-4 opacity-20">
            <span className="text-[8px] uppercase tracking-[0.6em] font-bold">Resonance Analysis v3.1</span>
            <div className="h-[1px] w-24 bg-white"></div>
        </div>
      </div>

      {/* Navigation & Controls - High Fidelity Top Right */}
      <div className="absolute top-10 right-10 z-20 w-64 max-h-[85vh] overflow-y-auto no-scrollbar pointer-events-none bg-black/40 backdrop-blur-md p-1 border-r border-t border-white/5">
        <Controls 
          slots={slots}
          activeSlotId={activeSlotId}
          onUpload={handleFileUpload}
          onSelect={handleSlotSelect}
          onReset={handleReset}
          currentMode={mode}
          setMode={(m) => {
            setMode(m);
            setColorIndex((prev) => (prev + 1) % COLOR_PALETTE.length);
          }}
          isPlaying={isPlaying}
          activeColor={COLOR_PALETTE[colorIndex]}
        />
      </div>

      {/* High-End Vignette */}
      <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-multiply bg-[radial-gradient(circle_at_center,transparent_20%,black_110%)]"></div>
      
      {/* Decorative Corner Elements */}
      <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-white/10 pointer-events-none"></div>
      <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-white/10 pointer-events-none"></div>
    </div>
  );
};

export default App;
