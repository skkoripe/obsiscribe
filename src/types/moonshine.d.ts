// Type declarations for @moonshine-ai/moonshine-js
declare module '@moonshine-ai/moonshine-js' {
  export interface MicrophoneTranscriberOptions {
    onTranscriptionCommitted?: (text: string) => void;
    onTranscriptionUpdated?: (text: string) => void;
    onError?: (error: any) => void;
  }

  export class MicrophoneTranscriber {
    constructor(
      modelPath: string,
      options?: MicrophoneTranscriberOptions,
      useVAD?: boolean
    );
    
    start(): Promise<void>;
    stop(): Promise<void>;
  }

  export class MoonshineSpeechRecognition {
    constructor();
    addEventListener(event: string, callback: (e: any) => void): void;
    start(): void;
    stop(): void;
  }

  // Export all classes as named exports
  export { MicrophoneTranscriber, MoonshineSpeechRecognition };
}
