import { TextInserter } from '../../src/classes/TextInserter';
import { Editor, MarkdownView, Plugin } from 'obsidian';

// Mock Obsidian Plugin, MarkdownView, and Editor
describe('TextInserter', () => {
  let textInserter: TextInserter;
  let mockPlugin: Plugin;
  let mockMarkdownView: MarkdownView;
  let mockEditor: Editor;
  let mockWorkspace: any;
  let mockFile: any;

  beforeEach(() => {
    // Create mock file
    mockFile = {
      name: 'test-note.md'
    };

    // Create mock editor with required methods
    mockEditor = {
      getCursor: jest.fn().mockReturnValue({ line: 5, ch: 10 }),
      setCursor: jest.fn(),
      replaceRange: jest.fn(),
      getLine: jest.fn().mockReturnValue('This is a test line'),
      lastLine: jest.fn().mockReturnValue(10),
      lineCount: jest.fn().mockReturnValue(11),
      // Add additional required methods with empty implementations
      getDoc: jest.fn(),
      refresh: jest.fn(),
      getValue: jest.fn(),
      setValue: jest.fn()
    } as unknown as Editor;

    // Create mock markdown view
    mockMarkdownView = {
      editor: mockEditor,
      file: mockFile
    } as unknown as MarkdownView;

    // Create mock workspace
    mockWorkspace = {
      getActiveViewOfType: jest.fn().mockReturnValue(mockMarkdownView)
    };

    // Create mock plugin
    mockPlugin = {
      app: {
        workspace: mockWorkspace
      }
    } as unknown as Plugin;

    // Create TextInserter instance
    textInserter = new TextInserter(mockPlugin);
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      await expect(textInserter.initialize()).resolves.not.toThrow();
    });
  });

  describe('insertText', () => {
    it('should insert text at cursor position', async () => {
      const text = 'Hello, world!';
      await textInserter.insertText(text, 'cursor');
      
      expect(mockWorkspace.getActiveViewOfType).toHaveBeenCalledWith(MarkdownView);
      expect(mockEditor.getCursor).toHaveBeenCalled();
      expect(mockEditor.replaceRange).toHaveBeenCalledWith(text, { line: 5, ch: 10 });
      expect(mockEditor.setCursor).toHaveBeenCalledWith({ line: 5, ch: 10 + text.length });
    });

    it('should append text to the end of the note', async () => {
      const text = 'Appended text';
      await textInserter.insertText(text, 'append');
      
      expect(mockEditor.lastLine).toHaveBeenCalled();
      expect(mockEditor.getLine).toHaveBeenCalledWith(10);
      expect(mockEditor.replaceRange).toHaveBeenCalledWith('\nAppended text', { line: 10, ch: 'This is a test line'.length });
      expect(mockEditor.setCursor).toHaveBeenCalled();
    });

    it('should prepend text to the beginning of the note', async () => {
      const text = 'Prepended text';
      await textInserter.insertText(text, 'prepend');
      
      expect(mockEditor.replaceRange).toHaveBeenCalledWith('Prepended text\n', { line: 0, ch: 0 });
      expect(mockEditor.setCursor).toHaveBeenCalledWith({ line: 0, ch: text.length });
    });

    it('should add prefix and suffix to text', async () => {
      const text = 'Main text';
      const options = {
        prefix: '**',
        suffix: '**'
      };
      
      await textInserter.insertText(text, 'cursor', options);
      
      expect(mockEditor.replaceRange).toHaveBeenCalledWith('**Main text**', { line: 5, ch: 10 });
    });

    it('should add timestamp when requested', async () => {
      const text = 'Timestamped text';
      const options = {
        addTimestamp: true
      };
      
      // Mock Date.toLocaleString
      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('2025-08-17 11:30:00');
      
      await textInserter.insertText(text, 'cursor', options);
      
      expect(mockEditor.replaceRange).toHaveBeenCalledWith('[2025-08-17 11:30:00] Timestamped text', { line: 5, ch: 10 });
      
      // Restore original method
      Date.prototype.toLocaleString = originalToLocaleString;
    });

    it('should throw error when no active markdown view', async () => {
      // Mock no active view
      mockWorkspace.getActiveViewOfType.mockReturnValue(null);
      
      await expect(textInserter.insertText('Test', 'cursor'))
        .rejects
        .toThrow('No active markdown view found');
    });

    it('should throw error for unknown insertion mode', async () => {
      // @ts-ignore - Testing invalid mode
      await expect(textInserter.insertText('Test', 'invalid-mode'))
        .rejects
        .toThrow('Unknown insertion mode: invalid-mode');
    });
  });

  describe('utility methods', () => {
    it('should check if text can be inserted', () => {
      expect(textInserter.canInsertText()).toBe(true);
      
      // Mock no active view
      mockWorkspace.getActiveViewOfType.mockReturnValue(null);
      
      expect(textInserter.canInsertText()).toBe(false);
    });

    it('should get current note info', () => {
      const info = textInserter.getCurrentNoteInfo();
      
      expect(info.hasActiveNote).toBe(true);
      expect(info.noteName).toBe('test-note.md');
      expect(info.cursorPosition).toEqual({ line: 5, ch: 10 });
      expect(info.totalLines).toBe(11);
      
      // Mock no active view
      mockWorkspace.getActiveViewOfType.mockReturnValue(null);
      
      const emptyInfo = textInserter.getCurrentNoteInfo();
      expect(emptyInfo.hasActiveNote).toBe(false);
      expect(emptyInfo.noteName).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('should dispose resources without errors', () => {
      expect(() => textInserter.dispose()).not.toThrow();
    });
  });
});
