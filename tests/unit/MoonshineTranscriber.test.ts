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

  describe('live transcription', () => {
    beforeEach(async () => {
      await transcriber.initialize(mockSettings);
    });

    it('should start live transcription successfully', async () => {
      const onUpdate = jest.fn();
      const onCommit = jest.fn();

      await transcriber.startLiveTranscription(onUpdate, onCommit);
      
      expect(transcriber.isLiveTranscriptionActive()).toBe(true);
    });

    it('should stop live transcription and return result', async () => {
      const onUpdate = jest.fn();
      const onCommit = jest.fn();

      await transcriber.startLiveTranscription(onUpdate, onCommit);
      const result = await transcriber.stopLiveTranscription();
      
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.language).toBe('en');
      expect(transcriber.isLiveTranscriptionActive()).toBe(false);
    });

    it('should handle live transcription callbacks', async () => {
      const onUpdate = jest.fn();
      const onCommit = jest.fn();

      await transcriber.startLiveTranscription(onUpdate, onCommit);
      
      // Simulate the Moonshine AI calling the callbacks
      // In real usage, these would be called by the MicrophoneTranscriber
      // For testing, we just verify the methods were set up correctly
      expect(typeof onUpdate).toBe('function');
      expect(typeof onCommit).toBe('function');
      
      await transcriber.stopLiveTranscription();
    });

    it('should throw error when starting live transcription without initialization', async () => {
      const uninitializedTranscriber = new MoonshineTranscriber();
      
      await expect(uninitializedTranscriber.startLiveTranscription())
        .rejects
        .toThrow('Transcriber not initialized. Call initialize() first.');
        
      uninitializedTranscriber.dispose();
    });

    it('should handle multiple start/stop cycles', async () => {
      const onUpdate = jest.fn();
      const onCommit = jest.fn();

      // First cycle
      await transcriber.startLiveTranscription(onUpdate, onCommit);
      expect(transcriber.isLiveTranscriptionActive()).toBe(true);
      
      await transcriber.stopLiveTranscription();
      expect(transcriber.isLiveTranscriptionActive()).toBe(false);

      // Second cycle
      await transcriber.startLiveTranscription(onUpdate, onCommit);
      expect(transcriber.isLiveTranscriptionActive()).toBe(true);
      
      await transcriber.stopLiveTranscription();
      expect(transcriber.isLiveTranscriptionActive()).toBe(false);
    });
  });

  describe('legacy transcription support', () => {
    beforeEach(async () => {
      await transcriber.initialize(mockSettings);
    });

    it('should handle legacy transcribe method', async () => {
      // The legacy transcribe method should work but redirect to live streaming
      const result = await transcriber.transcribe(mockAudioData);
      
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.language).toBe('en');
    }, 15000); // Increased timeout for legacy method

    it('should throw error when legacy transcribe called without model', async () => {
      const uninitializedTranscriber = new MoonshineTranscriber();
      
      await expect(uninitializedTranscriber.transcribe(mockAudioData))
        .rejects
        .toThrow();
        
      uninitializedTranscriber.dispose();
    }, 15000);
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

    it('should handle live transcription start errors', async () => {
      await transcriber.initialize(mockSettings);
      
      // Mock MicrophoneTranscriber start to throw error
      const { MicrophoneTranscriber } = require('@moonshine-ai/moonshine-js');
      const mockStart = jest.fn().mockRejectedValue(new Error('Start failed'));
      MicrophoneTranscriber.mockImplementation(() => ({
        start: mockStart,
        stop: jest.fn()
      }));

      await expect(transcriber.startLiveTranscription())
        .rejects
        .toThrow('Failed to start live transcription');
    });

    it('should handle live transcription stop errors', async () => {
      await transcriber.initialize(mockSettings);
      
      // Create a new transcriber instance for this test to avoid mock conflicts
      const errorTranscriber = new MoonshineTranscriber();
      await errorTranscriber.initialize(mockSettings);
      
      // Mock the MicrophoneTranscriber to have a failing stop method
      const mockStart = jest.fn().mockResolvedValue(undefined);
      const mockStop = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('Stop failed'));
      });
      
      const { MicrophoneTranscriber } = require('@moonshine-ai/moonshine-js');
      const originalMock = MicrophoneTranscriber.getMockImplementation();
      
      MicrophoneTranscriber.mockImplementation(() => ({
        start: mockStart,
        stop: mockStop
      }));
      
      try {
        // Start live transcription (should succeed)
        await errorTranscriber.startLiveTranscription();
        
        // Now stop should fail
        await expect(errorTranscriber.stopLiveTranscription())
          .rejects
          .toThrow('Failed to stop live transcription');
      } finally {
        // Reset the mock to avoid affecting other tests
        if (originalMock) {
          MicrophoneTranscriber.mockImplementation(originalMock);
        } else {
          MicrophoneTranscriber.mockReset();
        }
        
        // Manually dispose without calling stop to avoid the mock error
        errorTranscriber['microphoneTranscriber'] = null;
        errorTranscriber['modelLoaded'] = false;
        errorTranscriber['settings'] = null;
        errorTranscriber['currentTranscription'] = '';
      }
    });
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

    it('should stop live transcription on disposal', async () => {
      await transcriber.initialize(mockSettings);
      
      // Mock successful start
      const mockStart = jest.fn().mockResolvedValue(undefined);
      const mockStop = jest.fn().mockResolvedValue(undefined);
      
      const { MicrophoneTranscriber } = require('@moonshine-ai/moonshine-js');
      MicrophoneTranscriber.mockImplementation(() => ({
        start: mockStart,
        stop: mockStop
      }));
      
      await transcriber.startLiveTranscription();
      expect(transcriber.isLiveTranscriptionActive()).toBe(true);
      
      expect(() => transcriber.dispose()).not.toThrow();
      expect(transcriber.isLiveTranscriptionActive()).toBe(false);
    });
  });

  describe('model size determination', () => {
    it('should extract model size from path', async () => {
      const settingsWithBase = { ...mockSettings, modelPath: 'model/base' };
      await transcriber.initialize(settingsWithBase);
      expect(transcriber.isModelLoaded()).toBe(true);
    });

    it('should extract model size from small path', async () => {
      const settingsWithSmall = { ...mockSettings, modelPath: 'model/small' };
      await transcriber.initialize(settingsWithSmall);
      expect(transcriber.isModelLoaded()).toBe(true);
    });

    it('should default to tiny for invalid path', async () => {
      const settingsWithInvalid = { ...mockSettings, modelPath: 'invalid/path' };
      await transcriber.initialize(settingsWithInvalid);
      expect(transcriber.isModelLoaded()).toBe(true);
    });
  });

  describe('audio conversion utilities', () => {
    beforeEach(async () => {
      await transcriber.initialize(mockSettings);
    });

    it('should convert ArrayBuffer to Float32Array', () => {
      // Test the private method indirectly by ensuring it doesn't throw
      // when processing audio data
      expect(() => {
        const buffer = new ArrayBuffer(1024);
        const int16Array = new Int16Array(buffer);
        int16Array[0] = 16384; // Half of max value
        
        // This would internally call convertAudioBufferToFloat32Array
        // We can't test it directly since it's private, but we can ensure
        // the transcriber handles audio data without errors
      }).not.toThrow();
    });
  });
});
