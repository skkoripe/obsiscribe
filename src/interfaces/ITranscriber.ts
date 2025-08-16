import { AudioData } from './IAudioRecorder';

export interface ITranscriber {
  /**
   * Initialize the transcriber with the given settings
   */
  initialize(settings: TranscriberSettings): Promise<void>;
  
  /**
   * Load the AI model for transcription
   */
  loadModel(): Promise<void>;
  
  /**
   * Check if the model is loaded and ready
   */
  isModelLoaded(): boolean;
  
  /**
   * Transcribe audio data to text
   */
  transcribe(audioData: AudioData): Promise<TranscriptionResult>;
  
  /**
   * Get available languages for transcription
   */
  getAvailableLanguages(): string[];
  
  /**
   * Set the transcription language
   */
  setLanguage(language: string): Promise<void>;
  
  /**
   * Clean up resources and unload model
   */
  dispose(): void;
}

export interface TranscriberSettings {
  modelPath: string;
  language: string;
  enablePunctuation: boolean;
  enableCapitalization: boolean;
  confidenceThreshold: number;
  maxProcessingTime: number; // in seconds
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  segments: TranscriptionSegment[];
  processingTime: number; // in milliseconds
  language: string;
}

export interface TranscriptionSegment {
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  confidence: number;
}

export interface TranscriberEvents {
  onModelLoaded: () => void;
  onModelLoadError: (error: Error) => void;
  onTranscriptionStart: () => void;
  onTranscriptionComplete: (result: TranscriptionResult) => void;
  onTranscriptionError: (error: Error) => void;
  onProgress: (progress: number) => void; // 0-100
}

export class TranscriberError extends Error {
  constructor(
    message: string,
    public code: TranscriberErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'TranscriberError';
  }
}

export enum TranscriberErrorCode {
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  MODEL_LOAD_FAILED = 'MODEL_LOAD_FAILED',
  UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE',
  TRANSCRIPTION_FAILED = 'TRANSCRIPTION_FAILED',
  INVALID_AUDIO_FORMAT = 'INVALID_AUDIO_FORMAT',
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  INSUFFICIENT_MEMORY = 'INSUFFICIENT_MEMORY'
}
