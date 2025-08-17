import { Plugin } from 'obsidian';
import { SpeechToTextPlugin } from './classes/SpeechToTextPlugin';

// This is the main entry point for the Obsidian plugin
export default class ObsiscribePlugin extends Plugin {
  public speechToTextPlugin!: SpeechToTextPlugin;

  async onload() {
    console.log('Loading Obsiscribe plugin...');
    
    // Initialize the main plugin class
    this.speechToTextPlugin = new SpeechToTextPlugin(this);
    await this.speechToTextPlugin.initialize();
    
    console.log('Obsiscribe plugin loaded successfully');
  }

  async onunload() {
    console.log('Unloading Obsiscribe plugin...');
    
    if (this.speechToTextPlugin) {
      await this.speechToTextPlugin.cleanup();
    }
    
    console.log('Obsiscribe plugin unloaded');
  }
}
