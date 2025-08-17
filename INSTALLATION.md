# 🎤 Obsiscribe Installation Guide

**Transform your voice into text instantly with AI-powered speech recognition in Obsidian!**

## 📋 Quick Overview

Obsiscribe is a powerful Obsidian plugin that converts your speech to text using state-of-the-art AI technology. Everything runs locally on your device - no internet required, complete privacy guaranteed!

### ✨ Key Features
- 🎤 **Real-time Speech Recognition** - Click and speak, text appears instantly
- 🤖 **AI-Powered** - Uses Moonshine AI for high-accuracy transcription
- 🔒 **100% Private** - All processing happens on your device
- ⚡ **Fast & Efficient** - Transcribes 6+ seconds of speech in under 100ms
- 🎨 **Seamless Integration** - Works perfectly with Obsidian's interface
- ⚙️ **Highly Configurable** - Customize audio quality, text formatting, and more

---

## 🚀 Installation Methods

### Method 1: Manual Installation (Recommended)

#### Step 1: Download the Plugin
1. Download the latest release from [GitHub Releases](https://github.com/skkoripe/obsiscribe/releases)
2. Extract the ZIP file to get the plugin folder

#### Step 2: Install in Obsidian
1. Open Obsidian
2. Go to **Settings** → **Community Plugins**
3. Make sure **Safe Mode** is turned OFF
4. Click **Browse** next to "Installed Plugins"
5. Copy the extracted `obsiscribe` folder into your `.obsidian/plugins/` directory
6. Go back to Obsidian and click **Reload** in Community Plugins
7. Find **Obsiscribe** in the list and toggle it **ON**

#### Step 3: Verify Installation
1. Look for the 🎤 microphone icon in Obsidian's ribbon (left sidebar)
2. If you see it, congratulations! Installation successful ✅

### Method 2: Git Clone (For Developers)

```bash
# Navigate to your Obsidian plugins directory
cd /path/to/your/vault/.obsidian/plugins/

# Clone the repository
git clone https://github.com/skkoripe/obsiscribe.git

# Install dependencies and setup
cd obsiscribe
npm install  # This automatically downloads AI models and native modules
npm run build

# Enable the plugin in Obsidian Settings → Community Plugins
```

---

## 🎯 First Time Setup

### 1. Grant Microphone Permission
When you first click the microphone button, your browser will ask for microphone permission:
- Click **Allow** to enable speech recognition
- This is required for the plugin to work

### 2. Test Your Setup
1. Click the 🎤 microphone button in the ribbon
2. The button should turn red, indicating recording has started
3. Speak clearly: *"Hello, this is a test of Obsiscribe"*
4. Click the button again to stop recording
5. Your transcribed text should appear in the active note!

### 3. Configure Settings (Optional)
Go to **Settings** → **Community Plugins** → **Obsiscribe** to customize:
- **Audio Quality**: Sample rate and recording duration
- **Language**: English (default) or Spanish
- **Text Insertion**: Where and how text appears in your notes
- **UI Preferences**: Button position and notifications

---

## 🛠️ System Requirements

### Supported Platforms
- ✅ **macOS** (Intel & Apple Silicon)
- ✅ **Windows** (64-bit)
- ✅ **Linux** (64-bit)

### Minimum Requirements
- **Obsidian**: Version 0.15.0 or newer
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space for AI models
- **Microphone**: Any working microphone or headset

### Browser Compatibility
- ✅ Chromium-based (Chrome, Edge, Brave)
- ✅ Firefox
- ✅ Safari (macOS)

---

## 🎤 How to Use

### Basic Usage
1. **Start Recording**: Click the 🎤 microphone button
2. **Speak Clearly**: The button turns red while recording
3. **Stop Recording**: Click the button again
4. **Get Text**: Transcribed text appears in your active note

### Pro Tips
- 🗣️ **Speak clearly** and at normal pace for best results
- 📏 **2-6 seconds** is the optimal recording length
- 🔇 **Quiet environment** improves transcription accuracy
- 📝 **Active note** must be open for text insertion

### Keyboard Shortcuts (Coming Soon)
- `Ctrl/Cmd + Shift + M` - Toggle recording
- `Ctrl/Cmd + Shift + S` - Open settings

---

## ⚙️ Configuration Options

### Audio Settings
- **Sample Rate**: 16kHz (recommended) to 48kHz
- **Max Duration**: 1-30 seconds per recording
- **Audio Quality**: Balance between quality and performance

### Transcription Settings
- **Language**: English or Spanish
- **Auto-Punctuation**: Automatically add periods and commas
- **Auto-Capitalization**: Capitalize first words and proper nouns

### Text Insertion
- **Insert Mode**: At cursor, append to end, or prepend to beginning
- **Formatting**: Add timestamps, prefixes, or suffixes
- **Auto-Save**: Automatically save notes after transcription

---

## 🔧 Troubleshooting

### Common Issues

#### "Microphone button not visible"
- ✅ Check that the plugin is enabled in Settings → Community Plugins
- ✅ Try restarting Obsidian
- ✅ Ensure you're using a supported Obsidian version (0.15.0+)

#### "No microphone permission"
- ✅ Click "Allow" when prompted for microphone access
- ✅ Check browser settings for microphone permissions
- ✅ Try refreshing Obsidian (Ctrl/Cmd + R)

#### "Transcription not working"
- ✅ Speak clearly and at normal pace
- ✅ Ensure you have an active note open
- ✅ Check that your microphone is working in other applications
- ✅ Try adjusting audio quality settings

#### "Plugin won't load"
- ✅ Verify all plugin files are in the correct directory
- ✅ Check Obsidian console (Ctrl/Cmd + Shift + I) for error messages
- ✅ Try reinstalling the plugin
- ✅ Ensure you have sufficient disk space for AI models

### Getting Help
- 📖 Check the [FAQ section](https://github.com/skkoripe/obsiscribe/wiki/FAQ)
- 🐛 Report bugs on [GitHub Issues](https://github.com/skkoripe/obsiscribe/issues)
- 💬 Join discussions in [GitHub Discussions](https://github.com/skkoripe/obsiscribe/discussions)
- 📧 Contact: [obsiscribe@example.com](mailto:obsiscribe@example.com)

---

## 🔄 Updates

### Automatic Updates
- Obsiscribe will notify you when updates are available
- Updates include new features, bug fixes, and improved AI models

### Manual Updates
1. Download the latest version from GitHub Releases
2. Replace the old plugin folder with the new one
3. Restart Obsidian to apply changes

---

## 🔒 Privacy & Security

### Your Data Stays Private
- ✅ **No internet required** - All processing happens locally
- ✅ **No data collection** - We never see or store your recordings
- ✅ **No cloud services** - Your voice never leaves your device
- ✅ **Open source** - Full transparency in our code

### Permissions Explained
- **Microphone Access**: Required to record your voice for transcription
- **File System**: Required to save transcribed text to your notes
- **No Network Access**: Plugin works completely offline

---

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Help
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 🔧 Submit code improvements
- 📖 Improve documentation
- 🌍 Help with translations

---

## 📄 License

Obsiscribe is released under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Moonshine AI** - For the incredible speech recognition model
- **Sherpa ONNX** - For the efficient AI runtime
- **Obsidian Team** - For the amazing note-taking platform
- **Contributors** - Everyone who helped make this plugin better

---

**Ready to transform your voice into text? Install Obsiscribe now and experience the future of note-taking! 🎤→📝**
