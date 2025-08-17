import { 
  ITranscriber, 
  TranscriberSettings, 
  TranscriptionResult, 
  TranscriberError, 
  TranscriberErrorCode 
} from '../interfaces/ITranscriber';
import { AudioData } from '../interfaces/IAudioRecorder';

// Import Sherpa ONNX for local speech recognition
let sherpaOnnx: any = null;
let sherpaFailed = false;

async function loadSherpaONNX() {
  if (sherpaOnnx || sherpaFailed) {
    return sherpaOnnx;
  }
  
  try {
    console.log('Loading Sherpa ONNX...');
    
    // Try to load the native module directly
    try {
      const path = require('path');
      const pluginDir = (window as any).app?.vault?.adapter?.basePath + '/.obsidian/plugins/obsiscribe';
      
      // Set up library paths for the native module
      const nativeLibDir = path.join(pluginDir, 'native-modules', 'sherpa-onnx-darwin-arm64');
      const nativeModulePath = path.join(nativeLibDir, 'sherpa-onnx.node');
      
      console.log('Attempting to load native module from:', nativeModulePath);
      console.log('Native library directory:', nativeLibDir);
      
      // Set environment variable to help the native module find its dependencies
      const originalPath = process.env.DYLD_LIBRARY_PATH || '';
      process.env.DYLD_LIBRARY_PATH = nativeLibDir + (originalPath ? ':' + originalPath : '');
      
      try {
        // Load the native module
        const nativeModule = require(nativeModulePath);
        console.log('Native module loaded successfully');
        
        // Restore original library path
        if (originalPath) {
          process.env.DYLD_LIBRARY_PATH = originalPath;
        } else {
          delete process.env.DYLD_LIBRARY_PATH;
        }
        
        // **CRITICAL FIX**: Use the native module directly - it has all the API methods we need
        console.log('Native module exports:', Object.keys(nativeModule));
        
        // Return the native module directly (no wrapper needed)
        sherpaOnnx = nativeModule;
        console.log('✅ Using native module directly with all API methods available');
        
        console.log('Sherpa ONNX native module loaded successfully');
        return sherpaOnnx;
        
      } catch (loadError) {
        // Restore original library path even on error
        if (originalPath) {
          process.env.DYLD_LIBRARY_PATH = originalPath;
        } else {
          delete process.env.DYLD_LIBRARY_PATH;
        }
        throw loadError;
      }
      
    } catch (nativeError) {
      console.log('Native module loading failed:', nativeError);
      
      // Fallback to npm module
      sherpaOnnx = require('sherpa-onnx-node');
      console.log('Sherpa ONNX loaded from npm, version:', sherpaOnnx.version);
      return sherpaOnnx;
    }
  } catch (error) {
    console.warn('Sherpa ONNX failed to load:', error);
    sherpaFailed = true;
    return null;
  }
}

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
   * Load the AI model for transcription using Sherpa ONNX
   */
  async loadModel(): Promise<void> {
    try {
      if (this.modelLoaded) {
        console.log('Sherpa ONNX model already loaded');
        return;
      }

      // Try to load Sherpa ONNX
      const sherpa = await loadSherpaONNX();
      
      if (!sherpa) {
        throw new TranscriberError(
          'Failed to load Sherpa ONNX',
          TranscriberErrorCode.MODEL_LOAD_FAILED
        );
      }

      console.log('Loading Sherpa ONNX with Moonshine model...');
      
      // Get absolute paths for model files
      const path = require('path');
      const pluginDir = (window as any).app?.vault?.adapter?.basePath + '/.obsidian/plugins/obsiscribe';
      const modelDir = path.join(pluginDir, 'sherpa-onnx-moonshine-tiny-en-int8');
      
      // Configuration for Moonshine model via Sherpa ONNX with absolute paths
      const config = {
        'featConfig': {
          'sampleRate': 16000,
          'featureDim': 80,
        },
        'modelConfig': {
          'moonshine': {
            'preprocessor': path.join(modelDir, 'preprocess.onnx'),
            'encoder': path.join(modelDir, 'encode.int8.onnx'),
            'uncachedDecoder': path.join(modelDir, 'uncached_decode.int8.onnx'),
            'cachedDecoder': path.join(modelDir, 'cached_decode.int8.onnx'),
          },
          'tokens': path.join(modelDir, 'tokens.txt'),
          'numThreads': 2,
          'provider': 'cpu',
          'debug': 0, // Disable debug for production
        }
      };
      
      console.log('Model configuration with absolute paths:', config);
      
      // Create OfflineRecognizer for batch processing using the correct API
      console.log('🔧 Creating OfflineRecognizer...');
      this.microphoneTranscriber = sherpa.createOfflineRecognizer(config);
      
      if (!this.microphoneTranscriber) {
        throw new Error('Failed to create OfflineRecognizer - returned null');
      }
      
      console.log('✅ OfflineRecognizer created successfully');
      
      this.modelLoaded = true;
      console.log('Sherpa ONNX with Moonshine model loaded successfully');
    } catch (error) {
      throw new TranscriberError(
        'Failed to load Sherpa ONNX with Moonshine model',
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
   * Start live streaming transcription with real-time updates
   * Using Sherpa ONNX with Moonshine model
   */
  async startLiveTranscription(
    onTranscriptionUpdated?: (text: string) => void,
    onTranscriptionCommitted?: (text: string) => void
  ): Promise<void> {
    // Check if settings are initialized
    if (!this.settings) {
      throw new TranscriberError(
        'Transcriber not initialized. Call initialize() first.',
        TranscriberErrorCode.MODEL_NOT_FOUND
      );
    }

    try {
      console.log('Starting Sherpa ONNX live streaming transcription...');
      
      // Reset current transcription
      this.currentTranscription = '';
      
      // For now, we'll use the OfflineRecognizer for batch processing
      // TODO: Implement OnlineRecognizer for true streaming when needed
      if (!this.modelLoaded) {
        await this.loadModel();
      }
      
      console.log('Sherpa ONNX live transcription ready');
      
    } catch (error) {
      throw new TranscriberError(
        'Failed to start live transcription',
        TranscriberErrorCode.TRANSCRIPTION_FAILED,
        error as Error
      );
    }
  }

  /**
   * Stop live streaming transcription and return final result
   */
  async stopLiveTranscription(): Promise<TranscriptionResult> {
    try {
      // For OfflineRecognizer, we don't need to call stop() - it's not a streaming recognizer
      // Just return the current transcription result
      console.log('Stopping live transcription...');

      const result: TranscriptionResult = {
        text: this.currentTranscription || '',
        confidence: 0.9, // High confidence for live transcription
        segments: [
          {
            text: this.currentTranscription || '',
            startTime: 0,
            endTime: 0, // Duration not available in live mode
            confidence: 0.9
          }
        ],
        processingTime: 0, // Real-time processing
        language: this.settings?.language || 'en'
      };

      console.log('Live transcription stopped successfully, result:', result);
      return result;
      
    } catch (error) {
      console.warn('Error in stopLiveTranscription:', error);
      // Return empty result instead of throwing error
      return {
        text: '',
        confidence: 0.5,
        segments: [],
        processingTime: 0,
        language: this.settings?.language || 'en'
      };
    }
  }

  /**
   * Transcribe audio data using Sherpa ONNX with Moonshine model
   * Now includes comprehensive audio analysis and debugging
   */
  async transcribe(audioData: AudioData): Promise<TranscriptionResult> {
    if (!this.modelLoaded) {
      throw new TranscriberError(
        'Model not loaded. Call initialize() first.',
        TranscriberErrorCode.MODEL_NOT_FOUND
      );
    }

    if (!this.microphoneTranscriber) {
      throw new TranscriberError(
        'Recognizer not available',
        TranscriberErrorCode.MODEL_NOT_FOUND
      );
    }

    try {
      const startTime = Date.now();

      // Convert audio data to Float32Array
      let audioSamples = this.convertAudioBufferToFloat32Array(audioData.buffer, audioData.sampleRate);

      // Resample to 16kHz if needed (required by Moonshine AI)
      let finalSampleRate = audioData.sampleRate;
      if (audioData.sampleRate !== 16000) {
        audioSamples = this.resampleAudio(audioSamples, audioData.sampleRate, 16000);
        finalSampleRate = 16000;
      }
      
      // Load Sherpa ONNX native module
      const sherpa = await loadSherpaONNX();
      if (!sherpa) {
        throw new Error('Sherpa ONNX not available');
      }
      
      // The recognizer is already created in this.microphoneTranscriber
      const recognizer = this.microphoneTranscriber;
      
      // **STEP 1**: Create offline stream using the sherpa module (not recognizer)
      // **CRITICAL FIX**: Always create a fresh stream for each transcription
      console.log('🔧 Creating fresh offline stream for new transcription...');
      let stream;
      try {
        if (sherpa.createOfflineStream) {
          stream = sherpa.createOfflineStream(recognizer);
          console.log('✅ Fresh offline stream created successfully');
        } else {
          throw new Error('createOfflineStream not available');
        }
      } catch (error) {
        console.error('❌ Failed to create offline stream:', error);
        throw error;
      }
      
      // **STEP 2**: Accept waveform using sherpa module API
      console.log('🎵 Accepting waveform data...');
      try {
        if (sherpa.acceptWaveformOffline) {
          sherpa.acceptWaveformOffline(stream, {
            sampleRate: finalSampleRate,
            samples: audioSamples
          });
          console.log('✅ Waveform accepted successfully');
        } else {
          throw new Error('acceptWaveformOffline not available');
        }
      } catch (error) {
        console.error('❌ Failed to accept waveform:', error);
        throw error;
      }
      
      // **STEP 3**: Decode the stream using sherpa module API
      console.log('🔄 Decoding audio stream...');
      try {
        if (sherpa.decodeOfflineStream) {
          sherpa.decodeOfflineStream(recognizer, stream);
          console.log('✅ Audio decoded successfully');
        } else {
          throw new Error('decodeOfflineStream not available');
        }
      } catch (error) {
        console.error('❌ Failed to decode stream:', error);
        throw error;
      }
      
      // **STEP 4**: Get the transcription result using sherpa module API
      console.log('📝 Getting transcription result...');
      let result;
      try {
        if (sherpa.getOfflineStreamResultAsJson) {
          const resultJson = sherpa.getOfflineStreamResultAsJson(stream);
          result = JSON.parse(resultJson);
          console.log('✅ Transcription result obtained successfully');
        } else {
          throw new Error('getOfflineStreamResultAsJson not available');
        }
      } catch (error) {
        console.error('❌ Failed to get transcription result:', error);
        result = { text: '' };
      }
      
      console.log('🎯 Raw transcription result:', result);
      console.log('🔍 Result keys:', Object.keys(result));
      console.log('🔍 Result values:', Object.values(result));
      
      // **CRITICAL FIX**: Extract text from the correct field in the result
      let extractedText = '';
      
      // Try different possible text fields
      if (result.text && result.text.trim()) {
        extractedText = result.text.trim();
        console.log('✅ Found text in result.text:', extractedText);
      } else if (result.transcript && result.transcript.trim()) {
        extractedText = result.transcript.trim();
        console.log('✅ Found text in result.transcript:', extractedText);
      } else if (result.recognition && result.recognition.trim()) {
        extractedText = result.recognition.trim();
        console.log('✅ Found text in result.recognition:', extractedText);
      } else if (typeof result === 'string' && result.trim()) {
        extractedText = result.trim();
        console.log('✅ Found text as string result:', extractedText);
      } else {
        // Check if there are any string values in the result object
        for (const [key, value] of Object.entries(result)) {
          if (typeof value === 'string' && value.trim() && value.length > 1) {
            extractedText = value.trim();
            console.log(`✅ Found text in result.${key}:`, extractedText);
            break;
          }
        }
      }
      
      if (!extractedText) {
        console.log('⚠️ No text found in any field, checking timestamps array...');
        if (result.timestamps && Array.isArray(result.timestamps) && result.timestamps.length > 0) {
          // Sometimes text is in timestamps array
          const timestampTexts = result.timestamps
            .map((ts: any) => ts.text || ts.word || ts.token)
            .filter((text: any) => text && typeof text === 'string')
            .join(' ');
          if (timestampTexts.trim()) {
            extractedText = timestampTexts.trim();
            console.log('✅ Found text in timestamps:', extractedText);
          }
        }
      }

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(audioData);

      const transcriptionResult: TranscriptionResult = {
        text: extractedText,
        confidence: confidence,
        segments: [
          {
            text: extractedText,
            startTime: 0,
            endTime: audioData.duration,
            confidence: confidence
          }
        ],
        processingTime: processingTime,
        language: this.settings?.language || 'en'
      };

      return transcriptionResult;

    } catch (error) {
      console.error('Transcription error details:', error);
      throw new TranscriberError(
        'Failed to transcribe audio',
        TranscriberErrorCode.TRANSCRIPTION_FAILED,
        error as Error
      );
    }
  }

  /**
   * Check if live transcription is currently active
   */
  isLiveTranscriptionActive(): boolean {
    return this.microphoneTranscriber !== null;
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
   * Resample audio from one sample rate to another using linear interpolation
   * Critical fix for Moonshine AI which requires 16kHz audio
   */
  private resampleAudio(inputSamples: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
    console.log(`🔄 Resampling audio: ${inputSampleRate}Hz → ${outputSampleRate}Hz`);
    
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.floor(inputSamples.length / ratio);
    const outputSamples = new Float32Array(outputLength);
    
    // Linear interpolation resampling
    for (let i = 0; i < outputLength; i++) {
      const inputIndex = i * ratio;
      const inputIndexFloor = Math.floor(inputIndex);
      const inputIndexCeil = Math.min(inputIndexFloor + 1, inputSamples.length - 1);
      const fraction = inputIndex - inputIndexFloor;
      
      // Linear interpolation between two samples
      outputSamples[i] = inputSamples[inputIndexFloor] * (1 - fraction) + 
                        inputSamples[inputIndexCeil] * fraction;
    }
    
    console.log(`✅ Resampled: ${inputSamples.length} samples → ${outputSamples.length} samples`);
    return outputSamples;
  }

  /**
   * Get the model configuration for Sherpa ONNX with Moonshine
   */
  private getModelConfig(): any {
    const path = require('path');
    const pluginDir = (window as any).app?.vault?.adapter?.basePath + '/.obsidian/plugins/obsiscribe';
    const modelDir = path.join(pluginDir, 'sherpa-onnx-moonshine-tiny-en-int8');
    
    return {
      'featConfig': {
        'sampleRate': 16000,  // Moonshine expects 16kHz
        'featureDim': 80,
      },
      'modelConfig': {
        'moonshine': {
          'preprocessor': path.join(modelDir, 'preprocess.onnx'),
          'encoder': path.join(modelDir, 'encode.int8.onnx'),
          'uncachedDecoder': path.join(modelDir, 'uncached_decode.int8.onnx'),
          'cachedDecoder': path.join(modelDir, 'cached_decode.int8.onnx'),
        },
        'tokens': path.join(modelDir, 'tokens.txt'),
        'numThreads': 2,
        'provider': 'cpu',
        'debug': 0, // Disable debug for production
      }
    };
  }

  /**
   * Convert ArrayBuffer to Float32Array for Moonshine AI processing
   */
  private convertAudioBufferToFloat32Array(buffer: ArrayBuffer, sampleRate: number): Float32Array {
    console.log(`Converting audio buffer: ${buffer.byteLength} bytes at ${sampleRate}Hz`);
    
    // Handle odd-sized buffers by ensuring even byte count for Int16Array
    let audioBuffer = buffer;
    if (buffer.byteLength % 2 !== 0) {
      console.log('Buffer has odd byte length, padding to even length');
      // Create a new buffer with even byte length
      const paddedBuffer = new ArrayBuffer(buffer.byteLength + 1);
      const paddedView = new Uint8Array(paddedBuffer);
      const originalView = new Uint8Array(buffer);
      paddedView.set(originalView);
      paddedView[buffer.byteLength] = 0; // Pad with zero
      audioBuffer = paddedBuffer;
    }
    
    // Convert ArrayBuffer to Int16Array (assuming 16-bit PCM audio)
    const int16Array = new Int16Array(audioBuffer);
    
    // Convert Int16Array to Float32Array (normalize to -1.0 to 1.0 range)
    const float32Array = new Float32Array(int16Array.length);
    
    for (let i = 0; i < int16Array.length; i++) {
      // Normalize 16-bit integer (-32768 to 32767) to float (-1.0 to 1.0)
      float32Array[i] = int16Array[i] / 32768.0;
    }
    
    console.log(`Converted audio buffer: ${buffer.byteLength} bytes -> ${float32Array.length} samples at ${sampleRate}Hz`);
    
    return float32Array;
  }

  /**
   * Analyze audio quality and characteristics for debugging
   */
  private analyzeAudioQuality(audioSamples: Float32Array, sampleRate: number, label: string): any {
    let min = Infinity, max = -Infinity, sum = 0, sumSquares = 0;
    let nonZeroCount = 0;
    let peakCount = 0;
    let speechLikeCount = 0;
    
    // Basic statistics
    for (let i = 0; i < audioSamples.length; i++) {
      const sample = audioSamples[i];
      min = Math.min(min, sample);
      max = Math.max(max, sample);
      sum += sample;
      sumSquares += sample * sample;
      
      if (Math.abs(sample) > 0.001) nonZeroCount++;
      if (Math.abs(sample) > 0.01) peakCount++;
      if (Math.abs(sample) > 0.005 && Math.abs(sample) < 0.5) speechLikeCount++;
    }
    
    const mean = sum / audioSamples.length;
    const variance = (sumSquares / audioSamples.length) - (mean * mean);
    const rms = Math.sqrt(variance);
    const dynamicRange = max - min;
    const duration = audioSamples.length / sampleRate;
    
    // Calculate frequency distribution (simplified)
    let frequencySpread = 0;
    const chunkSize = Math.floor(audioSamples.length / 10);
    for (let i = 0; i < 10; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, audioSamples.length);
      let chunkRms = 0;
      for (let j = start; j < end; j++) {
        chunkRms += audioSamples[j] * audioSamples[j];
      }
      chunkRms = Math.sqrt(chunkRms / (end - start));
      frequencySpread += chunkRms;
    }
    frequencySpread /= 10;
    
    const speechLikelihood = (speechLikeCount / audioSamples.length) * 100;
    const hasContent = nonZeroCount > audioSamples.length * 0.01;
    
    console.log(`📊 ${label} Audio Analysis:`);
    console.log(`   • Duration: ${duration.toFixed(2)} seconds`);
    console.log(`   • RMS level: ${rms.toFixed(6)}`);
    console.log(`   • Dynamic range: ${dynamicRange.toFixed(6)}`);
    console.log(`   • Min/Max: ${min.toFixed(6)} / ${max.toFixed(6)}`);
    console.log(`   • Active samples: ${nonZeroCount} (${(nonZeroCount/audioSamples.length*100).toFixed(1)}%)`);
    console.log(`   • Speech-like peaks: ${peakCount} (${(peakCount/audioSamples.length*100).toFixed(1)}%)`);
    console.log(`   • Speech likelihood: ${speechLikelihood.toFixed(1)}%`);
    console.log(`   • Frequency spread: ${frequencySpread.toFixed(6)}`);
    
    return {
      duration,
      rms,
      dynamicRange,
      nonZeroCount,
      peakCount,
      speechLikeCount,
      speechLikelihood,
      frequencySpread,
      hasContent,
      min,
      max,
      mean,
      variance
    };
  }

  /**
   * Calculate overall audio quality score (0-100)
   */
  private calculateAudioQualityScore(analysis: any): number {
    let score = 0;
    
    // Duration score (0-25 points)
    if (analysis.duration > 2) score += 25;
    else if (analysis.duration > 1) score += 15;
    else if (analysis.duration > 0.5) score += 10;
    
    // Signal level score (0-25 points)
    if (analysis.rms > 0.01) score += 25;
    else if (analysis.rms > 0.005) score += 15;
    else if (analysis.rms > 0.001) score += 10;
    
    // Speech likelihood score (0-25 points)
    if (analysis.speechLikelihood > 20) score += 25;
    else if (analysis.speechLikelihood > 10) score += 15;
    else if (analysis.speechLikelihood > 5) score += 10;
    
    // Dynamic range score (0-25 points)
    if (analysis.dynamicRange > 0.1) score += 25;
    else if (analysis.dynamicRange > 0.05) score += 15;
    else if (analysis.dynamicRange > 0.01) score += 10;
    
    return Math.round(score);
  }

  /**
   * Get recommendations for improving audio quality
   */
  private getAudioQualityRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    
    if (analysis.duration < 1) {
      recommendations.push('Speak for longer (at least 2-3 seconds)');
    }
    
    if (analysis.rms < 0.001) {
      recommendations.push('Speak louder or move closer to microphone');
    }
    
    if (analysis.speechLikelihood < 10) {
      recommendations.push('Ensure you are speaking clearly');
    }
    
    if (analysis.dynamicRange < 0.01) {
      recommendations.push('Check microphone is not muted or blocked');
    }
    
    if (!analysis.hasContent) {
      recommendations.push('Verify microphone permissions and functionality');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Audio quality appears good, check AI model configuration');
    }
    
    return recommendations;
  }

  /**
   * Clean up resources and unload model
   */
  dispose(): void {
    if (this.microphoneTranscriber) {
      // The microphoneTranscriber is now a native recognizer object, not a wrapper
      // No need to call stop() - just clean up the reference
      try {
        console.log('Cleaning up native recognizer reference');
      } catch (error) {
        console.warn('Error cleaning up Moonshine transcriber:', error);
      }
      this.microphoneTranscriber = null;
    }
    
    this.modelLoaded = false;
    this.settings = null;
    this.currentTranscription = '';
    console.log('MoonshineTranscriber disposed');
  }
}
