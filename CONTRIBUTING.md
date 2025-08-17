# 🤝 Contributing to Obsiscribe

Thank you for your interest in contributing to Obsiscribe! We welcome contributions from developers of all skill levels. This guide will help you get started.

## 🌟 Ways to Contribute

### 🐛 Bug Reports
- Found a bug? Please report it!
- Check existing issues first to avoid duplicates
- Provide detailed reproduction steps
- Include system information and error messages

### 💡 Feature Requests
- Have an idea for improvement? We'd love to hear it!
- Describe the problem you're trying to solve
- Explain how your feature would help users
- Consider implementation complexity

### 🔧 Code Contributions
- Fix bugs or implement new features
- Improve performance or code quality
- Add tests for better coverage
- Update documentation

### 📖 Documentation
- Improve installation guides
- Add usage examples
- Fix typos or unclear explanations
- Translate to other languages

## 🚀 Getting Started

### Prerequisites
- **Node.js** 16+ and npm
- **Git** for version control
- **TypeScript** knowledge (helpful)
- **Obsidian** for testing

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/obsiscribe.git
   cd obsiscribe
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Development Environment**
   ```bash
   # Build the plugin
   npm run build
   
   # Run tests
   npm test
   
   # Start development mode (watches for changes)
   npm run dev
   ```

4. **Link to Obsidian (Optional)**
   ```bash
   # Create symlink to your Obsidian plugins directory
   ln -s $(pwd) /path/to/your/vault/.obsidian/plugins/obsiscribe
   ```

## 🏗️ Project Structure

```
obsiscribe/
├── src/
│   ├── main.ts                 # Plugin entry point
│   ├── classes/                # Core implementation
│   │   ├── SpeechToTextPlugin.ts
│   │   ├── AudioRecorder.ts
│   │   ├── MoonshineTranscriber.ts
│   │   ├── TextInserter.ts
│   │   ├── SettingsManager.ts
│   │   └── UIController.ts
│   ├── interfaces/             # TypeScript contracts
│   │   ├── ISettings.ts
│   │   ├── IAudioRecorder.ts
│   │   └── ITranscriber.ts
│   └── types/                  # Type definitions
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── test-utils/             # Test helpers
├── docs/                       # Documentation
├── manifest.json               # Obsidian plugin manifest
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

## 🧪 Testing

We maintain high test coverage to ensure quality:

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test AudioRecorder.test.ts
```

### Writing Tests
- **Unit Tests**: Test individual classes in isolation
- **Integration Tests**: Test component interactions
- **Mocking**: Use Jest mocks for external dependencies
- **Coverage**: Aim for >90% code coverage

### Test Structure
```typescript
describe('ClassName', () => {
  let instance: ClassName;
  
  beforeEach(() => {
    instance = new ClassName();
  });
  
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = instance.methodName(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

## 📝 Code Style

### TypeScript Guidelines
- Use **strict TypeScript** settings
- Prefer **interfaces** over types for object shapes
- Use **explicit return types** for public methods
- Follow **PascalCase** for classes, **camelCase** for methods

### Code Organization
- **Single Responsibility**: Each class has one clear purpose
- **Dependency Injection**: Pass dependencies through constructors
- **Error Handling**: Use custom error classes with specific codes
- **Documentation**: Add JSDoc comments for public APIs

### Example Class Structure
```typescript
/**
 * Handles audio recording functionality
 */
export class AudioRecorder implements IAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  
  /**
   * Initialize the audio recorder
   * @param settings Audio recording settings
   */
  async initialize(settings: AudioSettings): Promise<void> {
    // Implementation
  }
  
  /**
   * Start recording audio from microphone
   * @throws AudioRecorderError if recording fails
   */
  async startRecording(): Promise<void> {
    try {
      // Implementation
    } catch (error) {
      throw new AudioRecorderError(
        'Failed to start recording',
        AudioRecorderErrorCode.RECORDING_FAILED,
        error as Error
      );
    }
  }
}
```

## 🔄 Development Workflow

### 1. Create a Branch
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or bug fix branch
git checkout -b fix/bug-description
```

### 2. Make Changes
- Write code following our style guidelines
- Add tests for new functionality
- Update documentation if needed
- Test your changes thoroughly

### 3. Commit Changes
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add voice activity detection

- Implement VAD to improve transcription accuracy
- Add tests for voice detection algorithms
- Update settings to configure sensitivity"
```

### Commit Message Format
```
type(scope): brief description

Detailed explanation of changes made.
Include motivation and implementation details.

- List specific changes
- Reference issues if applicable
- Note breaking changes
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`

### 4. Push and Create PR
```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Include description of changes and testing done
```

## 🔍 Pull Request Guidelines

### Before Submitting
- ✅ All tests pass (`npm test`)
- ✅ Code builds without errors (`npm run build`)
- ✅ No TypeScript errors (`npm run type-check`)
- ✅ Documentation updated if needed
- ✅ Changes tested in Obsidian

### PR Description Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Tested in Obsidian environment

## Screenshots (if applicable)
Add screenshots showing UI changes or new features.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added for new functionality
```

## 🐛 Bug Report Template

When reporting bugs, please include:

```markdown
## Bug Description
Clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g. macOS 12.0]
- Obsidian Version: [e.g. 0.15.9]
- Plugin Version: [e.g. 1.0.0]
- Browser: [if applicable]

## Additional Context
- Error messages from console
- Screenshots if helpful
- Any other relevant information
```

## 💡 Feature Request Template

```markdown
## Feature Description
Clear description of the feature you'd like to see.

## Problem Statement
What problem does this feature solve?

## Proposed Solution
How would you like this feature to work?

## Alternative Solutions
Any alternative approaches you've considered?

## Additional Context
- Use cases where this would be helpful
- Examples from other applications
- Implementation ideas
```

## 🏷️ Issue Labels

We use labels to categorize issues:

- **`bug`** - Something isn't working
- **`enhancement`** - New feature or improvement
- **`documentation`** - Documentation needs
- **`good first issue`** - Good for newcomers
- **`help wanted`** - Extra attention needed
- **`priority: high`** - Urgent issues
- **`priority: low`** - Nice to have
- **`status: in progress`** - Being worked on
- **`status: needs review`** - Ready for review

## 🎯 Areas for Contribution

### High Priority
- 🐛 **Bug Fixes** - Always welcome!
- 🧪 **Test Coverage** - Help us reach 100%
- 📖 **Documentation** - Improve user guides
- 🌍 **Internationalization** - Add language support

### Medium Priority
- ⚡ **Performance** - Optimize transcription speed
- 🎨 **UI/UX** - Improve user experience
- 🔧 **Developer Tools** - Better debugging tools
- 📱 **Mobile Support** - Obsidian mobile compatibility

### Future Features
- 🎙️ **Multiple Languages** - Expand beyond English/Spanish
- 🔊 **Audio Effects** - Noise reduction, enhancement
- 📊 **Analytics** - Usage statistics and insights
- 🔗 **Integrations** - Connect with other plugins

## 🤔 Questions?

### Getting Help
- 💬 **GitHub Discussions** - Ask questions and share ideas
- 🐛 **GitHub Issues** - Report bugs or request features
- 📧 **Email** - obsiscribe@example.com for private matters
- 📖 **Documentation** - Check existing guides first

### Community Guidelines
- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and experiences
- Provide constructive feedback

## 🙏 Recognition

Contributors are recognized in:
- **README.md** - Listed in acknowledgments
- **CHANGELOG.md** - Credited for specific contributions
- **GitHub** - Contributor statistics and graphs
- **Releases** - Mentioned in release notes

## 📄 License

By contributing to Obsiscribe, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make Obsiscribe better for everyone! 🎉**

Every contribution, no matter how small, makes a difference. We appreciate your time and effort in improving this project.
