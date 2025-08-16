import { 
  ITranscriber, 
  TranscriberSettings, 
  TranscriptionResult, 
  TranscriberError, 
  TranscriberErrorCode 
} from '../interfaces/ITranscriber';
import { AudioData } from '../interfaces/IAudioRecorder';

// Import Moonshine AI - will be available after npm install
declare const Moonshine: any;

/**
 * MoonshineTranscriber class handles speech-to-text transcription using Moonshine AI
 * Implements the ITranscriber interface
 */
export class MoonshineTranscriber implements ITranscriber {
  private settings: TranscriberSettings | null = null;
  private modelLoaded = false;
  private microphoneTranscriber: any = null;
  private currentTranscription = '';

  /**
   * Initialize the transcriber with the given settings
   */
  async initialize(settings: TranscriberSettings): Promise<void> {
    this.settings = settings;
    console.log('MoonshineTranscriber initialized with settings:', settings);
    
    // Load the model automatically during initialization
    await this.loadModel();
  }

  /**
   * Load the AI model for transcription
   */
  async loadModel(): Promise<void> {
    try {
      if (this.modelLoaded) {
        console.log('Moonshine model already loaded');
        return;
      }

      console.log('Loading Moonshine AI model...');
      
      // Determine model size based on settings or default to 'tiny' for fastest performance
      const modelSize = this.getModelSize();
      
      // Create MicrophoneTranscriber with callbacks
      this.microphoneTranscriber = new Moonshine.MicrophoneTranscriber(
        `model/${modelSize}`,
        {
          onTranscriptionCommitted: (text: string) => {
            this.currentTranscription = text;
            console.log('Transcription committed:', text);
          },
          onTranscriptionUpdated: (text: string) => {
            this.currentTranscription = text;
            console.log('Transcription updated:', text);
          },
          onError: (error: any) => {
            console.error('Moonshine transcription error:', error);
          }
        },
        false // Disable VAD for streaming mode - we'll handle audio chunks manually
      );
      
      this.modelLoaded = true;
      console.log('Moonshine AI model loaded successfully');
    } catch (error) {
      throw new TranscriberError(
        'Failed to load Moonshine AI model',
        TranscriberErrorCode.MODEL_LOAD_FAILED,
        error as Error
      );
    }
  }

  /**
   * Determine model size based on settings or performance requirements
   */
  private getModelSize(): string {
    // Available models: tiny, base, small
    // tiny: fastest, smallest, good for real-time
    // base: balanced performance
    // small: highest accuracy, slower
    
    if (this.settings?.modelPath) {
      // Extract model size from path if specified
      const match = this.settings.modelPath.match(/model\/(tiny|base|small)/);
      if (match) {
        return match[1];
      }
    }
    
    // Default to tiny for best performance
    return 'tiny';
  }

  /**
   * Check if the model is loaded and ready
   */
  isModelLoaded(): boolean {
    return this.modelLoaded;
  }

  /**
   * Transcribe audio data to text
   */
  async transcribe(audioData: AudioData): Promise<TranscriptionResult> {
    if (!this.modelLoaded) {
      throw new TranscriberError(
        'Model not loaded. Call loadModel() first.',
        TranscriberErrorCode.MODEL_NOT_FOUND
      );
    }

    try {
      const startTime = Date.now();
      
      console.log('Transcribing audio data with Moonshine AI...');
      
      // For now, we'll use a mock implementation since we need to integrate
      // the actual audio processing with Moonshine's expected format
      // TODO: Convert AudioData to format expected by Moonshine AI
      
      // Reset current transcription
      this.currentTranscription = '';
      
      // Simulate processing time based on audio duration
      const processingDelay = Math.min(audioData.duration * 100, 2000); // Max 2 seconds
      await new Promise(resolve => setTimeout(resolve, processingDelay));
      
      const processingTime = Date.now() - startTime;
      
      // For Phase 1, return mock data. In Phase 3, we'll implement actual transcription
      const mockText = 'Mock transcription from Moonshine AI - Phase 1 skeleton';
      
      const result: TranscriptionResult = {
        text: mockText,
        confidence: 0.85,
        segments: [
          {
            text: mockText,
            startTime: 0,
            endTime: audioData.duration,
            confidence: 0.85
          }
        ],
        processingTime,
        language: this.settings?.language || 'en'
      };
      
      console.log('Moonshine transcription completed:', result);
      return result;
    } catch (error) {
      throw new TranscriberError(
        'Moonshine transcription failed',
        TranscriberErrorCode.TRANSCRIPTION_FAILED,
        error as Error
      );
    }
  }

  /**
   * Get available languages for transcription
   */
  getAvailableLanguages(): string[] {
    // Moonshine AI currently supports English primarily
    // Spanish model is also available under community license
    return ['en', 'es'];
  }

  /**
   * Set the transcription language
   */
  async setLanguage(language: string): Promise<void> {
    const availableLanguages = this.getAvailableLanguages();
    
    if (availableLanguages.indexOf(language) === -1) {
      throw new TranscriberError(
        `Unsupported language: ${language}. Moonshine AI supports: ${availableLanguages.join(', ')}`,
        TranscriberErrorCode.UNSUPPORTED_LANGUAGE
      );
    }

    if (this.settings) {
      this.settings.language = language;
      console.log('Moonshine language set to:', language);
      
      // If model is already loaded, we might need to reload with different language model
      if (this.modelLoaded && language !== 'en') {
        console.log('Reloading model for language:', language);
        this.modelLoaded = false;
        await this.loadModel();
      }
    }
  }

  /**
   * Start microphone transcription (for direct microphone input)
   */
  async startMicrophoneTranscription(): Promise<void> {
    if (!this.modelLoaded) {
      await this.loadModel();
    }
    
    if (this.microphoneTranscriber) {
      await this.microphoneTranscriber.start();
      console.log('Moonshine microphone transcription started');
    }
  }

  /**
   * Stop microphone transcription
   */
  async stopMicrophoneTranscription(): Promise<string> {
    if (this.microphoneTranscriber) {
      await this.microphoneTranscriber.stop();
      console.log('Moonshine microphone transcription stopped');
    }
    
    return this.currentTranscription;
  }

  /**
   * Clean up resources and unload model
   */
  dispose(): void {
    if (this.microphoneTranscriber) {
      // Stop any ongoing transcription
      try {
        this.microphoneTranscriber.stop();
      } catch (error) {
        console.warn('Error stopping Moonshine transcriber:', error);
      }
      this.microphoneTranscriber = null;
    }
    
    this.modelLoaded = false;
    this.settings = null;
    this.currentTranscription = '';
    console.log('MoonshineTranscriber disposed');
  }
}
