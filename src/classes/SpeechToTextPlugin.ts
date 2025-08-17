import { Plugin, MarkdownView } from 'obsidian';
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
    // Override UIController's recording methods to connect to our workflow
    const originalStartRecording = this.uiController.startRecording.bind(this.uiController);
    const originalStopRecording = this.uiController.stopRecording.bind(this.uiController);

    this.uiController.startRecording = async () => {
      await originalStartRecording();
      await this.startRecording();
    };

    this.uiController.stopRecording = async () => {
      await originalStopRecording();
      await this.stopRecording();
    };

    console.log('Event handlers set up successfully');
  }

  /**
   * Start audio recording
   */
  async startRecording(): Promise<void> {
    try {
      console.log('Starting audio recording...');
      
      // Start audio recording
      await this.audioRecorder.startRecording();

      this.uiController.showRecordingIndicator();
      this.uiController.showInfo('Recording started - speak now!');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.uiController.showError('Failed to start recording: ' + (error as Error).message);
    }
  }

  /**
   * Stop audio recording and transcribe
   */
  async stopRecording(): Promise<void> {
    try {
      console.log('Stopping audio recording...');
      
      // Stop audio recording and get the recorded data
      const audioData = await this.audioRecorder.stopRecording();
      
      this.uiController.hideRecordingIndicator();
      this.uiController.showInfo('Processing audio...');
      
      if (audioData && audioData.buffer.byteLength > 0) {
        console.log('Audio data received:', audioData);
        
        // Transcribe the recorded audio
        const transcriptionResult = await this.transcriber.transcribe(audioData);
        
        console.log('Transcription result:', transcriptionResult);
        
        if (transcriptionResult.text && transcriptionResult.text.trim()) {
          // Insert the transcribed text
          await this.textInserter.insertText(
            transcriptionResult.text,
            this.settings.insertionMode,
            {
              prefix: this.settings.textPrefix,
              suffix: this.settings.textSuffix,
              addTimestamp: this.settings.addTimestamp
            }
          );

          // Auto-save if enabled
          if (this.settings.autoSaveAfterTranscription) {
            await this.autoSaveCurrentNote();
          }

          this.uiController.showSuccess(`Transcribed: "${transcriptionResult.text}"`);
        } else {
          this.uiController.showInfo('No speech detected in recording');
        }
      } else {
        this.uiController.showError('No audio data recorded');
      }
      
    } catch (error) {
      console.error('Failed to process recording:', error);
      this.uiController.hideRecordingIndicator();
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
    await this.updateComponentSettings(newSettings);
  }

  /**
   * Update individual components with new settings
   */
  private async updateComponentSettings(newSettings: Partial<IPluginSettings>): Promise<void> {
    try {
      // For now, we'll re-initialize components when critical settings change
      // This ensures all settings are properly applied
      let needsReinitialization = false;

      // Check if audio settings changed
      if (newSettings.sampleRate !== undefined || 
          newSettings.maxRecordingDuration !== undefined) {
        needsReinitialization = true;
      }

      // Check if transcription settings changed
      if (newSettings.language !== undefined ||
          newSettings.enablePunctuation !== undefined ||
          newSettings.enableCapitalization !== undefined) {
        needsReinitialization = true;
      }

      if (needsReinitialization) {
        // Re-initialize components with new settings
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
      }

      console.log('Component settings updated successfully');
    } catch (error) {
      console.error('Failed to update component settings:', error);
      this.uiController.showError('Failed to update settings: ' + (error as Error).message);
    }
  }

  /**
   * Auto-save the current note if it exists
   */
  private async autoSaveCurrentNote(): Promise<void> {
    try {
      const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      if (activeView && activeView.file) {
        await this.plugin.app.vault.modify(activeView.file, activeView.editor.getValue());
        console.log('Note auto-saved successfully');
      }
    } catch (error) {
      console.error('Failed to auto-save note:', error);
      // Don't show error to user for auto-save failures as it's not critical
    }
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
