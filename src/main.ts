import { Plugin } from 'obsidian';
import { SpeechToTextPlugin } from './classes/SpeechToTextPlugin';

// This is the main entry point for the Obsidian plugin
export default class ObsiscribePlugin extends Plugin {
  public speechToTextPlugin!: SpeechToTextPlugin;

  async onload() {
    try {
      console.log('Loading Obsiscribe plugin...');
      
      // Initialize the main plugin class
      this.speechToTextPlugin = new SpeechToTextPlugin(this);
      await this.speechToTextPlugin.initialize();
      
      console.log('Obsiscribe plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Obsiscribe plugin:', error);
      console.error('Error details:', (error as Error).message);
    }
  }

  async onunload() {
    try {
      console.log('Unloading Obsiscribe plugin...');
      
      if (this.speechToTextPlugin) {
        await this.speechToTextPlugin.cleanup();
      }
      
      console.log('Obsiscribe plugin unloaded successfully');
    } catch (error) {
      console.error('Error during plugin unload:', error);
    }
  }
}
