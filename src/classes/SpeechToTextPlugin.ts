import { Plugin } from 'obsidian';
import { IPluginSettings, DEFAULT_SETTINGS } from '../interfaces/ISettings';
import { AudioRecorder } from './AudioRecorder';
import { MoonshineTranscriber } from './MoonshineTranscriber';
import { TextInserter } from './TextInserter';
import { SettingsManager } from './SettingsManager';
import { UIController } from './UIController';

/**
 * Main plugin class that coordinates all components
 * Follows the Single Responsibility Principle by delegating specific tasks to specialized classes
 */
export class SpeechToTextPlugin {
  private settings: IPluginSettings;
  public audioRecorder!: AudioRecorder;
  public transcriber!: MoonshineTranscriber;
  public textInserter!: TextInserter;
  public settingsManager!: SettingsManager;
  public uiController!: UIController;

  constructor(private plugin: Plugin) {
    this.settings = { ...DEFAULT_SETTINGS };
  }

  /**
   * Initialize all components of the plugin
   */
  async initialize(): Promise<void> {
    try {
      // Initialize settings manager first
      this.settingsManager = new SettingsManager(this.plugin);
      await this.settingsManager.initialize();
      this.settings = await this.settingsManager.loadSettings();

      // Initialize core components
      this.audioRecorder = new AudioRecorder();
      this.transcriber = new MoonshineTranscriber();
      this.textInserter = new TextInserter(this.plugin);
      this.uiController = new UIController(this.plugin);

      // Initialize each component
      await this.audioRecorder.initialize({
        sampleRate: this.settings.sampleRate,
        channelCount: 1,
        bitDepth: 16,
        maxDuration: this.settings.maxRecordingDuration
      });

      await this.transcriber.initialize({
        modelPath: this.settings.modelPath,
        language: this.settings.language,
        enablePunctuation: this.settings.enablePunctuation,
        enableCapitalization: this.settings.enableCapitalization,
        confidenceThreshold: 0.7,
        maxProcessingTime: 60
      });

      await this.textInserter.initialize();
      await this.uiController.initialize();

      // Set up event handlers
      this.setupEventHandlers();

      console.log('SpeechToTextPlugin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SpeechToTextPlugin:', error);
      throw error;
    }
  }

  /**
   * Set up event handlers between components
   */
  private setupEventHandlers(): void {
    // Audio recorder events
    // TODO: Implement event handling

    // Transcriber events
    // TODO: Implement event handling

    // UI controller events
    // TODO: Implement event handling
  }

  /**
   * Start the speech-to-text recording process
   */
  async startRecording(): Promise<void> {
    try {
      if (!this.audioRecorder.hasPermission()) {
        const granted = await this.audioRecorder.requestPermission();
        if (!granted) {
          throw new Error('Microphone permission denied');
        }
      }

      await this.audioRecorder.startRecording();
      this.uiController.showRecordingIndicator();
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.uiController.showError('Failed to start recording: ' + (error as Error).message);
    }
  }

  /**
   * Stop recording and process the audio
   */
  async stopRecording(): Promise<void> {
    try {
      const audioData = await this.audioRecorder.stopRecording();
      this.uiController.hideRecordingIndicator();
      this.uiController.showProcessingIndicator();

      const transcriptionResult = await this.transcriber.transcribe(audioData);
      
      await this.textInserter.insertText(
        transcriptionResult.text,
        this.settings.insertionMode,
        {
          prefix: this.settings.textPrefix,
          suffix: this.settings.textSuffix,
          addTimestamp: this.settings.addTimestamp
        }
      );

      this.uiController.hideProcessingIndicator();
      
      if (this.settings.autoSaveAfterTranscription) {
        // TODO: Implement auto-save functionality
      }
    } catch (error) {
      console.error('Failed to process recording:', error);
      this.uiController.hideProcessingIndicator();
      this.uiController.showError('Failed to process recording: ' + (error as Error).message);
    }
  }

  /**
   * Get current plugin settings
   */
  getSettings(): IPluginSettings {
    return { ...this.settings };
  }

  /**
   * Update plugin settings
   */
  async updateSettings(newSettings: Partial<IPluginSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.settingsManager.saveSettings(this.settings);
    
    // Update components with new settings
    // TODO: Implement settings update for each component
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.audioRecorder) {
        this.audioRecorder.dispose();
      }
      
      if (this.transcriber) {
        this.transcriber.dispose();
      }
      
      if (this.uiController) {
        this.uiController.dispose();
      }
      
      console.log('SpeechToTextPlugin cleaned up successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}
