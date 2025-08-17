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
   * Start recording audio from the microphone using Web Audio API for raw PCM data
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

      console.log('Starting raw PCM audio recording...');

      // Get microphone stream with high sample rate (we'll resample later)
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000, // Request high quality, we'll resample to 16kHz
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Clear previous recordings
      this.recordedChunks = [];

      // **CRITICAL FIX**: Use Web Audio API for raw PCM data instead of MediaRecorder
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(this.audioStream);
      
      // Create ScriptProcessorNode for raw audio processing
      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      console.log(`Audio context sample rate: ${audioContext.sampleRate}Hz`);
      
      processor.onaudioprocess = (event) => {
        if (this.isCurrentlyRecording) {
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0); // Get mono channel
          
          // Convert Float32Array to Int16Array for compatibility
          const int16Array = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            // Convert float (-1 to 1) to int16 (-32768 to 32767)
            int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          
          // Store as Blob for consistency with existing interface
          const buffer = int16Array.buffer;
          const blob = new Blob([buffer], { type: 'audio/pcm' });
          this.recordedChunks.push(blob);
        }
      };
      
      // Connect the audio processing chain
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Store references for cleanup
      (this as any).audioContext = audioContext;
      (this as any).processor = processor;
      (this as any).source = source;

      this.isCurrentlyRecording = true;
      console.log('Raw PCM audio recording started successfully');
      
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
   * Stop recording and return the raw PCM audio data
   */
  async stopRecording(): Promise<AudioData> {
    if (!this.isCurrentlyRecording) {
      throw new AudioRecorderError(
        'No recording in progress',
        AudioRecorderErrorCode.RECORDING_FAILED
      );
    }

    try {
      console.log('Stopping raw PCM audio recording...');

      // Stop recording flag
      this.isCurrentlyRecording = false;

      // Clean up Web Audio API resources
      const audioContext = (this as any).audioContext;
      const processor = (this as any).processor;
      const source = (this as any).source;

      if (processor) {
        processor.disconnect();
      }
      if (source) {
        source.disconnect();
      }
      if (audioContext && audioContext.state !== 'closed') {
        await audioContext.close();
      }

      // Stop the audio stream
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
        this.audioStream = null;
      }

      // Combine all recorded PCM chunks into a single ArrayBuffer
      if (this.recordedChunks.length === 0) {
        throw new Error('No audio data recorded');
      }

      console.log(`Combining ${this.recordedChunks.length} PCM audio chunks...`);

      // Calculate total size
      let totalSize = 0;
      const arrayBuffers: ArrayBuffer[] = [];
      
      for (const chunk of this.recordedChunks) {
        const arrayBuffer = await chunk.arrayBuffer();
        arrayBuffers.push(arrayBuffer);
        totalSize += arrayBuffer.byteLength;
      }

      // Combine all chunks into a single ArrayBuffer
      const combinedBuffer = new ArrayBuffer(totalSize);
      const combinedView = new Uint8Array(combinedBuffer);
      let offset = 0;

      for (const buffer of arrayBuffers) {
        const view = new Uint8Array(buffer);
        combinedView.set(view, offset);
        offset += buffer.byteLength;
      }

      // Calculate duration based on sample rate and data size
      const sampleRate = audioContext?.sampleRate || 48000;
      const bytesPerSample = 2; // 16-bit = 2 bytes
      const totalSamples = totalSize / bytesPerSample;
      const duration = totalSamples / sampleRate;

      console.log(`Raw PCM audio: ${totalSize} bytes, ${duration.toFixed(2)}s at ${sampleRate}Hz`);

      const audioData: AudioData = {
        buffer: combinedBuffer,
        sampleRate: sampleRate,
        channelCount: 1,
        duration: duration,
        format: 'pcm'
      };

      console.log('Raw PCM audio recording stopped successfully');
      return audioData;

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
