# Obsidian Integration Test Guide

## Phase 4: Obsidian Integration Testing

This guide helps you test the Obsiscribe plugin with your Obsidian installation to verify the TextInserter functionality works correctly with the Obsidian API.

## Prerequisites

- Obsidian installed on your system
- Plugin built successfully (`npm run build` completed)
- `main.js` and `manifest.json` files present in project root

## Integration Steps

### 1. Locate Obsidian Plugins Directory

**macOS:**
```
~/Library/Application Support/obsidian/plugins/
```

**Windows:**
```
%APPDATA%\obsidian\plugins\
```

**Linux:**
```
~/.config/obsidian/plugins/
```

### 2. Create Plugin Directory

Create a new directory called `obsiscribe` in your plugins folder:
```bash
mkdir ~/Library/Application\ Support/obsidian/plugins/obsiscribe
```

### 3. Copy Plugin Files

Copy these files from your project to the plugin directory:
- `main.js` (the built plugin)
- `manifest.json` (plugin metadata)

```bash
# From your project directory
cp main.js ~/Library/Application\ Support/obsidian/plugins/obsiscribe/
cp manifest.json ~/Library/Application\ Support/obsidian/plugins/obsiscribe/
```

### 4. Enable Plugin in Obsidian

1. Open Obsidian
2. Go to **Settings** → **Community plugins**
3. Make sure **Safe mode** is OFF
4. Look for **Obsiscribe** in the installed plugins list
5. Toggle it ON

### 5. Test Basic Functionality

#### Plugin Loading Test
- Check if plugin loads without errors
- Look for any error messages in Developer Console (Ctrl/Cmd + Shift + I)

#### Settings Panel Test
- Go to **Settings** → **Plugin Options** → **Obsiscribe**
- Verify the settings panel loads
- Check all setting categories:
  - Audio Settings
  - Transcription Settings
  - User Interface
  - Text Insertion
  - Advanced Settings

#### Console Check
Open Developer Console and look for:
- ✅ "Loading Obsiscribe plugin..."
- ✅ "SettingsManager initialized"
- ✅ "SpeechToTextPlugin initialized successfully"
- ✅ "Obsiscribe plugin loaded successfully"

❌ No error messages should appear

## Expected Results

### ✅ Success Indicators
- Plugin appears in Community plugins list
- Plugin can be enabled/disabled
- Settings panel loads completely
- All setting sections are visible
- No console errors
- Plugin loads/unloads cleanly

### ❌ Potential Issues
- Plugin doesn't appear → Check file copying
- Settings panel blank → Check console for errors
- Console errors → Check TypeScript compilation
- Plugin won't enable → Check manifest.json format

## Troubleshooting

### Plugin Not Appearing
1. Verify files are in correct directory
2. Check manifest.json is valid JSON
3. Restart Obsidian

### Settings Panel Issues
1. Check browser console for errors
2. Verify all dependencies loaded
3. Check TypeScript compilation

### Console Errors
1. Look for specific error messages
2. Check if all classes are properly imported
3. Verify Obsidian API compatibility

## TextInserter Integration Testing

To test the TextInserter integration with the Obsidian API, follow these steps:

1. Open a note in Obsidian
2. Open the Developer Console (Ctrl/Cmd + Shift + I)
3. Run the following commands:

```javascript
// Get the plugin instance
const plugin = app.plugins.plugins.obsiscribe;

// Access the SpeechToTextPlugin instance
const speechToTextPlugin = plugin.speechToTextPlugin;

// Access the TextInserter instance
const textInserter = speechToTextPlugin.textInserter;

// Test insertion at cursor position
textInserter.insertText("Test text inserted at cursor", "cursor");

// Test appending to the end of the note
textInserter.insertText("Test text appended to note", "append");

// Test prepending to the beginning of the note
textInserter.insertText("Test text prepended to note", "prepend");

// Test with formatting options
textInserter.insertText("Formatted text", "cursor", {
  prefix: "**",
  suffix: "**",
  addTimestamp: true
});
```

## Test Results Template

After testing, document your results:

```
## Integration Test Results

**Date:** [Date]
**Obsidian Version:** [Version]
**Plugin Status:** [Success/Failed]

### TextInserter Integration
- [ ] Plugin instance accessible via app.plugins.plugins.obsiscribe
- [ ] SpeechToTextPlugin instance accessible via plugin.speechToTextPlugin
- [ ] TextInserter instance accessible via speechToTextPlugin.textInserter
- [ ] Text insertion at cursor position works
- [ ] Text appending to end of note works
- [ ] Text prepending to beginning of note works
- [ ] Formatting options work (prefix, suffix, timestamp)

### Console Messages
- [ ] Text insertion success messages appear
- [ ] No error messages

### Issues Found
[List any issues encountered]

### Next Steps
[Ready for Phase 5 / Issues to resolve]
```

## Next Steps

If integration test is successful:
- ✅ **Proceed to Phase 5**: User Interface Implementation
- ✅ **TextInserter Validated**: Functionality works with Obsidian
- ✅ **Integration Confirmed**: Plugin can interact with Obsidian notes

If issues are found:
- 🔧 **Debug and Fix**: Resolve integration issues
- 🔄 **Retest**: Verify fixes work
- ➡️ **Then Proceed**: Move to Phase 5 once stable

---

**Note**: This integration test focuses specifically on the TextInserter functionality. The full plugin with speech-to-text capabilities will be tested in later phases.
