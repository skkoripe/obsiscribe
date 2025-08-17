# 🎤 Obsiscribe Plugin - Obsidian Installation Guide

## Quick Installation for Testing

### Step 1: Locate Your Obsidian Plugins Folder

1. Open Obsidian
2. Go to **Settings** → **Community plugins**
3. Click **"Open plugins folder"** (this opens your vault's `.obsidian/plugins/` directory)

### Step 2: Install the Plugin

1. In the plugins folder, create a new folder called `obsiscribe`
2. Copy these files from this project into the `obsiscribe` folder:
   - `main.js` (the compiled plugin)
   - `manifest.json` (plugin metadata)
   - `sherpa-onnx-moonshine-tiny-en-int8/` (entire model directory)
   - `native-modules/` (entire native modules directory)

Your folder structure should look like:
```
.obsidian/plugins/obsiscribe/
├── main.js
├── manifest.json
├── sherpa-onnx-moonshine-tiny-en-int8/
│   ├── preprocess.onnx
│   ├── encode.int8.onnx
│   ├── uncached_decode.int8.onnx
│   ├── cached_decode.int8.onnx
│   ├── tokens.txt
│   └── test_wavs/
└── native-modules/
    ├── sherpa-onnx-node/
    │   ├── sherpa-onnx.js
    │   ├── non-streaming-asr.js
    │   ├── addon.js
    │   └── package.json
    └── sherpa-onnx-darwin-arm64/
        ├── sherpa-onnx.node
        ├── libsherpa-onnx-c-api.dylib
        ├── libsherpa-onnx-cxx-api.dylib
        ├── libonnxruntime.dylib
        └── libonnxruntime.1.17.1.dylib
```

### Step 3: Enable the Plugin

1. Restart Obsidian (or reload with Ctrl/Cmd + R)
2. Go to **Settings** → **Community plugins**
3. Find "Obsiscribe" in the list and toggle it **ON**
4. You should see a microphone icon (🎤) appear in the ribbon (left sidebar)

### Step 4: Test the Plugin

1. **Click the microphone button** in the ribbon
2. **Grant microphone permissions** when prompted
3. **Speak into your microphone**
4. **Click the button again** to stop recording
5. **Check your active note** - transcribed text should appear!

## Expected Behavior

### ✅ What Should Work:
- **Microphone button appears** in the ribbon
- **Button changes color** when recording (visual feedback)
- **Microphone permission** request appears
- **Text insertion** into active note after recording
- **Settings panel** accessible via Settings → Plugin options → Obsiscribe

### ⚠️ Troubleshooting:

#### Plugin Won't Load
- Check browser console (F12) for error messages
- Ensure all files are in the correct location
- Try restarting Obsidian

#### No Microphone Button
- Plugin may not be enabled - check Community plugins settings
- Check for JavaScript errors in console

#### Transcription Not Working
- Ensure microphone permissions are granted
- Check that Sherpa ONNX model files are present
- Look for error messages in console

#### No Text Appears
- Make sure you have an active note open
- Check that you spoke clearly and loud enough
- Verify the recording actually captured audio

## Performance Notes

- **First transcription** may take a moment as the model loads
- **Subsequent transcriptions** should be faster
- **Model size**: ~102MB (loaded once, cached in memory)
- **Processing speed**: ~19ms per second of audio

## Settings

Access plugin settings via **Settings → Plugin options → Obsiscribe**:

- **Audio quality settings** (sample rate, duration limits)
- **Transcription options** (language, punctuation)
- **Text insertion preferences** (timestamps, formatting)
- **UI customization** (button position, indicators)

## Development Testing

If you're testing during development:

1. **Make changes** to the source code
2. **Run build**: `npm run build` (or `npx tsc -noEmit -skipLibCheck && node esbuild.config.mjs production`)
3. **Copy new main.js** to your Obsidian plugins folder
4. **Reload Obsidian** (Ctrl/Cmd + R)
5. **Test the changes**

## System Requirements

- **Obsidian**: Latest version recommended
- **Operating System**: macOS, Windows, or Linux
- **Microphone**: Any system microphone
- **Node.js**: Not required for end users (only for development)

## Support

If you encounter issues:

1. **Check the console** (F12 in Obsidian) for error messages
2. **Verify file structure** matches the guide above
3. **Test microphone** in other applications first
4. **Try different audio settings** in the plugin settings

---

**Ready to test your speech-to-text plugin in Obsidian!** 🚀
