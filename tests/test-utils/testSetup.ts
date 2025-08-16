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

export {};
