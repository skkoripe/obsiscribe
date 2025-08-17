import { SettingsManager } from '../../src/classes/SettingsManager';
import { Plugin, App, PluginSettingTab } from 'obsidian';
import { IPluginSettings, DEFAULT_SETTINGS } from '../../src/interfaces/ISettings';

// Mock Obsidian Plugin and related classes
describe('SettingsManager', () => {
  let settingsManager: SettingsManager;
  let mockPlugin: Plugin;
  let mockLoadData: jest.Mock;
  let mockSaveData: jest.Mock;
  let mockAddSettingTab: jest.Mock;

  beforeEach(() => {
    // Create mock functions
    mockLoadData = jest.fn();
    mockSaveData = jest.fn();
    mockAddSettingTab = jest.fn();

    // Create mock plugin
    mockPlugin = {
      loadData: mockLoadData,
      saveData: mockSaveData,
      addSettingTab: mockAddSettingTab,
      app: {} as App
    } as unknown as Plugin;

    // Create SettingsManager instance
    settingsManager = new SettingsManager(mockPlugin);
  });

  describe('initialization', () => {
    it('should initialize with default settings', () => {
      const settings = settingsManager.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should initialize and load settings', async () => {
      mockLoadData.mockResolvedValue({});
      
      await settingsManager.initialize();
      
      expect(mockLoadData).toHaveBeenCalled();
      expect(mockAddSettingTab).toHaveBeenCalled();
    });

    it('should initialize and add settings tab', async () => {
      mockLoadData.mockResolvedValue({});
      
      await settingsManager.initialize();
      
      expect(mockAddSettingTab).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('settings loading', () => {
    it('should load default settings when no data exists', async () => {
      mockLoadData.mockResolvedValue(null);
      
      const settings = await settingsManager.loadSettings();
      
      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(mockLoadData).toHaveBeenCalled();
    });

    it('should load and merge saved settings with defaults', async () => {
      const savedSettings = {
        audioQuality: 'high' as const,
        language: 'es',
        enablePunctuation: false
      };
      mockLoadData.mockResolvedValue(savedSettings);
      
      const settings = await settingsManager.loadSettings();
      
      expect(settings).toEqual({
        ...DEFAULT_SETTINGS,
        ...savedSettings
      });
    });

    it('should handle loading errors gracefully', async () => {
      mockLoadData.mockRejectedValue(new Error('Load failed'));
      
      // Should not throw, should use defaults
      const settings = await settingsManager.loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('settings saving', () => {
    it('should save settings to plugin data', async () => {
      const newSettings: IPluginSettings = {
        ...DEFAULT_SETTINGS,
        audioQuality: 'high',
        language: 'es'
      };
      mockSaveData.mockResolvedValue(undefined);
      
      await settingsManager.saveSettings(newSettings);
      
      expect(mockSaveData).toHaveBeenCalledWith(newSettings);
      expect(settingsManager.getSettings()).toEqual(newSettings);
    });

    it('should handle saving errors', async () => {
      const newSettings = { ...DEFAULT_SETTINGS };
      mockSaveData.mockRejectedValue(new Error('Save failed'));
      
      await expect(settingsManager.saveSettings(newSettings)).rejects.toThrow('Save failed');
    });
  });

  describe('settings retrieval', () => {
    it('should return a copy of current settings', () => {
      const settings = settingsManager.getSettings();
      
      // Modify the returned settings
      settings.audioQuality = 'high';
      
      // Original settings should be unchanged
      const originalSettings = settingsManager.getSettings();
      expect(originalSettings.audioQuality).toBe(DEFAULT_SETTINGS.audioQuality);
    });
  });

  describe('individual setting updates', () => {
    beforeEach(() => {
      mockSaveData.mockResolvedValue(undefined);
    });

    it('should update audio quality setting', async () => {
      await settingsManager.updateSetting('audioQuality', 'high');
      
      const settings = settingsManager.getSettings();
      expect(settings.audioQuality).toBe('high');
      expect(mockSaveData).toHaveBeenCalled();
    });

    it('should update sample rate setting', async () => {
      await settingsManager.updateSetting('sampleRate', 44100);
      
      const settings = settingsManager.getSettings();
      expect(settings.sampleRate).toBe(44100);
      expect(mockSaveData).toHaveBeenCalled();
    });

    it('should update language setting', async () => {
      await settingsManager.updateSetting('language', 'es');
      
      const settings = settingsManager.getSettings();
      expect(settings.language).toBe('es');
      expect(mockSaveData).toHaveBeenCalled();
    });

    it('should update boolean settings', async () => {
      await settingsManager.updateSetting('enablePunctuation', false);
      await settingsManager.updateSetting('showRecordingIndicator', false);
      
      const settings = settingsManager.getSettings();
      expect(settings.enablePunctuation).toBe(false);
      expect(settings.showRecordingIndicator).toBe(false);
    });

    it('should update text insertion settings', async () => {
      await settingsManager.updateSetting('insertionMode', 'append');
      await settingsManager.updateSetting('textPrefix', '**');
      await settingsManager.updateSetting('textSuffix', '**');
      
      const settings = settingsManager.getSettings();
      expect(settings.insertionMode).toBe('append');
      expect(settings.textPrefix).toBe('**');
      expect(settings.textSuffix).toBe('**');
    });
  });

  describe('settings reset', () => {
    it('should reset settings to defaults', async () => {
      mockSaveData.mockResolvedValue(undefined);
      
      // First modify some settings
      await settingsManager.updateSetting('audioQuality', 'high');
      await settingsManager.updateSetting('language', 'es');
      
      // Then reset
      await settingsManager.resetSettings();
      
      const settings = settingsManager.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(mockSaveData).toHaveBeenCalledWith(DEFAULT_SETTINGS);
    });
  });

  describe('settings validation', () => {
    it('should validate sample rate within acceptable range', () => {
      const errors1 = settingsManager.validateSettings({ sampleRate: 16000 });
      expect(errors1).toHaveLength(0);
      
      const errors2 = settingsManager.validateSettings({ sampleRate: 7000 });
      expect(errors2).toContain('Sample rate must be between 8000 and 48000 Hz');
      
      const errors3 = settingsManager.validateSettings({ sampleRate: 50000 });
      expect(errors3).toContain('Sample rate must be between 8000 and 48000 Hz');
    });

    it('should validate maximum recording duration', () => {
      const errors1 = settingsManager.validateSettings({ maxRecordingDuration: 300 });
      expect(errors1).toHaveLength(0);
      
      const errors2 = settingsManager.validateSettings({ maxRecordingDuration: 0 });
      expect(errors2).toContain('Maximum recording duration must be at least 1 second');
      
      const errors3 = settingsManager.validateSettings({ maxRecordingDuration: -5 });
      expect(errors3).toContain('Maximum recording duration must be at least 1 second');
    });

    it('should validate supported languages', () => {
      const errors1 = settingsManager.validateSettings({ language: 'en' });
      expect(errors1).toHaveLength(0);
      
      const errors2 = settingsManager.validateSettings({ language: 'es' });
      expect(errors2).toHaveLength(0);
      
      const errors3 = settingsManager.validateSettings({ language: 'fr' });
      expect(errors3).toContain('Unsupported language. Supported languages: en, es');
    });

    it('should return multiple validation errors', () => {
      const errors = settingsManager.validateSettings({
        sampleRate: 7000,
        maxRecordingDuration: 0,
        language: 'fr'
      });
      
      expect(errors).toHaveLength(3);
      expect(errors).toContain('Sample rate must be between 8000 and 48000 Hz');
      expect(errors).toContain('Maximum recording duration must be at least 1 second');
      expect(errors).toContain('Unsupported language. Supported languages: en, es');
    });

    it('should return empty array for valid settings', () => {
      const errors = settingsManager.validateSettings({
        sampleRate: 16000,
        maxRecordingDuration: 300,
        language: 'en',
        audioQuality: 'medium'
      });
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('resource cleanup', () => {
    it('should dispose resources without errors', () => {
      expect(() => settingsManager.dispose()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined settings gracefully', async () => {
      mockLoadData.mockResolvedValue(undefined);
      
      const settings = await settingsManager.loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should handle partial settings objects', async () => {
      const partialSettings = {
        audioQuality: 'high' as const,
        invalidProperty: 'should be ignored'
      };
      mockLoadData.mockResolvedValue(partialSettings);
      
      const settings = await settingsManager.loadSettings();
      expect(settings.audioQuality).toBe('high');
      expect(settings.language).toBe(DEFAULT_SETTINGS.language);
      expect((settings as any).invalidProperty).toBeUndefined();
    });

    it('should handle empty validation input', () => {
      const errors = settingsManager.validateSettings({});
      expect(errors).toHaveLength(0);
    });
  });

  describe('type safety', () => {
    it('should maintain type safety for setting updates', async () => {
      mockSaveData.mockResolvedValue(undefined);
      
      // These should compile without TypeScript errors
      await settingsManager.updateSetting('audioQuality', 'high');
      await settingsManager.updateSetting('sampleRate', 44100);
      await settingsManager.updateSetting('enablePunctuation', true);
      await settingsManager.updateSetting('insertionMode', 'append');
      
      // Verify the updates
      const settings = settingsManager.getSettings();
      expect(settings.audioQuality).toBe('high');
      expect(settings.sampleRate).toBe(44100);
      expect(settings.enablePunctuation).toBe(true);
      expect(settings.insertionMode).toBe('append');
    });
  });
});
