export interface IAudioRecorder {
  /**
   * Initialize the audio recorder with the given settings
   */
  initialize(settings: AudioRecorderSettings): Promise<void>;
  
  /**
   * Start recording audio from the microphone
   */
  startRecording(): Promise<void>;
  
  /**
   * Stop recording and return the audio data
   */
  stopRecording(): Promise<AudioData>;
  
  /**
   * Check if recording is currently active
   */
  isRecording(): boolean;
  
  /**
   * Check if microphone permission is granted
   */
  hasPermission(): Promise<boolean>;
  
  /**
   * Request microphone permission
   */
  requestPermission(): Promise<boolean>;
  
  /**
   * Get available audio input devices
   */
  getAudioDevices(): Promise<MediaDeviceInfo[]>;
  
  /**
   * Set the audio input device
   */
  setAudioDevice(deviceId: string): Promise<void>;
  
  /**
   * Clean up resources
   */
  dispose(): void;
}

export interface AudioRecorderSettings {
  sampleRate: number;
  channelCount: number;
  bitDepth: number;
  maxDuration: number; // in seconds
  deviceId?: string;
}

export interface AudioData {
  buffer: ArrayBuffer;
  sampleRate: number;
  channelCount: number;
  duration: number; // in seconds
  format: 'wav' | 'pcm';
}

export interface AudioRecorderEvents {
  onRecordingStart: () => void;
  onRecordingStop: (data: AudioData) => void;
  onRecordingError: (error: Error) => void;
  onPermissionDenied: () => void;
  onDeviceChange: (devices: MediaDeviceInfo[]) => void;
}

export class AudioRecorderError extends Error {
  constructor(
    message: string,
    public code: AudioRecorderErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AudioRecorderError';
  }
}

export enum AudioRecorderErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  RECORDING_FAILED = 'RECORDING_FAILED',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  MAX_DURATION_EXCEEDED = 'MAX_DURATION_EXCEEDED'
}
