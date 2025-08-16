import { Plugin, Notice } from 'obsidian';

/**
 * UIController class manages user interface elements
 * Handles recording button, status indicators, and user feedback
 */
export class UIController {
  private recordingButton: HTMLElement | null = null;
  private statusBarItem: HTMLElement | null = null;
  private recordingIndicator: HTMLElement | null = null;
  private isRecording = false;

  constructor(private plugin: Plugin) {}

  /**
   * Initialize the UI controller
   */
  async initialize(): Promise<void> {
    this.createRecordingButton();
    this.createStatusBarItem();
    console.log('UIController initialized');
  }

  /**
   * Create the recording button in the ribbon
   */
  private createRecordingButton(): void {
    this.recordingButton = this.plugin.addRibbonIcon(
      'microphone',
      'Start/Stop Speech Recording',
      async (evt: MouseEvent) => {
        await this.handleRecordingButtonClick();
      }
    );

    this.recordingButton.addClass('obsiscribe-recording-button');
  }

  /**
   * Create status bar item
   */
  private createStatusBarItem(): void {
    this.statusBarItem = this.plugin.addStatusBarItem();
    this.statusBarItem.setText('');
    this.statusBarItem.addClass('obsiscribe-status-bar');
    this.statusBarItem.style.display = 'none';
  }

  /**
   * Handle recording button click
   */
  private async handleRecordingButtonClick(): Promise<void> {
    try {
      if (this.isRecording) {
        // Stop recording
        await this.stopRecording();
      } else {
        // Start recording
        await this.startRecording();
      }
    } catch (error) {
      console.error('Error handling recording button click:', error);
      this.showError('Failed to toggle recording: ' + (error as Error).message);
    }
  }

  /**
   * Start recording (to be called by main plugin)
   */
  async startRecording(): Promise<void> {
    // This will be called by the main plugin class
    // For now, just update UI state
    this.isRecording = true;
    this.updateRecordingButtonState();
    console.log('UIController: Recording started');
  }

  /**
   * Stop recording (to be called by main plugin)
   */
  async stopRecording(): Promise<void> {
    // This will be called by the main plugin class
    // For now, just update UI state
    this.isRecording = false;
    this.updateRecordingButtonState();
    console.log('UIController: Recording stopped');
  }

  /**
   * Update recording button visual state
   */
  private updateRecordingButtonState(): void {
    if (this.recordingButton) {
      if (this.isRecording) {
        this.recordingButton.addClass('obsiscribe-recording-active');
        this.recordingButton.setAttribute('aria-label', 'Stop Speech Recording');
      } else {
        this.recordingButton.removeClass('obsiscribe-recording-active');
        this.recordingButton.setAttribute('aria-label', 'Start Speech Recording');
      }
    }
  }

  /**
   * Show recording indicator
   */
  showRecordingIndicator(): void {
    if (this.statusBarItem) {
      this.statusBarItem.setText('🎤 Recording...');
      this.statusBarItem.style.display = 'block';
      this.statusBarItem.addClass('obsiscribe-recording-indicator');
    }

    // Create floating recording indicator
    this.createFloatingIndicator();
  }

  /**
   * Hide recording indicator
   */
  hideRecordingIndicator(): void {
    if (this.statusBarItem) {
      this.statusBarItem.setText('');
      this.statusBarItem.style.display = 'none';
      this.statusBarItem.removeClass('obsiscribe-recording-indicator');
    }

    this.removeFloatingIndicator();
  }

  /**
   * Show processing indicator
   */
  showProcessingIndicator(): void {
    if (this.statusBarItem) {
      this.statusBarItem.setText('⚡ Processing...');
      this.statusBarItem.style.display = 'block';
      this.statusBarItem.addClass('obsiscribe-processing-indicator');
    }

    new Notice('Processing speech...', 2000);
  }

  /**
   * Hide processing indicator
   */
  hideProcessingIndicator(): void {
    if (this.statusBarItem) {
      this.statusBarItem.setText('');
      this.statusBarItem.style.display = 'none';
      this.statusBarItem.removeClass('obsiscribe-processing-indicator');
    }
  }

  /**
   * Create floating recording indicator
   */
  private createFloatingIndicator(): void {
    if (this.recordingIndicator) {
      return; // Already exists
    }

    this.recordingIndicator = document.createElement('div');
    this.recordingIndicator.className = 'obsiscribe-floating-indicator';
    this.recordingIndicator.innerHTML = '🎤 Recording...';
    
    // Style the indicator
    Object.assign(this.recordingIndicator.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: 'var(--background-modifier-error)',
      color: 'var(--text-on-accent)',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: 'bold',
      zIndex: '1000',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      animation: 'pulse 1.5s infinite'
    });

    document.body.appendChild(this.recordingIndicator);
  }

  /**
   * Remove floating recording indicator
   */
  private removeFloatingIndicator(): void {
    if (this.recordingIndicator) {
      this.recordingIndicator.remove();
      this.recordingIndicator = null;
    }
  }

  /**
   * Show error message to user
   */
  showError(message: string): void {
    new Notice(`Obsiscribe Error: ${message}`, 5000);
    console.error('Obsiscribe Error:', message);
  }

  /**
   * Show success message to user
   */
  showSuccess(message: string): void {
    new Notice(`Obsiscribe: ${message}`, 3000);
    console.log('Obsiscribe Success:', message);
  }

  /**
   * Show info message to user
   */
  showInfo(message: string): void {
    new Notice(`Obsiscribe: ${message}`, 2000);
    console.log('Obsiscribe Info:', message);
  }

  /**
   * Update status bar with custom message
   */
  updateStatusBar(message: string, duration?: number): void {
    if (this.statusBarItem) {
      this.statusBarItem.setText(message);
      this.statusBarItem.style.display = 'block';

      if (duration) {
        setTimeout(() => {
          if (this.statusBarItem) {
            this.statusBarItem.setText('');
            this.statusBarItem.style.display = 'none';
          }
        }, duration);
      }
    }
  }

  /**
   * Get current recording state
   */
  getRecordingState(): boolean {
    return this.isRecording;
  }

  /**
   * Set recording state (for external control)
   */
  setRecordingState(recording: boolean): void {
    this.isRecording = recording;
    this.updateRecordingButtonState();
    
    if (recording) {
      this.showRecordingIndicator();
    } else {
      this.hideRecordingIndicator();
    }
  }

  /**
   * Add custom CSS styles
   */
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .obsiscribe-recording-button.obsiscribe-recording-active {
        color: var(--text-error) !important;
        background-color: var(--background-modifier-error-hover) !important;
      }
      
      .obsiscribe-recording-indicator {
        color: var(--text-error) !important;
        font-weight: bold;
      }
      
      .obsiscribe-processing-indicator {
        color: var(--text-accent) !important;
        font-weight: bold;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      .obsiscribe-floating-indicator {
        animation: pulse 1.5s infinite;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.removeFloatingIndicator();
    
    if (this.recordingButton) {
      this.recordingButton.remove();
      this.recordingButton = null;
    }
    
    if (this.statusBarItem) {
      this.statusBarItem.remove();
      this.statusBarItem = null;
    }
    
    console.log('UIController disposed');
  }
}
