// Test setup file for Jest
// This file is run before each test file

// Mock Obsidian API for testing
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Mock DOM methods that might be used in tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock HTMLElement methods
HTMLElement.prototype.addClass = jest.fn();
HTMLElement.prototype.removeClass = jest.fn();
HTMLElement.prototype.setText = jest.fn();

// Mock MediaDevices API for audio recording tests
const mockMediaStream = {
  getTracks: jest.fn(() => [
    {
      stop: jest.fn(),
      kind: 'audio',
      enabled: true,
      readyState: 'live'
    }
  ]),
  getAudioTracks: jest.fn(() => [
    {
      stop: jest.fn(),
      kind: 'audio',
      enabled: true,
      readyState: 'live'
    }
  ])
};

const mockMediaRecorder = jest.fn().mockImplementation(() => {
  const instance: any = {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    state: 'inactive',
    mimeType: 'audio/webm',
    ondataavailable: null,
    onstop: null,
    onerror: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };

  // Mock the stop method to trigger onstop callback
  instance.stop = jest.fn(() => {
    // Simulate async behavior
    setTimeout(() => {
      if (instance.onstop) {
        instance.onstop();
      }
    }, 10);
  });

  // Mock the start method to trigger ondataavailable
  instance.start = jest.fn(() => {
    // Simulate data chunks being available
    setTimeout(() => {
      if (instance.ondataavailable) {
        const mockBlob = {
          size: 1024,
          type: 'audio/webm',
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
        };
        instance.ondataavailable({
          data: mockBlob
        });
      }
    }, 50);
  });

  return instance;
});

// Add static method to the mock
(mockMediaRecorder as any).isTypeSupported = jest.fn((type: string) => {
  return type.includes('webm') || type.includes('wav');
});

Object.defineProperty(window, 'MediaRecorder', {
  writable: true,
  value: mockMediaRecorder
});

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue(mockMediaStream),
    enumerateDevices: jest.fn().mockResolvedValue([
      {
        deviceId: 'default',
        kind: 'audioinput',
        label: 'Default - Built-in Microphone',
        groupId: 'default-group'
      },
      {
        deviceId: 'device-1',
        kind: 'audioinput', 
        label: 'External Microphone',
        groupId: 'external-group'
      }
    ])
  }
});

// Mock navigator.permissions
Object.defineProperty(navigator, 'permissions', {
  writable: true,
  value: {
    query: jest.fn().mockResolvedValue({
      state: 'granted',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    })
  }
});

// Mock Blob and ArrayBuffer for audio data
global.Blob = jest.fn().mockImplementation((chunks, options) => ({
  size: 1024,
  type: options?.type || 'audio/webm',
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
  slice: jest.fn(),
  stream: jest.fn(),
  text: jest.fn()
}));

export {};
