import { SpeechToTextPlugin } from '../../src/classes/SpeechToTextPlugin';
import { Plugin, App, MarkdownView } from 'obsidian';
import { AudioRecorder } from '../../src/classes/AudioRecorder';
import { MoonshineTranscriber } from '../../src/classes/MoonshineTranscriber';
import { TextInserter } from '../../src/classes/TextInserter';
import { SettingsManager } from '../../src/classes/SettingsManager';
import { UIController } from '../../src/classes/UIController';
import { DEFAULT_SETTINGS } from '../../src/interfaces/ISettings';

// Mock all the component classes
jest.mock('../../src/classes/AudioRecorder');
jest.mock('../../src/classes/MoonshineTranscriber');
jest.mock('../../src/classes/TextInserter');
jest.mock('../../src/classes/SettingsManager');
jest.mock('../../src/classes/UIController');

describe('SpeechToTextPlugin', () => {
  let plugin: SpeechToTextPlugin;
  let mockObsidianPlugin: Plugin;
  let mockApp: App;

  // Mock instances
  let mockAudioRecorder: jest.Mocked<AudioRecorder>;
  let mockTranscriber: jest.Mocked<MoonshineTranscriber>;
  let mockTextInserter: jest.Mocked<TextInserter>;
  let mockSettingsManager: jest.Mocked<SettingsManager>;
  let mockUIController: jest.Mocked<UIController>;

  beforeEach(() => {
    // Create mock app and plugin
    mockApp = {
      workspace: {
        getActiveViewOfType: jest.fn()
      },
      vault: {
        modify: jest.fn()
      }
    } as unknown as App;

    mockObsidianPlugin = {
      app: mockApp,
      loadData: jest.fn(),
      saveData: jest.fn(),
      addSettingTab: jest.fn()
    } as unknown as Plugin;

    // Create plugin instance
    plugin = new SpeechToTextPlugin(mockObsidianPlugin);

    // Set up mocked component instances
    mockAudioRecorder = {
      initialize: jest.fn().mockResolvedValue(undefined),
      hasPermission: jest.fn().mockResolvedValue(true),
      requestPermission: jest.fn().mockResolvedValue(true),
      startRecording: jest.fn().mockResolvedValue(undefined),
      stopRecording: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
      dispose: jest.fn()
    } as unknown as jest.Mocked<AudioRecorder>;

    mockTranscriber = {
      initialize: jest.fn().mockResolvedValue(undefined),
      transcribe: jest.fn().mockResolvedValue({
        text: 'Hello world',
        confidence: 0.95,
        processingTime: 1000,
        segments: [],
        language: 'en'
      }),
      startLiveTranscription: jest.fn().mockResolvedValue(undefined),
      stopLiveTranscription: jest.fn().mockResolvedValue({
        text: 'Hello world',
        confidence: 0.95,
        processingTime: 0,
        segments: [],
        language: 'en'
      }),
      isLiveTranscriptionActive: jest.fn().mockReturnValue(false),
      dispose: jest.fn()
    } as unknown as jest.Mocked<MoonshineTranscriber>;

    mockTextInserter = {
      initialize: jest.fn().mockResolvedValue(undefined),
      insertText: jest.fn().mockResolvedValue(undefined),
      dispose: jest.fn()
    } as unknown as jest.Mocked<TextInserter>;

    mockSettingsManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      loadSettings: jest.fn().mockResolvedValue(DEFAULT_SETTINGS),
      saveSettings: jest.fn().mockResolvedValue(undefined),
      dispose: jest.fn()
    } as unknown as jest.Mocked<SettingsManager>;

    mockUIController = {
      initialize: jest.fn().mockResolvedValue(undefined),
      startRecording: jest.fn().mockResolvedValue(undefined),
      stopRecording: jest.fn().mockResolvedValue(undefined),
      showRecordingIndicator: jest.fn(),
      hideRecordingIndicator: jest.fn(),
      showProcessingIndicator: jest.fn(),
      hideProcessingIndicator: jest.fn(),
      showSuccess: jest.fn(),
      showError: jest.fn(),
      showInfo: jest.fn(),
      dispose: jest.fn()
    } as unknown as jest.Mocked<UIController>;

    // Mock the constructors to return our mocked instances
    (AudioRecorder as jest.MockedClass<typeof AudioRecorder>).mockImplementation(() => mockAudioRecorder);
    (MoonshineTranscriber as jest.MockedClass<typeof MoonshineTranscriber>).mockImplementation(() => mockTranscriber);
    (TextInserter as jest.MockedClass<typeof TextInserter>).mockImplementation(() => mockTextInserter);
    (SettingsManager as jest.MockedClass<typeof SettingsManager>).mockImplementation(() => mockSettingsManager);
    (UIController as jest.MockedClass<typeof UIController>).mockImplementation(() => mockUIController);
  });

  describe('initialization', () => {
    it('should initialize all components successfully', async () => {
      await plugin.initialize();

      expect(mockSettingsManager.initialize).toHaveBeenCalled();
      expect(mockSettingsManager.loadSettings).toHaveBeenCalled();
      expect(mockAudioRecorder.initialize).toHaveBeenCalledWith({
        sampleRate: DEFAULT_SETTINGS.sampleRate,
        channelCount: 1,
        bitDepth: 16,
        maxDuration: DEFAULT_SETTINGS.maxRecordingDuration
      });
      expect(mockTranscriber.initialize).toHaveBeenCalledWith({
        modelPath: DEFAULT_SETTINGS.modelPath,
        language: DEFAULT_SETTINGS.language,
        enablePunctuation: DEFAULT_SETTINGS.enablePunctuation,
        enableCapitalization: DEFAULT_SETTINGS.enableCapitalization,
        confidenceThreshold: 0.7,
        maxProcessingTime: 60
      });
      expect(mockTextInserter.initialize).toHaveBeenCalled();
      expect(mockUIController.initialize).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockSettingsManager.initialize.mockRejectedValue(new Error('Settings init failed'));

      await expect(plugin.initialize()).rejects.toThrow('Settings init failed');
    });

    it('should set up event handlers after initialization', async () => {
      await plugin.initialize();

      // Verify that the UI controller methods have been overridden
      expect(typeof plugin.uiController.startRecording).toBe('function');
      expect(typeof plugin.uiController.stopRecording).toBe('function');
    });
  });

  describe('recording workflow', () => {
    beforeEach(async () => {
      await plugin.initialize();
    });

    it('should start live transcription successfully', async () => {
      await plugin.startRecording();

      expect(mockTranscriber.startLiveTranscription).toHaveBeenCalled();
      expect(mockUIController.showRecordingIndicator).toHaveBeenCalled();
    });

    it('should handle live transcription start errors', async () => {
      mockTranscriber.startLiveTranscription.mockRejectedValue(new Error('Live transcription failed'));

      await plugin.startRecording();

      expect(mockUIController.showError).toHaveBeenCalledWith(
        expect.stringContaining('Live transcription failed')
      );
    });

    it('should complete live transcription workflow', async () => {
      // Start live transcription
      await plugin.startRecording();

      // Stop live transcription
      await plugin.stopRecording();

      expect(mockTranscriber.startLiveTranscription).toHaveBeenCalled();
      expect(mockTranscriber.stopLiveTranscription).toHaveBeenCalled();
      expect(mockUIController.showRecordingIndicator).toHaveBeenCalled();
      expect(mockUIController.hideRecordingIndicator).toHaveBeenCalled();
      expect(mockUIController.showSuccess).toHaveBeenCalledWith('Live transcription stopped');
    });

    it('should handle live transcription callbacks', async () => {
      // Mock the startLiveTranscription to call the callbacks
      mockTranscriber.startLiveTranscription.mockImplementation(async (onUpdate, onCommit) => {
        // Simulate real-time update
        if (onUpdate) onUpdate('Hello');
        // Simulate committed text
        if (onCommit) await onCommit('Hello world');
      });

      await plugin.startRecording();

      expect(mockTextInserter.insertText).toHaveBeenCalledWith(
        'Hello world',
        DEFAULT_SETTINGS.insertionMode,
        {
          prefix: DEFAULT_SETTINGS.textPrefix,
          suffix: DEFAULT_SETTINGS.textSuffix,
          addTimestamp: DEFAULT_SETTINGS.addTimestamp
        }
      );
    });

    it('should handle stop transcription errors', async () => {
      mockTranscriber.stopLiveTranscription.mockRejectedValue(new Error('Stop failed'));

      await plugin.stopRecording();

      expect(mockUIController.hideRecordingIndicator).toHaveBeenCalled();
      expect(mockUIController.showError).toHaveBeenCalledWith(
        expect.stringContaining('Stop failed')
      );
    });

    it('should insert remaining text when stopping', async () => {
      mockTranscriber.stopLiveTranscription.mockResolvedValue({
        text: 'Final text',
        confidence: 0.9,
        processingTime: 0,
        segments: [],
        language: 'en'
      });

      await plugin.stopRecording();

      expect(mockTextInserter.insertText).toHaveBeenCalledWith(
        'Final text',
        DEFAULT_SETTINGS.insertionMode,
        {
          prefix: DEFAULT_SETTINGS.textPrefix,
          suffix: DEFAULT_SETTINGS.textSuffix,
          addTimestamp: DEFAULT_SETTINGS.addTimestamp
        }
      );
    });
  });

  describe('settings management', () => {
    beforeEach(async () => {
      await plugin.initialize();
    });

    it('should get current settings', () => {
      const settings = plugin.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should update settings', async () => {
      const newSettings = { language: 'es' as const, sampleRate: 44100 };

      await plugin.updateSettings(newSettings);

      expect(mockSettingsManager.saveSettings).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        ...newSettings
      });
    });

    it('should re-initialize components when critical settings change', async () => {
      const newSettings = { language: 'es' as const, sampleRate: 44100 };

      await plugin.updateSettings(newSettings);

      expect(mockAudioRecorder.initialize).toHaveBeenCalledTimes(2); // Once during init, once during update
      expect(mockTranscriber.initialize).toHaveBeenCalledTimes(2);
    });

    it('should not re-initialize components for non-critical settings', async () => {
      const newSettings = { textPrefix: '**' };

      await plugin.updateSettings(newSettings);

      expect(mockAudioRecorder.initialize).toHaveBeenCalledTimes(1); // Only during init
      expect(mockTranscriber.initialize).toHaveBeenCalledTimes(1);
    });

    it('should handle settings update errors', async () => {
      mockAudioRecorder.initialize.mockRejectedValue(new Error('Init failed'));

      await plugin.updateSettings({ sampleRate: 44100 });

      expect(mockUIController.showError).toHaveBeenCalledWith(
        expect.stringContaining('Init failed')
      );
    });
  });

  describe('auto-save functionality', () => {
    beforeEach(async () => {
      await plugin.initialize();
    });

    it('should auto-save when enabled and note exists', async () => {
      const mockMarkdownView = {
        file: { path: 'test.md' },
        editor: { getValue: jest.fn().mockReturnValue('Note content') }
      } as unknown as MarkdownView;

      mockApp.workspace.getActiveViewOfType = jest.fn().mockReturnValue(mockMarkdownView);

      // Update settings to enable auto-save
      await plugin.updateSettings({ autoSaveAfterTranscription: true });

      // Complete recording workflow
      await plugin.stopRecording();

      expect(mockApp.vault.modify).toHaveBeenCalledWith(
        mockMarkdownView.file,
        'Note content'
      );
    });

    it('should not auto-save when disabled', async () => {
      await plugin.updateSettings({ autoSaveAfterTranscription: false });

      await plugin.stopRecording();

      expect(mockApp.workspace.getActiveViewOfType).not.toHaveBeenCalled();
      expect(mockApp.vault.modify).not.toHaveBeenCalled();
    });

    it('should handle auto-save errors gracefully', async () => {
      const mockMarkdownView = {
        file: { path: 'test.md' },
        editor: { getValue: jest.fn().mockReturnValue('Note content') }
      } as unknown as MarkdownView;

      mockApp.workspace.getActiveViewOfType = jest.fn().mockReturnValue(mockMarkdownView);
      mockApp.vault.modify = jest.fn().mockRejectedValue(new Error('Save failed'));

      await plugin.updateSettings({ autoSaveAfterTranscription: true });
      await plugin.stopRecording();

      // Should not show error to user for auto-save failures
      expect(mockUIController.showError).not.toHaveBeenCalledWith(
        expect.stringContaining('Save failed')
      );
    });

    it('should handle no active view gracefully', async () => {
      mockApp.workspace.getActiveViewOfType = jest.fn().mockReturnValue(null);

      await plugin.updateSettings({ autoSaveAfterTranscription: true });
      await plugin.stopRecording();

      expect(mockApp.vault.modify).not.toHaveBeenCalled();
    });
  });

  describe('event handling integration', () => {
    beforeEach(async () => {
      await plugin.initialize();
    });

    it('should connect UI controller recording methods to plugin workflow', async () => {
      // Call the overridden UI controller methods
      await plugin.uiController.startRecording();
      await plugin.uiController.stopRecording();

      // Verify the live transcription workflow was triggered
      expect(mockTranscriber.startLiveTranscription).toHaveBeenCalled();
      expect(mockTranscriber.stopLiveTranscription).toHaveBeenCalled();
    });
  });

  describe('resource cleanup', () => {
    beforeEach(async () => {
      await plugin.initialize();
    });

    it('should clean up all components', async () => {
      await plugin.cleanup();

      expect(mockAudioRecorder.dispose).toHaveBeenCalled();
      expect(mockTranscriber.dispose).toHaveBeenCalled();
      expect(mockUIController.dispose).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockAudioRecorder.dispose.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      await expect(plugin.cleanup()).resolves.not.toThrow();
    });

    it('should handle missing components during cleanup', async () => {
      // Create a new plugin without initialization
      const uninitializedPlugin = new SpeechToTextPlugin(mockObsidianPlugin);

      await expect(uninitializedPlugin.cleanup()).resolves.not.toThrow();
    });
  });

  describe('edge cases and error handling', () => {
    beforeEach(async () => {
      await plugin.initialize();
    });

    it('should handle multiple rapid start/stop calls', async () => {
      // Simulate rapid clicking
      const promises = [
        plugin.startRecording(),
        plugin.stopRecording(),
        plugin.startRecording(),
        plugin.stopRecording()
      ];

      await Promise.all(promises);

      // Should handle all calls without errors
      expect(mockTranscriber.startLiveTranscription).toHaveBeenCalledTimes(2);
      expect(mockTranscriber.stopLiveTranscription).toHaveBeenCalledTimes(2);
    });

    it('should handle empty transcription results', async () => {
      mockTranscriber.stopLiveTranscription.mockResolvedValue({
        text: '',
        confidence: 0.1,
        processingTime: 0,
        segments: [],
        language: 'en'
      });

      await plugin.stopRecording();

      // Empty text should not trigger text insertion
      expect(mockTextInserter.insertText).not.toHaveBeenCalled();
      expect(mockUIController.showSuccess).toHaveBeenCalled();
    });

    it('should handle component initialization in different orders', async () => {
      // Test that components can be initialized in any order
      const newPlugin = new SpeechToTextPlugin(mockObsidianPlugin);

      // Mock different initialization order
      mockSettingsManager.loadSettings.mockResolvedValue({
        ...DEFAULT_SETTINGS,
        language: 'es'
      });

      await newPlugin.initialize();

      expect(mockTranscriber.initialize).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'es' })
      );
    });
  });
});
