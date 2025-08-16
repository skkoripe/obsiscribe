export interface IPluginSettings {
  // Audio settings
  audioQuality: 'low' | 'medium' | 'high';
  sampleRate: number;
  maxRecordingDuration: number; // in seconds
  
  // Transcription settings
  modelPath: string;
  language: string;
  enablePunctuation: boolean;
  enableCapitalization: boolean;
  
  // UI settings
  showRecordingIndicator: boolean;
  recordingButtonPosition: 'ribbon' | 'statusbar' | 'both';
  
  // Text insertion settings
  insertionMode: 'cursor' | 'append' | 'prepend';
  textPrefix: string;
  textSuffix: string;
  addTimestamp: boolean;
  
  // Advanced settings
  enableDebugLogging: boolean;
  autoSaveAfterTranscription: boolean;
}

export const DEFAULT_SETTINGS: IPluginSettings = {
  audioQuality: 'medium',
  sampleRate: 16000,
  maxRecordingDuration: 300, // 5 minutes
  
  modelPath: '',
  language: 'en',
  enablePunctuation: true,
  enableCapitalization: true,
  
  showRecordingIndicator: true,
  recordingButtonPosition: 'ribbon',
  
  insertionMode: 'cursor',
  textPrefix: '',
  textSuffix: '\n\n',
  addTimestamp: false,
  
  enableDebugLogging: false,
  autoSaveAfterTranscription: true
};
