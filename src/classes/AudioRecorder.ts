import { 
  IAudioRecorder, 
  AudioRecorderSettings, 
  AudioData, 
  AudioRecorderError, 
  AudioRecorderErrorCode 
} from '../interfaces/IAudioRecorder';

/**
 * AudioRecorder class handles microphone access and audio recording
 * Implements the IAudioRecorder interface
 */
export class AudioRecorder implements IAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private isCurrentlyRecording = false;
  private settings: AudioRecorderSettings | null = null;

  /**
   * Initialize the audio recorder with the given settings
   */
  async initialize(settings: AudioRecorderSettings): Promise<void> {
    this.settings = settings;
    console.log('AudioRecorder initialized with settings:', settings);
  }

  /**
   * Start recording audio from the microphone
   */
  async startRecording(): Promise<void> {
    if (this.isCurrentlyRecording) {
      throw new AudioRecorderError(
        'Recording is already in progress',
        AudioRecorderErrorCode.RECORDING_FAILED
      );
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser');
      }

      console.log('Starting audio recording...');

      // Get microphone stream
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.settings?.sampleRate || 16000,
          channelCount: this.settings?.channelCount || 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Clear previous recordings
      this.recordedChunks = [];

      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: mimeType
      });

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.isCurrentlyRecording = false;
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isCurrentlyRecording = true;

      console.log('Audio recording started successfully');
    } catch (error) {
      this.cleanup();
      throw new AudioRecorderError(
        'Failed to start recording',
        AudioRecorderErrorCode.RECORDING_FAILED,
        error as Error
      );
    }
  }

  /**
   * Stop recording and return the audio data
   */
  async stopRecording(): Promise<AudioData> {
    if (!this.isCurrentlyRecording) {
      throw new AudioRecorderError(
        'No recording in progress',
        AudioRecorderErrorCode.RECORDING_FAILED
      );
    }

    try {
      console.log('Stopping audio recording...');

      return new Promise<AudioData>((resolve, reject) => {
        if (!this.mediaRecorder) {
          reject(new Error('MediaRecorder not available'));
          return;
        }

        // Set up the stop handler
        this.mediaRecorder.onstop = async () => {
          try {
            // Create blob from recorded chunks
            const audioBlob = new Blob(this.recordedChunks, { 
              type: this.mediaRecorder?.mimeType || 'audio/webm' 
            });

            // Convert blob to ArrayBuffer
            const arrayBuffer = await audioBlob.arrayBuffer();

            // Calculate duration (approximate)
            const duration = this.recordedChunks.length * 0.1; // 100ms chunks

            // Stop the audio stream
            if (this.audioStream) {
              this.audioStream.getTracks().forEach(track => track.stop());
              this.audioStream = null;
            }

            this.isCurrentlyRecording = false;

            const audioData: AudioData = {
              buffer: arrayBuffer,
              sampleRate: this.settings?.sampleRate || 16000,
              channelCount: this.settings?.channelCount || 1,
              duration: duration,
              format: this.getFormatFromMimeType(this.mediaRecorder?.mimeType || 'audio/webm')
            };

            console.log('Audio recording stopped successfully, duration:', duration, 'seconds');
            resolve(audioData);
          } catch (error) {
            reject(error);
          }
        };

        // Stop the recording
        this.mediaRecorder.stop();
      });
    } catch (error) {
      this.cleanup();
      throw new AudioRecorderError(
        'Failed to stop recording',
        AudioRecorderErrorCode.RECORDING_FAILED,
        error as Error
      );
    }
  }

  /**
   * Check if recording is currently active
   */
  isRecording(): boolean {
    return this.isCurrentlyRecording;
  }

  /**
   * Check if microphone permission is granted
   */
  async hasPermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      // Check if we already have permission
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permissionStatus.state === 'granted';
    } catch (error) {
      // Fallback: try to access microphone to check permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Request microphone permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser');
      }

      console.log('Requesting microphone permission...');
      
      // Request access to microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: this.settings?.sampleRate || 16000,
          channelCount: this.settings?.channelCount || 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Stop the stream immediately - we just wanted permission
      stream.getTracks().forEach(track => track.stop());
      
      console.log('Microphone permission granted');
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      throw new AudioRecorderError(
        'Permission denied',
        AudioRecorderErrorCode.PERMISSION_DENIED,
        error as Error
      );
    }
  }

  /**
   * Get available audio input devices
   */
  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('Device enumeration not supported in this browser');
      }

      console.log('Enumerating audio input devices...');
      
      // Get all media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter for audio input devices
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
      
      console.log('Found audio input devices:', audioInputDevices.length);
      return audioInputDevices;
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
      throw new AudioRecorderError(
        'Failed to get audio devices',
        AudioRecorderErrorCode.DEVICE_NOT_FOUND,
        error as Error
      );
    }
  }

  /**
   * Set the audio input device
   */
  async setAudioDevice(deviceId: string): Promise<void> {
    try {
      // TODO: Implement actual device selection
      console.log('Setting audio device:', deviceId);
    } catch (error) {
      throw new AudioRecorderError(
        'Failed to set audio device',
        AudioRecorderErrorCode.DEVICE_NOT_FOUND,
        error as Error
      );
    }
  }

  /**
   * Get supported MIME type for MediaRecorder
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using MIME type:', type);
        return type;
      }
    }

    // Fallback to default
    console.warn('No supported MIME type found, using default');
    return '';
  }

  /**
   * Get audio format from MIME type
   */
  private getFormatFromMimeType(mimeType: string): 'wav' | 'pcm' {
    // For Phase 2, we'll convert all formats to WAV for consistency
    // In Phase 3, we can add more sophisticated format handling if needed
    if (mimeType.includes('wav')) return 'wav';
    return 'wav'; // default to wav for all other formats
  }

  /**
   * Clean up resources (internal helper)
   */
  private cleanup(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }

    this.recordedChunks = [];
    this.isCurrentlyRecording = false;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.cleanup();
    console.log('AudioRecorder disposed');
  }
}
