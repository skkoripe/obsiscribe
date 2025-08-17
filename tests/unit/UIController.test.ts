import { UIController } from '../../src/classes/UIController';
import { Plugin, Notice } from 'obsidian';

// Mock Obsidian Plugin, Notice, and HTMLElement
describe('UIController', () => {
  let uiController: UIController;
  let mockPlugin: Plugin;
  let mockRibbonIcon: HTMLElement;
  let mockStatusBarItem: HTMLElement;
  let mockDocument: Document;
  
  // Store original functions to restore later
  const originalCreateElement = document.createElement;
  const originalBodyAppendChild = document.body.appendChild;
  const originalHeadAppendChild = document.head.appendChild;

  beforeEach(() => {
    // Create mock ribbon icon
    mockRibbonIcon = {
      addClass: jest.fn(),
      removeClass: jest.fn(),
      setAttribute: jest.fn(),
      remove: jest.fn()
    } as unknown as HTMLElement;

    // Create mock status bar item
    mockStatusBarItem = {
      setText: jest.fn(),
      addClass: jest.fn(),
      removeClass: jest.fn(),
      remove: jest.fn(),
      style: {
        display: 'none'
      }
    } as unknown as HTMLElement;

    // Create mock plugin
    mockPlugin = {
      addRibbonIcon: jest.fn().mockReturnValue(mockRibbonIcon),
      addStatusBarItem: jest.fn().mockReturnValue(mockStatusBarItem)
    } as unknown as Plugin;

    // Mock document.createElement, document.body.appendChild, and document.head.appendChild
    const mockElement = {
      className: '',
      innerHTML: '',
      style: {},
      textContent: '',
      remove: jest.fn()
    };
    document.createElement = jest.fn().mockReturnValue(mockElement);
    document.body.appendChild = jest.fn();
    document.head.appendChild = jest.fn();

    // Create UIController instance
    uiController = new UIController(mockPlugin);
  });

  afterEach(() => {
    // Restore original functions
    if (document.body) {
      document.body.appendChild = originalBodyAppendChild;
    }
    
    if (document.head) {
      document.head.appendChild = originalHeadAppendChild;
    }
    
    document.createElement = originalCreateElement;
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      await expect(uiController.initialize()).resolves.not.toThrow();
      expect(mockPlugin.addRibbonIcon).toHaveBeenCalled();
      expect(mockPlugin.addStatusBarItem).toHaveBeenCalled();
    });

    it('should create recording button', async () => {
      await uiController.initialize();
      expect(mockPlugin.addRibbonIcon).toHaveBeenCalledWith(
        'microphone',
        'Start/Stop Speech Recording',
        expect.any(Function)
      );
      expect(mockRibbonIcon.addClass).toHaveBeenCalledWith('obsiscribe-recording-button');
    });

    it('should create status bar item', async () => {
      await uiController.initialize();
      expect(mockPlugin.addStatusBarItem).toHaveBeenCalled();
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('');
      expect(mockStatusBarItem.addClass).toHaveBeenCalledWith('obsiscribe-status-bar');
      expect(mockStatusBarItem.style.display).toBe('none');
    });
  });

  describe('recording state management', () => {
    beforeEach(async () => {
      await uiController.initialize();
    });

    it('should start recording', async () => {
      await uiController.startRecording();
      expect(uiController.getRecordingState()).toBe(true);
      expect(mockRibbonIcon.addClass).toHaveBeenCalledWith('obsiscribe-recording-active');
      expect(mockRibbonIcon.setAttribute).toHaveBeenCalledWith('aria-label', 'Stop Speech Recording');
    });

    it('should stop recording', async () => {
      await uiController.startRecording();
      await uiController.stopRecording();
      expect(uiController.getRecordingState()).toBe(false);
      expect(mockRibbonIcon.removeClass).toHaveBeenCalledWith('obsiscribe-recording-active');
      expect(mockRibbonIcon.setAttribute).toHaveBeenCalledWith('aria-label', 'Start Speech Recording');
    });

    it('should set recording state', () => {
      uiController.setRecordingState(true);
      expect(uiController.getRecordingState()).toBe(true);
      expect(mockRibbonIcon.addClass).toHaveBeenCalledWith('obsiscribe-recording-active');

      uiController.setRecordingState(false);
      expect(uiController.getRecordingState()).toBe(false);
      expect(mockRibbonIcon.removeClass).toHaveBeenCalledWith('obsiscribe-recording-active');
    });
  });

  describe('indicators', () => {
    beforeEach(async () => {
      await uiController.initialize();
    });

    it('should show recording indicator', () => {
      uiController.showRecordingIndicator();
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('🎤 Recording...');
      expect(mockStatusBarItem.style.display).toBe('block');
      expect(mockStatusBarItem.addClass).toHaveBeenCalledWith('obsiscribe-recording-indicator');
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should hide recording indicator', () => {
      uiController.showRecordingIndicator();
      uiController.hideRecordingIndicator();
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('');
      expect(mockStatusBarItem.style.display).toBe('none');
      expect(mockStatusBarItem.removeClass).toHaveBeenCalledWith('obsiscribe-recording-indicator');
    });

    it('should show processing indicator', () => {
      uiController.showProcessingIndicator();
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('⚡ Processing...');
      expect(mockStatusBarItem.style.display).toBe('block');
      expect(mockStatusBarItem.addClass).toHaveBeenCalledWith('obsiscribe-processing-indicator');
    });

    it('should hide processing indicator', () => {
      uiController.showProcessingIndicator();
      uiController.hideProcessingIndicator();
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('');
      expect(mockStatusBarItem.style.display).toBe('none');
      expect(mockStatusBarItem.removeClass).toHaveBeenCalledWith('obsiscribe-processing-indicator');
    });
  });

  describe('notifications', () => {
    beforeEach(async () => {
      await uiController.initialize();
    });

    it('should show error message', () => {
      uiController.showError('Test error');
      expect(Notice).toHaveBeenCalledWith('Obsiscribe Error: Test error', 5000);
    });

    it('should show success message', () => {
      uiController.showSuccess('Test success');
      expect(Notice).toHaveBeenCalledWith('Obsiscribe: Test success', 3000);
    });

    it('should show info message', () => {
      uiController.showInfo('Test info');
      expect(Notice).toHaveBeenCalledWith('Obsiscribe: Test info', 2000);
    });
  });

  describe('status bar', () => {
    beforeEach(async () => {
      await uiController.initialize();
    });

    it('should update status bar', () => {
      uiController.updateStatusBar('Test status');
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('Test status');
      expect(mockStatusBarItem.style.display).toBe('block');
    });

    it('should update status bar with duration', () => {
      jest.useFakeTimers();
      uiController.updateStatusBar('Test status', 1000);
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('Test status');
      expect(mockStatusBarItem.style.display).toBe('block');

      jest.advanceTimersByTime(1000);
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('');
      expect(mockStatusBarItem.style.display).toBe('none');
      jest.useRealTimers();
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await uiController.initialize();
    });

    it('should dispose resources', () => {
      uiController.dispose();
      expect(mockRibbonIcon.remove).toHaveBeenCalled();
      expect(mockStatusBarItem.remove).toHaveBeenCalled();
    });
  });
});
