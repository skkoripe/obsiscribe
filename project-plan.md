# Obsidian Speech-to-Text Extension Project Plan

## Project Overview
Build an Obsidian plugin that converts speech from microphone to text using Moonshine AI for local/edge processing, following OOP principles for clean, shareable code.

## Key Requirements
- Convert speech from microphone to text
- Save transcribed text within Obsidian
- Use Moonshine AI (https://github.com/moonshine-ai/moonshine) for local processing
- No external API calls - runs natively on system
- Follow OOP principles for clean, maintainable code
- Shareable extension for other users
- **Testing at every phase is mandatory**

## Technology Stack
- **Frontend**: TypeScript/JavaScript (Obsidian Plugin API)
- **Speech Recognition**: Moonshine AI (local processing)
- **Build Tool**: Rollup/esbuild (standard for Obsidian plugins)
- **Package Manager**: npm/yarn
- **Runtime**: Node.js for development, Electron for Obsidian
- **Testing**: Jest for unit tests, Obsidian test environment for integration tests

## Architecture Design (OOP Structure)

### Core Classes

#### 1. `SpeechToTextPlugin` (Main Plugin Class)
- Extends Obsidian's `Plugin` class
- Manages plugin lifecycle (onload, onunload)
- Coordinates between different components
- Handles plugin settings and configuration

#### 2. `AudioRecorder` (Audio Management)
- Manages microphone access and permissions
- Handles audio recording start/stop
- Audio stream processing and formatting
- Error handling for audio-related issues

#### 3. `MoonshineTranscriber` (Transcription Engine)
- Interfaces with Moonshine AI model
- Handles model loading and initialization
- Processes audio data for transcription
- Returns transcribed text

#### 4. `TextInserter` (Obsidian Integration)
- Handles text insertion into active note
- Manages cursor positioning
- Formats transcribed text appropriately
- Handles different insertion modes (append, insert at cursor, etc.)

#### 5. `SettingsManager` (Configuration)
- Manages plugin settings and preferences
- Handles settings UI
- Stores user preferences (model selection, audio quality, etc.)
- Validates configuration options

#### 6. `UIController` (User Interface)
- Manages recording button/ribbon icon
- Shows recording status indicators
- Handles user interactions
- Displays error messages and notifications

## Project Structure
```
obsiscribe/
├── src/
│   ├── main.ts                 # Plugin entry point
│   ├── classes/
│   │   ├── SpeechToTextPlugin.ts
│   │   ├── AudioRecorder.ts
│   │   ├── MoonshineTranscriber.ts
│   │   ├── TextInserter.ts
│   │   ├── SettingsManager.ts
│   │   └── UIController.ts
│   ├── interfaces/
│   │   ├── ITranscriber.ts
│   │   ├── IAudioRecorder.ts
│   │   └── ISettings.ts
│   ├── utils/
│   │   ├── audioUtils.ts
│   │   ├── fileUtils.ts
│   │   └── constants.ts
│   └── styles/
│       └── styles.css
├── tests/
│   ├── unit/
│   │   ├── AudioRecorder.test.ts
│   │   ├── MoonshineTranscriber.test.ts
│   │   ├── TextInserter.test.ts
│   │   ├── SettingsManager.test.ts
│   │   └── UIController.test.ts
│   ├── integration/
│   │   ├── plugin-lifecycle.test.ts
│   │   ├── audio-to-text-flow.test.ts
│   │   └── obsidian-integration.test.ts
│   └── test-utils/
│       ├── mockObsidian.ts
│       ├── mockAudio.ts
│       └── testHelpers.ts
├── manifest.json
├── package.json
├── tsconfig.json
├── jest.config.js
├── rollup.config.js
├── README.md
└── versions.json
```

## Implementation Phases with Testing

### Phase 1: Project Setup & Basic Structure ✅ IN PROGRESS
**Implementation:**
1. ✅ Initialize Obsidian plugin project structure
2. ✅ Set up TypeScript configuration
3. ✅ Create basic plugin manifest and package.json
4. ✅ Set up build system (esbuild)
5. ✅ Create core class skeletons (6/6 completed)
   - ✅ ISettings interface
   - ✅ IAudioRecorder interface  
   - ✅ ITranscriber interface
   - ✅ main.ts entry point
   - ✅ SpeechToTextPlugin class skeleton
   - ✅ AudioRecorder class skeleton
   - ✅ MoonshineTranscriber class skeleton
   - ✅ TextInserter class skeleton
   - ✅ SettingsManager class skeleton
   - ✅ UIController class skeleton
6. ✅ Set up Jest testing framework

**Testing Phase 1:**
- ✅ Test build system compilation
- ✅ Test TypeScript configuration
- ⏳ Test basic plugin loading in Obsidian (requires Obsidian dev environment)
- ✅ Verify all class skeletons are properly structured
- ✅ Test Jest setup and basic test execution

**Current Status:** ✅ PHASE 1 COMPLETE
- ✅ Project structure is set up
- ✅ Configuration files are complete (package.json, tsconfig.json, jest.config.js, esbuild.config.mjs, manifest.json)
- ✅ All 3 interfaces created (ISettings, IAudioRecorder, ITranscriber)
- ✅ All 6 classes created:
  - ✅ main.ts (entry point)
  - ✅ SpeechToTextPlugin (main coordinator)
  - ✅ AudioRecorder (audio management)
  - ✅ MoonshineTranscriber (transcription engine)
  - ✅ TextInserter (Obsidian integration)
  - ✅ SettingsManager (configuration)
  - ✅ UIController (user interface)
- ✅ Dependencies installed and working
- ✅ Build system compiles successfully
- ✅ Jest testing framework set up and working
- ✅ Basic unit tests created and passing (12/12 tests pass)

**Phase 1 Results:**
- Clean OOP architecture with proper separation of concerns
- All TypeScript compilation errors resolved
- Comprehensive test setup with Jest and jsdom
- Ready for Phase 2 implementation

**Ready for Phase 2:** Audio Recording Implementation

### Phase 2: Audio Recording Implementation
**Implementation:**
1. Implement `AudioRecorder` class
2. Handle microphone permissions
3. Implement audio capture and processing
4. Add error handling for audio issues

**Testing Phase 2:**
- [ ] Unit tests for `AudioRecorder` class methods
- [ ] Test microphone permission handling
- [ ] Test audio capture start/stop functionality
- [ ] Test audio format and quality settings
- [ ] Test error scenarios (no microphone, permission denied)
- [ ] Integration test with browser audio APIs
- [ ] Manual testing across different browsers/OS

### Phase 3: Moonshine AI Integration
**Implementation:**
1. Research and integrate Moonshine AI
2. Implement `MoonshineTranscriber` class
3. Handle model loading and initialization
4. Process audio data for transcription

**Testing Phase 3:**
- [ ] Unit tests for `MoonshineTranscriber` class
- [ ] Test model loading and initialization
- [ ] Test transcription accuracy with sample audio
- [ ] Test performance with different audio lengths
- [ ] Test error handling (model load failure, transcription errors)
- [ ] Integration test with `AudioRecorder`
- [ ] Benchmark transcription speed and accuracy

### Phase 4: Obsidian Integration
**Implementation:**
1. Implement `TextInserter` class
2. Handle text insertion into active notes
3. Manage cursor positioning and formatting
4. Test integration with Obsidian editor

**Testing Phase 4:**
- [ ] Unit tests for `TextInserter` class
- [ ] Test text insertion at cursor position
- [ ] Test text appending to notes
- [ ] Test formatting preservation
- [ ] Test with different note types (markdown, canvas)
- [ ] Integration test with Obsidian API
- [ ] Test edge cases (no active note, read-only notes)

### Phase 5: User Interface
**Implementation:**
1. Implement `UIController` class
2. Add recording button/ribbon icon
3. Show recording status indicators
4. Handle user interactions and feedback

**Testing Phase 5:**
- [ ] Unit tests for `UIController` class
- [ ] Test button/icon rendering
- [ ] Test recording status indicators
- [ ] Test user interaction handling
- [ ] Test accessibility features
- [ ] Visual regression testing
- [ ] User experience testing

### Phase 6: Settings & Configuration
**Implementation:**
1. Implement `SettingsManager` class
2. Create settings UI panel
3. Handle user preferences storage
4. Add configuration validation

**Testing Phase 6:**
- [ ] Unit tests for `SettingsManager` class
- [ ] Test settings persistence
- [ ] Test settings validation
- [ ] Test settings UI functionality
- [ ] Test default settings behavior
- [ ] Integration test with other components
- [ ] Test settings migration scenarios

### Phase 7: Integration & End-to-End Testing
**Implementation:**
1. Integrate all components
2. Handle cross-component communication
3. Optimize performance
4. Polish user experience

**Testing Phase 7:**
- [ ] End-to-end testing of complete workflow
- [ ] Performance testing under various conditions
- [ ] Memory usage and leak testing
- [ ] Cross-platform compatibility testing
- [ ] Stress testing with long recordings
- [ ] User acceptance testing
- [ ] Security testing (microphone permissions, data handling)

### Phase 8: Final Polish & Distribution
**Implementation:**
1. Bug fixes from testing phases
2. Documentation and user guide
3. Package for distribution
4. Create installation instructions

**Testing Phase 8:**
- [ ] Final regression testing
- [ ] Installation testing on clean systems
- [ ] Documentation accuracy verification
- [ ] Beta user testing
- [ ] Performance validation
- [ ] Security audit

## Testing Strategy

### Unit Testing
- Test individual class methods in isolation
- Mock external dependencies (Obsidian API, audio APIs, Moonshine AI)
- Achieve >90% code coverage
- Test edge cases and error conditions

### Integration Testing
- Test component interactions
- Test with real Obsidian environment
- Test audio pipeline end-to-end
- Test settings persistence and loading

### Manual Testing
- Test on different operating systems (Windows, macOS, Linux)
- Test with different microphones and audio setups
- Test with various Obsidian themes and configurations
- Test accessibility features

### Performance Testing
- Measure transcription speed and accuracy
- Test memory usage during long recordings
- Test startup time and model loading
- Benchmark against performance requirements

## Technical Considerations

### Moonshine AI Integration
- Investigate Moonshine AI's JavaScript/TypeScript bindings
- Determine model size and loading requirements
- Handle model caching for performance
- Consider fallback options if model fails to load

### Audio Processing
- Handle different audio formats and sample rates
- Implement noise reduction if needed
- Manage audio buffer sizes for optimal performance
- Handle microphone permission requests gracefully

### Obsidian Plugin Requirements
- Follow Obsidian plugin development guidelines
- Ensure compatibility with different Obsidian versions
- Handle plugin lifecycle properly
- Implement proper error handling and logging

### Performance Considerations
- Lazy load Moonshine model to reduce startup time
- Implement audio streaming for real-time processing
- Optimize memory usage during transcription
- Handle long recording sessions efficiently

## Success Criteria
- [ ] Successfully record audio from microphone
- [ ] Accurately transcribe speech using Moonshine AI
- [ ] Insert transcribed text into Obsidian notes
- [ ] Clean, OOP-based architecture
- [ ] User-friendly interface with clear feedback
- [ ] Proper error handling and edge cases
- [ ] Configurable settings for user preferences
- [ ] Comprehensive test coverage (>90%)
- [ ] Performance meets requirements (real-time transcription)
- [ ] Ready for distribution to other users

## Next Steps
1. Set up the basic Obsidian plugin project structure with testing framework
2. Create the core class files with basic implementations and corresponding tests
3. Begin with audio recording functionality and thorough testing
4. Integrate Moonshine AI for transcription with performance testing
5. Implement Obsidian text insertion with integration testing
6. Add UI components and settings with user testing

## Potential Challenges
- Moonshine AI integration complexity
- Audio processing in Electron/browser environment
- Real-time transcription performance
- Cross-platform compatibility
- Model size and loading time optimization
- Maintaining test coverage while developing rapidly
