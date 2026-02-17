
export enum VizMode {
  ORGANIC_WAVE = 'ORGANIC_WAVE',
  SYMMETRIC_SPIKES = 'SYMMETRIC_SPIKES',
  BLOCK_EQUALIZER = 'BLOCK_EQUALIZER',
  SINE_RHYTHM = 'SINE_RHYTHM',
  FADER_DANCE = 'FADER_DANCE'
}

export interface AudioSlot {
  id: number;
  file: File | null;
  name: string;
  url: string | null;
}

export interface VisualizerConfig {
  mode: VizMode;
  colors: string[];
  particleCount: number;
}
