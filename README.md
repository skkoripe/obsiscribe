# Obsiscribe - Speech to Text Plugin for Obsidian

A powerful Obsidian plugin that converts speech to text using local AI processing with Moonshine AI. No external API calls required - everything runs locally on your device for maximum privacy.

## 🎯 Features

- **Local Speech Recognition**: Uses Moonshine AI for on-device transcription
- **Privacy First**: No data sent to external servers
- **Real-time Processing**: Fast, responsive speech-to-text conversion
- **Flexible Text Insertion**: Insert at cursor, append, or prepend to notes
- **Customizable Settings**: Audio quality, languages, and UI preferences
- **Clean Architecture**: Built with OOP principles for maintainability

## 🚀 Current Status

**Phase 1 Complete** ✅
- Project structure and build system set up
- All core classes implemented with clean OOP architecture
- TypeScript compilation working
- Jest testing framework configured
- Basic unit tests passing (12/12)

## 🏗️ Architecture

### Core Classes

- **`SpeechToTextPlugin`**: Main coordinator class
- **`AudioRecorder`**: Handles microphone access and recording
- **`MoonshineTranscriber`**: Manages AI transcription with Moonshine
- **`TextInserter`**: Integrates with Obsidian editor
- **`SettingsManager`**: Handles configuration and preferences
- **`UIController`**: Manages user interface elements

### Interfaces

- **`ISettings`**: Plugin configuration interface
- **`IAudioRecorder`**: Audio recording contract
- **`ITranscriber`**: Transcription service contract

## 🛠️ Development

### Prerequisites

- Node.js 16+
- npm or yarn
- TypeScript knowledge

### Setup

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Run tests
npm test

# Watch mode for development
npm run dev
```

### Project Structure

```
obsiscribe/
├── src/
│   ├── main.ts                 # Plugin entry point
│   ├── classes/                # Core implementation classes
│   ├── interfaces/             # TypeScript interfaces
│   └── utils/                  # Utility functions
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── test-utils/             # Test helpers
├── manifest.json               # Obsidian plugin manifest
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

## 🧪 Testing

The project uses Jest with comprehensive testing:

- **Unit Tests**: Test individual classes in isolation
- **Integration Tests**: Test component interactions
- **Coverage Target**: >90% code coverage

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📋 Roadmap

### Phase 2: Audio Recording Implementation
- Implement real microphone access
- Handle audio permissions
- Process audio streams
- Error handling for audio issues

### Phase 3: Moonshine AI Integration
- Integrate Moonshine AI library
- Handle model loading
- Process audio for transcription
- Optimize performance

### Phase 4: Obsidian Integration
- Complete text insertion functionality
- Handle different note types
- Cursor positioning
- Auto-save features

### Phase 5: User Interface
- Recording button and indicators
- Status feedback
- Error messages
- Accessibility features

### Phase 6: Settings & Configuration
- Complete settings UI
- Validation and persistence
- User preferences
- Configuration migration

### Phase 7: Integration & Testing
- End-to-end testing
- Performance optimization
- Cross-platform testing
- User acceptance testing

### Phase 8: Distribution
- Documentation
- Installation guide
- Beta testing
- Release preparation

## 🤝 Contributing

This project follows clean coding principles:

- **OOP Design**: Clear separation of concerns
- **TypeScript**: Full type safety
- **Testing**: Comprehensive test coverage
- **Documentation**: Clear code documentation

## 📄 License

MIT License - see LICENSE file for details.

## 🔒 Privacy

Obsiscribe processes all audio locally on your device. No data is sent to external servers, ensuring complete privacy of your voice recordings and transcriptions.

---

**Status**: Phase 1 Complete ✅ | **Next**: Phase 2 - Audio Recording Implementation
