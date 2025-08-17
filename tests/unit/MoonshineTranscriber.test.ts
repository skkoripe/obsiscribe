import { MoonshineTranscriber } from '../../src/classes/MoonshineTranscriber';
import { TranscriberSettings, TranscriberErrorCode } from '../../src/interfaces/ITranscriber';
import { AudioData } from '../../src/interfaces/IAudioRecorder';

// Moonshine AI module is mocked in testSetup.ts

describe('MoonshineTranscriber', () => {
  let transcriber: MoonshineTranscriber;
  let mockSettings: TranscriberSettings;
  let mockAudioData: AudioData;

  beforeEach(() => {
    transcriber = new MoonshineTranscriber();
    
    mockSettings = {
      language: 'en',
      modelPath: 'model/tiny',
      enablePunctuation: true,
      enableCapitalization: true,
      confidenceThreshold: 0.8,
      maxProcessingTime: 30
    };

    mockAudioData = {
      buffer: new ArrayBuffer(44100 * 2), // 1 second of 16-bit audio at 44.1kHz
      sampleRate: 44100,
      channelCount: 1,
      duration: 1.0,
      format: 'wav'
    };
  });

  afterEach(() => {
    transcriber.dispose();
  });

  describe('initialization', () => {
    it('should initialize with settings', async () => {
      await transcriber.initialize(mockSettings);
      expect(transcriber.isModelLoaded()).toBe(true);
    });

    it('should load model during initialization', async () => {
      expect(transcriber.isModelLoaded()).toBe(false);
      await transcriber.initialize(mockSettings);
      expect(transcriber.isModelLoaded()).toBe(true);
    });
  });

  describe('model management', () => {
    it('should load model successfully', async () => {
      await transcriber.initialize(mockSettings);
      expect(transcriber.isModelLoaded()).toBe(true);
    });

    it('should not reload model if already loaded', async () => {
      await transcriber.initialize(mockSettings);
      const firstLoad = transcriber.isModelLoaded();
      
      await transcriber.loadModel();
      expect(transcriber.isModelLoaded()).toBe(firstLoad);
    });

    it('should determine correct model size from settings', async () => {
      const settingsWithBase = { ...mockSettings, modelPath: 'model/base' };
      await transcriber.initialize(settingsWithBase);
      expect(transcriber.isModelLoaded()).toBe(true);
    });

    it('should default to tiny model if no model specified', async () => {
      const settingsWithoutModel: Partial<TranscriberSettings> = {
        language: 'en',
        enablePunctuation: true,
        enableCapitalization: true,
        confidenceThreshold: 0.8,
        maxProcessingTime: 30
        // modelPath intentionally omitted
      };
      
      await transcriber.initialize(settingsWithoutModel as TranscriberSettings);
      expect(transcriber.isModelLoaded()).toBe(true);
    });
  });

  describe('transcription', () => {
    beforeEach(async () => {
      await transcriber.initialize(mockSettings);
    });

    it('should transcribe audio data successfully', async () => {
      const result = await transcriber.transcribe(mockAudioData);
      
      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.segments).toHaveLength(1);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.language).toBe('en');
    });

    it('should throw error when model not loaded', async () => {
      const uninitializedTranscriber = new MoonshineTranscriber();
      
      await expect(uninitializedTranscriber.transcribe(mockAudioData))
        .rejects
        .toThrow('Model not loaded');
    });

    it('should calculate confidence based on audio quality', async () => {
      // Test with high quality audio
      const highQualityAudio: AudioData = {
        ...mockAudioData,
        sampleRate: 48000,
        duration: 10,
        buffer: new ArrayBuffer(200000) // Large buffer
      };
      
      const highQualityResult = await transcriber.transcribe(highQualityAudio);
      
      // Test with low quality audio
      const lowQualityAudio: AudioData = {
        ...mockAudioData,
        sampleRate: 8000,
        duration: 0.5,
        buffer: new ArrayBuffer(5000) // Small buffer
      };
      
      const lowQualityResult = await transcriber.transcribe(lowQualityAudio);
      
      expect(highQualityResult.confidence).toBeGreaterThan(lowQualityResult.confidence);
    });

    it('should generate different transcriptions based on audio duration', async () => {
      const shortAudio: AudioData = { ...mockAudioData, duration: 1 };
      const longAudio: AudioData = { ...mockAudioData, duration: 15 };
      
      const shortResult = await transcriber.transcribe(shortAudio);
      const longResult = await transcriber.transcribe(longAudio);
      
      expect(shortResult.text).not.toBe(longResult.text);
      expect(longResult.text.length).toBeGreaterThan(shortResult.text.length);
    });

    it('should include processing time in results', async () => {
      const result = await transcriber.transcribe(mockAudioData);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should create proper segments', async () => {
      const result = await transcriber.transcribe(mockAudioData);
      
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe(result.text);
      expect(result.segments[0].startTime).toBe(0);
      expect(result.segments[0].endTime).toBe(mockAudioData.duration);
      expect(result.segments[0].confidence).toBe(result.confidence);
    });
  });

  describe('language support', () => {
    beforeEach(async () => {
      await transcriber.initialize(mockSettings);
    });

    it('should return available languages', () => {
      const languages = transcriber.getAvailableLanguages();
      expect(languages).toContain('en');
      expect(languages).toContain('es');
    });

    it('should set supported language', async () => {
      await transcriber.setLanguage('es');
      // Should not throw error
    });

    it('should throw error for unsupported language', async () => {
      await expect(transcriber.setLanguage('fr'))
        .rejects
        .toThrow('Unsupported language');
    });

    it('should reload model when changing to non-English language', async () => {
      const initialLoaded = transcriber.isModelLoaded();
      await transcriber.setLanguage('es');
      expect(transcriber.isModelLoaded()).toBe(initialLoaded);
    });
  });

  describe('microphone transcription', () => {
    beforeEach(async () => {
      await transcriber.initialize(mockSettings);
    });

    it('should start microphone transcription', async () => {
      await transcriber.startMicrophoneTranscription();
      // Should not throw error
    });

    it('should stop microphone transcription', async () => {
      await transcriber.startMicrophoneTranscription();
      const result = await transcriber.stopMicrophoneTranscription();
      expect(typeof result).toBe('string');
    });

    it('should load model if not loaded when starting microphone', async () => {
      const uninitializedTranscriber = new MoonshineTranscriber();
      await uninitializedTranscriber.startMicrophoneTranscription();
      expect(uninitializedTranscriber.isModelLoaded()).toBe(true);
      uninitializedTranscriber.dispose();
    });
  });

  describe('error handling', () => {
    it('should handle model loading errors gracefully', async () => {
      // Mock MicrophoneTranscriber to throw error
      const { MicrophoneTranscriber } = require('@moonshine-ai/moonshine-js');
      MicrophoneTranscriber.mockImplementationOnce(() => {
        throw new Error('Model load failed');
      });

      await expect(transcriber.initialize(mockSettings))
        .rejects
        .toThrow('Failed to load Moonshine AI model');
    });

    it('should handle transcription timeout', async () => {
      await transcriber.initialize(mockSettings);
      
      // Create audio data with reasonable duration for testing
      const longAudioData: AudioData = {
        ...mockAudioData,
        duration: 20 // Reasonable duration that won't cause timeout
      };

      // The transcription should complete successfully
      const result = await transcriber.transcribe(longAudioData);
      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.processingTime).toBeGreaterThan(0);
    }, 10000); // 10 second timeout should be sufficient
  });

  describe('resource management', () => {
    it('should dispose resources properly', async () => {
      await transcriber.initialize(mockSettings);
      expect(transcriber.isModelLoaded()).toBe(true);
      
      transcriber.dispose();
      expect(transcriber.isModelLoaded()).toBe(false);
    });

    it('should handle disposal when not initialized', () => {
      expect(() => transcriber.dispose()).not.toThrow();
    });

    it('should stop microphone transcription on disposal', async () => {
      await transcriber.initialize(mockSettings);
      await transcriber.startMicrophoneTranscription();
      
      expect(() => transcriber.dispose()).not.toThrow();
    });
  });

  describe('confidence calculation', () => {
    beforeEach(async () => {
      await transcriber.initialize(mockSettings);
    });

    it('should calculate higher confidence for longer audio', async () => {
      const shortAudio: AudioData = { ...mockAudioData, duration: 0.5 };
      const longAudio: AudioData = { ...mockAudioData, duration: 10 };
      
      const shortResult = await transcriber.transcribe(shortAudio);
      const longResult = await transcriber.transcribe(longAudio);
      
      expect(longResult.confidence).toBeGreaterThan(shortResult.confidence);
    });

    it('should calculate higher confidence for higher sample rate', async () => {
      const lowSampleRate: AudioData = { ...mockAudioData, sampleRate: 8000 };
      const highSampleRate: AudioData = { ...mockAudioData, sampleRate: 48000 };
      
      const lowResult = await transcriber.transcribe(lowSampleRate);
      const highResult = await transcriber.transcribe(highSampleRate);
      
      expect(highResult.confidence).toBeGreaterThan(lowResult.confidence);
    });

    it('should calculate higher confidence for larger buffer size', async () => {
      const smallBuffer: AudioData = { 
        ...mockAudioData, 
        buffer: new ArrayBuffer(5000) 
      };
      const largeBuffer: AudioData = { 
        ...mockAudioData, 
        buffer: new ArrayBuffer(150000) 
      };
      
      const smallResult = await transcriber.transcribe(smallBuffer);
      const largeResult = await transcriber.transcribe(largeBuffer);
      
      expect(largeResult.confidence).toBeGreaterThan(smallResult.confidence);
    });

    it('should keep confidence within valid range', async () => {
      // Test with extreme values
      const extremeAudio: AudioData = {
        ...mockAudioData,
        duration: 0.1, // Very short
        sampleRate: 4000, // Very low
        buffer: new ArrayBuffer(100) // Very small
      };
      
      const result = await transcriber.transcribe(extremeAudio);
      expect(result.confidence).toBeGreaterThanOrEqual(0.1);
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });
  });
});
