import { Plugin, PluginSettingTab, App, Setting } from 'obsidian';
import { IPluginSettings, DEFAULT_SETTINGS } from '../interfaces/ISettings';

/**
 * SettingsManager class handles plugin settings and preferences
 * Manages settings UI and persistence
 */
export class SettingsManager {
  private settings: IPluginSettings;

  constructor(private plugin: Plugin) {
    this.settings = { ...DEFAULT_SETTINGS };
  }

  /**
   * Initialize the settings manager
   */
  async initialize(): Promise<void> {
    // Load settings from disk
    await this.loadSettings();
    
    // Add settings tab to Obsidian
    this.plugin.addSettingTab(new ObsiscribeSettingTab(this.plugin.app, this.plugin, this));
    
    console.log('SettingsManager initialized');
  }

  /**
   * Load settings from disk
   */
  async loadSettings(): Promise<IPluginSettings> {
    try {
      const loadedData = await this.plugin.loadData();
      
      // Only copy valid properties from loaded data
      const validSettings: Partial<IPluginSettings> = {};
      if (loadedData) {
        const validKeys = Object.keys(DEFAULT_SETTINGS) as (keyof IPluginSettings)[];
        for (const key of validKeys) {
          if (loadedData[key] !== undefined) {
            validSettings[key] = loadedData[key];
          }
        }
      }
      
      this.settings = Object.assign({}, DEFAULT_SETTINGS, validSettings);
      console.log('Settings loaded:', this.settings);
      return this.settings;
    } catch (error) {
      console.error('Failed to load settings, using defaults:', error);
      this.settings = { ...DEFAULT_SETTINGS };
      return this.settings;
    }
  }

  /**
   * Save settings to disk
   */
  async saveSettings(newSettings: IPluginSettings): Promise<void> {
    this.settings = newSettings;
    await this.plugin.saveData(this.settings);
    console.log('Settings saved:', this.settings);
  }

  /**
   * Get current settings
   */
  getSettings(): IPluginSettings {
    return { ...this.settings };
  }

  /**
   * Update specific setting
   */
  async updateSetting<K extends keyof IPluginSettings>(
    key: K,
    value: IPluginSettings[K]
  ): Promise<void> {
    this.settings[key] = value;
    await this.saveSettings(this.settings);
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.saveSettings(this.settings);
    console.log('Settings reset to defaults');
  }

  /**
   * Validate settings
   */
  validateSettings(settings: Partial<IPluginSettings>): string[] {
    const errors: string[] = [];

    // Validate audio settings
    if (settings.sampleRate !== undefined && (settings.sampleRate < 8000 || settings.sampleRate > 48000)) {
      errors.push('Sample rate must be between 8000 and 48000 Hz');
    }

    if (settings.maxRecordingDuration !== undefined && settings.maxRecordingDuration < 1) {
      errors.push('Maximum recording duration must be at least 1 second');
    }

    // Validate language
    if (settings.language && ['en', 'es'].indexOf(settings.language) === -1) {
      errors.push('Unsupported language. Supported languages: en, es');
    }

    return errors;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    console.log('SettingsManager disposed');
  }
}

/**
 * Settings tab for the Obsidian plugin
 */
class ObsiscribeSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    plugin: Plugin,
    private settingsManager: SettingsManager
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Obsiscribe - Speech to Text Settings' });

    const settings = this.settingsManager.getSettings();

    // Audio Settings Section
    containerEl.createEl('h3', { text: 'Audio Settings' });

    new Setting(containerEl)
      .setName('Audio Quality')
      .setDesc('Quality of audio recording (affects file size and processing time)')
      .addDropdown(dropdown => dropdown
        .addOption('low', 'Low')
        .addOption('medium', 'Medium')
        .addOption('high', 'High')
        .setValue(settings.audioQuality)
        .onChange(async (value) => {
          await this.settingsManager.updateSetting('audioQuality', value as 'low' | 'medium' | 'high');
        }));

    new Setting(containerEl)
      .setName('Sample Rate')
      .setDesc('Audio sample rate in Hz (higher = better quality, larger files)')
      .addText(text => text
        .setPlaceholder('16000')
        .setValue(settings.sampleRate.toString())
        .onChange(async (value) => {
          const sampleRate = parseInt(value);
          if (!isNaN(sampleRate)) {
            await this.settingsManager.updateSetting('sampleRate', sampleRate);
          }
        }));

    new Setting(containerEl)
      .setName('Max Recording Duration')
      .setDesc('Maximum recording duration in seconds')
      .addText(text => text
        .setPlaceholder('300')
        .setValue(settings.maxRecordingDuration.toString())
        .onChange(async (value) => {
          const duration = parseInt(value);
          if (!isNaN(duration)) {
            await this.settingsManager.updateSetting('maxRecordingDuration', duration);
          }
        }));

    // Transcription Settings Section
    containerEl.createEl('h3', { text: 'Transcription Settings' });

    new Setting(containerEl)
      .setName('Language')
      .setDesc('Language for speech recognition')
      .addDropdown(dropdown => dropdown
        .addOption('en', 'English')
        .addOption('es', 'Spanish')
        .setValue(settings.language)
        .onChange(async (value) => {
          await this.settingsManager.updateSetting('language', value);
        }));

    new Setting(containerEl)
      .setName('Enable Punctuation')
      .setDesc('Automatically add punctuation to transcribed text')
      .addToggle(toggle => toggle
        .setValue(settings.enablePunctuation)
        .onChange(async (value) => {
          await this.settingsManager.updateSetting('enablePunctuation', value);
        }));

    new Setting(containerEl)
      .setName('Enable Capitalization')
      .setDesc('Automatically capitalize transcribed text')
      .addToggle(toggle => toggle
        .setValue(settings.enableCapitalization)
        .onChange(async (value) => {
          await this.settingsManager.updateSetting('enableCapitalization', value);
        }));

    // UI Settings Section
    containerEl.createEl('h3', { text: 'User Interface' });

    new Setting(containerEl)
      .setName('Show Recording Indicator')
      .setDesc('Show visual indicator when recording is active')
      .addToggle(toggle => toggle
        .setValue(settings.showRecordingIndicator)
        .onChange(async (value) => {
          await this.settingsManager.updateSetting('showRecordingIndicator', value);
        }));

    new Setting(containerEl)
      .setName('Recording Button Position')
      .setDesc('Where to show the recording button')
      .addDropdown(dropdown => dropdown
        .addOption('ribbon', 'Ribbon (left sidebar)')
        .addOption('statusbar', 'Status bar (bottom)')
        .addOption('both', 'Both locations')
        .setValue(settings.recordingButtonPosition)
        .onChange(async (value) => {
          await this.settingsManager.updateSetting('recordingButtonPosition', value as 'ribbon' | 'statusbar' | 'both');
        }));

    // Text Insertion Settings Section
    containerEl.createEl('h3', { text: 'Text Insertion' });

    new Setting(containerEl)
      .setName('Insertion Mode')
      .setDesc('How to insert transcribed text into notes')
      .addDropdown(dropdown => dropdown
        .addOption('cursor', 'At cursor position')
        .addOption('append', 'Append to end of note')
        .addOption('prepend', 'Prepend to beginning of note')
        .setValue(settings.insertionMode)
        .onChange(async (value) => {
          await this.settingsManager.updateSetting('insertionMode', value as 'cursor' | 'append' | 'prepend');
        }));

    new Setting(containerEl)
      .setName('Text Prefix')
      .setDesc('Text to add before transcribed content')
      .addText(text => text
        .setPlaceholder('')
        .setValue(settings.textPrefix)
        .onChange(async (value) => {
          await this.settingsManager.updateSetting('textPrefix', value);
        }));

    new Setting(containerEl)
      .setName('Text Suffix')
      .setDesc('Text to add after transcribed content')
      .addText(text => text
        .setPlaceholder('\\n\\n')
        .setValue(settings.textSuffix)
        .onChange(async (value) => {
          await this.settingsManager.updateSetting('textSuffix', value);
        }));

    new Setting(containerEl)
      .setName('Add Timestamp')
      .setDesc('Add timestamp to transcribed text')
      .addToggle(toggle => toggle
        .setValue(settings.addTimestamp)
        .onChange(async (value) => {
          await this.settingsManager.updateSetting('addTimestamp', value);
        }));

    // Advanced Settings Section
    containerEl.createEl('h3', { text: 'Advanced Settings' });

    new Setting(containerEl)
      .setName('Auto-save After Transcription')
      .setDesc('Automatically save the note after inserting transcribed text')
      .addToggle(toggle => toggle
        .setValue(settings.autoSaveAfterTranscription)
        .onChange(async (value) => {
          await this.settingsManager.updateSetting('autoSaveAfterTranscription', value);
        }));

    new Setting(containerEl)
      .setName('Enable Debug Logging')
      .setDesc('Enable detailed logging for troubleshooting')
      .addToggle(toggle => toggle
        .setValue(settings.enableDebugLogging)
        .onChange(async (value) => {
          await this.settingsManager.updateSetting('enableDebugLogging', value);
        }));

    // Reset Settings Button
    new Setting(containerEl)
      .setName('Reset Settings')
      .setDesc('Reset all settings to their default values')
      .addButton(button => button
        .setButtonText('Reset to Defaults')
        .setWarning()
        .onClick(async () => {
          await this.settingsManager.resetSettings();
          this.display(); // Refresh the settings display
        }));
  }
}
