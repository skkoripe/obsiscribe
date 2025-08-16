import { Plugin, Editor, MarkdownView } from 'obsidian';

/**
 * TextInserter class handles inserting transcribed text into Obsidian notes
 * Manages cursor positioning and text formatting
 */
export class TextInserter {
  constructor(private plugin: Plugin) {}

  /**
   * Initialize the text inserter
   */
  async initialize(): Promise<void> {
    console.log('TextInserter initialized');
  }

  /**
   * Insert text into the active note
   */
  async insertText(
    text: string,
    mode: 'cursor' | 'append' | 'prepend',
    options: {
      prefix?: string;
      suffix?: string;
      addTimestamp?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      
      if (!activeView) {
        throw new Error('No active markdown view found');
      }

      const editor = activeView.editor;
      let finalText = text;

      // Add prefix and suffix if specified
      if (options.prefix) {
        finalText = options.prefix + finalText;
      }
      
      if (options.suffix) {
        finalText = finalText + options.suffix;
      }

      // Add timestamp if requested
      if (options.addTimestamp) {
        const timestamp = new Date().toLocaleString();
        finalText = `[${timestamp}] ${finalText}`;
      }

      // Insert text based on mode
      switch (mode) {
        case 'cursor':
          await this.insertAtCursor(editor, finalText);
          break;
        case 'append':
          await this.appendToNote(editor, finalText);
          break;
        case 'prepend':
          await this.prependToNote(editor, finalText);
          break;
        default:
          throw new Error(`Unknown insertion mode: ${mode}`);
      }

      console.log('Text inserted successfully:', finalText);
    } catch (error) {
      console.error('Failed to insert text:', error);
      throw error;
    }
  }

  /**
   * Insert text at the current cursor position
   */
  private async insertAtCursor(editor: Editor, text: string): Promise<void> {
    const cursor = editor.getCursor();
    editor.replaceRange(text, cursor);
    
    // Move cursor to end of inserted text
    const newCursor = {
      line: cursor.line,
      ch: cursor.ch + text.length
    };
    editor.setCursor(newCursor);
  }

  /**
   * Append text to the end of the note
   */
  private async appendToNote(editor: Editor, text: string): Promise<void> {
    const lastLine = editor.lastLine();
    const lastLineLength = editor.getLine(lastLine).length;
    
    const insertPosition = {
      line: lastLine,
      ch: lastLineLength
    };
    
    // Add newline if the last line is not empty
    const textToInsert = lastLineLength > 0 ? '\n' + text : text;
    
    editor.replaceRange(textToInsert, insertPosition);
    
    // Move cursor to end of inserted text
    const newCursor = {
      line: lastLine + (lastLineLength > 0 ? 1 : 0),
      ch: text.length
    };
    editor.setCursor(newCursor);
  }

  /**
   * Prepend text to the beginning of the note
   */
  private async prependToNote(editor: Editor, text: string): Promise<void> {
    const insertPosition = { line: 0, ch: 0 };
    const textToInsert = text + '\n';
    
    editor.replaceRange(textToInsert, insertPosition);
    
    // Move cursor to end of inserted text
    const newCursor = {
      line: 0,
      ch: text.length
    };
    editor.setCursor(newCursor);
  }

  /**
   * Get the currently active editor
   */
  private getActiveEditor(): Editor | null {
    const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    return activeView ? activeView.editor : null;
  }

  /**
   * Check if there's an active note that can be edited
   */
  canInsertText(): boolean {
    const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    return activeView !== null;
  }

  /**
   * Get information about the current note
   */
  getCurrentNoteInfo(): {
    hasActiveNote: boolean;
    noteName?: string;
    cursorPosition?: { line: number; ch: number };
    totalLines?: number;
  } {
    const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    
    if (!activeView) {
      return { hasActiveNote: false };
    }

    const editor = activeView.editor;
    const file = activeView.file;
    
    return {
      hasActiveNote: true,
      noteName: file?.name,
      cursorPosition: editor.getCursor(),
      totalLines: editor.lineCount()
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    console.log('TextInserter disposed');
  }
}
