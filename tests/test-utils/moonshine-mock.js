// Mock implementation of @moonshine-ai/moonshine-js for testing

const MicrophoneTranscriber = jest.fn().mockImplementation(() => ({
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined)
}));

const MoonshineSpeechRecognition = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  start: jest.fn(),
  stop: jest.fn()
}));

module.exports = {
  MicrophoneTranscriber,
  MoonshineSpeechRecognition
};
