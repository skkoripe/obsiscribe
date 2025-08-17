import { Plugin } from 'obsidian';
import { SpeechToTextPlugin } from './classes/SpeechToTextPlugin';

// This is the main entry point for the Obsidian plugin
export default class ObsiscribePlugin extends Plugin {
  public speechToTextPlugin!: SpeechToTextPlugin;

  async onload() {
    try {
      console.log('🚀 Loading Obsiscribe plugin...');
      console.log('Plugin manifest:', this.manifest);
      console.log('Plugin app:', this.app);
      
      // Initialize the main plugin class
      console.log('📝 Creating SpeechToTextPlugin instance...');
      this.speechToTextPlugin = new SpeechToTextPlugin(this);
      
      console.log('⚙️ Initializing SpeechToTextPlugin...');
      await this.speechToTextPlugin.initialize();
      
      console.log('✅ Obsiscribe plugin loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load Obsiscribe plugin:', error);
      console.error('Error stack:', (error as Error).stack);
      
      // Show user-friendly error in console since we can't access showErrorDialog
      console.error('🚨 OBSISCRIBE PLUGIN FAILED TO LOAD:', (error as Error).message);
    }
  }

  async onunload() {
    try {
      console.log('🔄 Unloading Obsiscribe plugin...');
      
      if (this.speechToTextPlugin) {
        console.log('🧹 Cleaning up SpeechToTextPlugin...');
        await this.speechToTextPlugin.cleanup();
      }
      
      console.log('✅ Obsiscribe plugin unloaded successfully');
    } catch (error) {
      console.error('❌ Error during plugin unload:', error);
    }
  }
}
