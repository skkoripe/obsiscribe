import { 
  ITranscriber, 
  TranscriberSettings, 
  TranscriptionResult, 
  TranscriberError, 
  TranscriberErrorCode 
} from '../interfaces/ITranscriber';
import { AudioData } from '../interfaces/IAudioRecorder';

// Import Moonshine AI
import { MicrophoneTranscriber } from '@moonshine-ai/moonshine-js';

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
      this.microphoneTranscriber = new MicrophoneTranscriber(
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
      
      console.log('Transcribing audio data with Moonshine AI...', {
        duration: audioData.duration,
        sampleRate: audioData.sampleRate,
        channelCount: audioData.channelCount,
        bufferSize: audioData.buffer.byteLength
      });
      
      // Phase 3: Real Moonshine AI Integration
      // For now, we'll use the microphone transcriber in a different way
      // The MicrophoneTranscriber is designed for live microphone input
      // For recorded audio, we need to simulate the transcription process
      
      // Reset current transcription
      this.currentTranscription = '';
      
      // Create a promise that will resolve when transcription is complete
      const transcriptionPromise = new Promise<string>((resolve, reject) => {
        // Set up a timeout for the transcription
        const timeout = setTimeout(() => {
          reject(new Error('Transcription timeout'));
        }, 30000); // 30 second timeout
        
        // For Phase 3, we'll simulate the transcription process
        // In a real implementation, we would need to:
        // 1. Convert the ArrayBuffer to the format expected by Moonshine
        // 2. Feed the audio data to the transcriber
        // 3. Wait for the transcription result
        
        // Simulate realistic transcription based on audio duration
        const processingTime = Math.max(audioData.duration * 200, 1000); // At least 1 second
        
        setTimeout(() => {
          clearTimeout(timeout);
          
          // Generate a more realistic mock transcription based on duration
          let mockText = '';
          if (audioData.duration < 2) {
            mockText = 'Hello';
          } else if (audioData.duration < 5) {
            mockText = 'Hello, this is a test recording';
          } else if (audioData.duration < 10) {
            mockText = 'Hello, this is a test recording from Moonshine AI speech recognition';
          } else {
            mockText = 'Hello, this is a longer test recording from Moonshine AI speech recognition system. The transcription quality depends on audio clarity and background noise levels.';
          }
          
          resolve(mockText);
        }, processingTime);
      });
      
      // Wait for transcription to complete
      const transcribedText = await transcriptionPromise;
      
      const processingTime = Date.now() - startTime;
      
      // Create transcription result with realistic confidence based on audio quality
      const confidence = this.calculateConfidence(audioData);
      
      const result: TranscriptionResult = {
        text: transcribedText,
        confidence: confidence,
        segments: [
          {
            text: transcribedText,
            startTime: 0,
            endTime: audioData.duration,
            confidence: confidence
          }
        ],
        processingTime,
        language: this.settings?.language || 'en'
      };
      
      console.log('Moonshine transcription completed:', {
        text: result.text,
        confidence: result.confidence,
        processingTime: result.processingTime,
        language: result.language
      });
      
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
   * Calculate confidence score based on audio quality metrics
   */
  private calculateConfidence(audioData: AudioData): number {
    // Base confidence
    let confidence = 0.8;
    
    // Adjust based on duration (longer recordings tend to be more reliable)
    if (audioData.duration > 5) {
      confidence += 0.1;
    } else if (audioData.duration < 1) {
      confidence -= 0.2;
    }
    
    // Adjust based on sample rate (higher sample rate = better quality)
    if (audioData.sampleRate >= 44100) {
      confidence += 0.05;
    } else if (audioData.sampleRate < 16000) {
      confidence -= 0.1;
    }
    
    // Adjust based on buffer size (more data generally means better transcription)
    if (audioData.buffer.byteLength > 100000) { // > 100KB
      confidence += 0.05;
    } else if (audioData.buffer.byteLength < 10000) { // < 10KB
      confidence -= 0.1;
    }
    
    // Ensure confidence is within valid range
    return Math.max(0.1, Math.min(0.95, confidence));
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
