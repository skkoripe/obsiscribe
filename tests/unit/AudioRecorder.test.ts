import { AudioRecorder } from '../../src/classes/AudioRecorder';
import { AudioRecorderSettings } from '../../src/interfaces/IAudioRecorder';

describe('AudioRecorder', () => {
  let audioRecorder: AudioRecorder;
  let mockSettings: AudioRecorderSettings;

  beforeEach(() => {
    audioRecorder = new AudioRecorder();
    mockSettings = {
      sampleRate: 16000,
      channelCount: 1,
      bitDepth: 16,
      maxDuration: 300
    };
  });

  afterEach(() => {
    audioRecorder.dispose();
  });

  describe('initialization', () => {
    it('should initialize with settings', async () => {
      await expect(audioRecorder.initialize(mockSettings)).resolves.not.toThrow();
    });

    it('should not be recording initially', () => {
      expect(audioRecorder.isRecording()).toBe(false);
    });
  });

  describe('recording state', () => {
    beforeEach(async () => {
      await audioRecorder.initialize(mockSettings);
    });

    it('should start recording', async () => {
      await audioRecorder.startRecording();
      expect(audioRecorder.isRecording()).toBe(true);
    });

    it('should stop recording and return audio data', async () => {
      await audioRecorder.startRecording();
      const audioData = await audioRecorder.stopRecording();
      
      expect(audioRecorder.isRecording()).toBe(false);
      expect(audioData).toHaveProperty('buffer');
      expect(audioData).toHaveProperty('sampleRate');
      expect(audioData).toHaveProperty('channelCount');
      expect(audioData).toHaveProperty('duration');
      expect(audioData).toHaveProperty('format');
    });

    it('should throw error when starting recording while already recording', async () => {
      await audioRecorder.startRecording();
      await expect(audioRecorder.startRecording()).rejects.toThrow('Recording is already in progress');
    });

    it('should throw error when stopping recording while not recording', async () => {
      await expect(audioRecorder.stopRecording()).rejects.toThrow('No recording in progress');
    });
  });

  describe('permissions', () => {
    beforeEach(async () => {
      await audioRecorder.initialize(mockSettings);
    });

    it('should check for permissions', async () => {
      const hasPermission = await audioRecorder.hasPermission();
      expect(typeof hasPermission).toBe('boolean');
    });

    it('should request permissions', async () => {
      const granted = await audioRecorder.requestPermission();
      expect(typeof granted).toBe('boolean');
    });
  });

  describe('device management', () => {
    beforeEach(async () => {
      await audioRecorder.initialize(mockSettings);
    });

    it('should get audio devices', async () => {
      const devices = await audioRecorder.getAudioDevices();
      expect(Array.isArray(devices)).toBe(true);
    });

    it('should set audio device', async () => {
      await expect(audioRecorder.setAudioDevice('test-device-id')).resolves.not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should dispose resources properly', () => {
      expect(() => audioRecorder.dispose()).not.toThrow();
    });

    it('should stop recording when disposed while recording', async () => {
      await audioRecorder.initialize(mockSettings);
      await audioRecorder.startRecording();
      
      audioRecorder.dispose();
      
      expect(audioRecorder.isRecording()).toBe(false);
    });
  });
});
