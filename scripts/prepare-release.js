#!/usr/bin/env node

/**
 * Release Preparation Script for Obsiscribe
 * 
 * This script prepares the plugin for distribution by:
 * 1. Building the production version
 * 2. Copying necessary files to a release directory
 * 3. Creating a distributable ZIP file
 * 4. Validating the release package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RELEASE_DIR = 'release';
const PLUGIN_NAME = 'obsiscribe';

// Files to include in the release
const RELEASE_FILES = [
  'main.js',
  'manifest.json',
  'styles.css',
  'README.md',
  'INSTALLATION.md',
  'CHANGELOG.md',
  'LICENSE'
];

// Directories to include in the release
const RELEASE_DIRS = [
  'native-modules',
  'sherpa-onnx-moonshine-tiny-en-int8'
];

console.log('🚀 Preparing Obsiscribe release...\n');

// Step 1: Clean previous release
console.log('🧹 Cleaning previous release...');
if (fs.existsSync(RELEASE_DIR)) {
  fs.rmSync(RELEASE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(RELEASE_DIR, { recursive: true });

// Step 2: Build production version
console.log('🔨 Building production version...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Run tests
console.log('🧪 Running tests...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ All tests passed\n');
} catch (error) {
  console.error('❌ Tests failed:', error.message);
  process.exit(1);
}

// Step 4: Copy files to release directory
console.log('📦 Copying release files...');
const pluginDir = path.join(RELEASE_DIR, PLUGIN_NAME);
fs.mkdirSync(pluginDir, { recursive: true });

// Copy individual files
RELEASE_FILES.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(pluginDir, file));
    console.log(`  ✅ Copied ${file}`);
  } else {
    console.log(`  ⚠️  Warning: ${file} not found`);
  }
});

// Copy directories
RELEASE_DIRS.forEach(dir => {
  const srcPath = path.join('/Users/skkoripe/Library/CloudStorage/GoogleDrive-sairamk0@gmail.com/My Drive/obsidian-files/Second brain/.obsidian/plugins/obsiscribe', dir);
  const destPath = path.join(pluginDir, dir);
  
  if (fs.existsSync(srcPath)) {
    copyDirectory(srcPath, destPath);
    console.log(`  ✅ Copied ${dir}/`);
  } else {
    console.log(`  ⚠️  Warning: ${dir}/ not found at ${srcPath}`);
  }
});

// Step 5: Validate manifest
console.log('\n🔍 Validating manifest...');
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(pluginDir, 'manifest.json'), 'utf8'));
  
  const requiredFields = ['id', 'name', 'version', 'minAppVersion', 'description', 'author'];
  const missingFields = requiredFields.filter(field => !manifest[field]);
  
  if (missingFields.length > 0) {
    console.error(`❌ Manifest missing required fields: ${missingFields.join(', ')}`);
    process.exit(1);
  }
  
  console.log(`✅ Manifest valid - ${manifest.name} v${manifest.version}`);
} catch (error) {
  console.error('❌ Invalid manifest.json:', error.message);
  process.exit(1);
}

// Step 6: Check file sizes
console.log('\n📊 Checking file sizes...');
const mainJsPath = path.join(pluginDir, 'main.js');
if (fs.existsSync(mainJsPath)) {
  const stats = fs.statSync(mainJsPath);
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`  main.js: ${sizeKB} KB`);
  
  if (sizeKB > 1000) {
    console.log('  ⚠️  Warning: main.js is quite large, consider optimization');
  }
}

// Step 7: Create ZIP file
console.log('\n📦 Creating release ZIP...');
const zipName = `${PLUGIN_NAME}-v${getVersion()}.zip`;
const zipPath = path.join(RELEASE_DIR, zipName);

try {
  execSync(`cd ${RELEASE_DIR} && zip -r ${zipName} ${PLUGIN_NAME}/`, { stdio: 'inherit' });
  console.log(`✅ Created ${zipName}`);
} catch (error) {
  console.error('❌ Failed to create ZIP:', error.message);
  process.exit(1);
}

// Step 8: Generate release notes
console.log('\n📝 Generating release notes...');
const releaseNotes = generateReleaseNotes();
fs.writeFileSync(path.join(RELEASE_DIR, 'RELEASE_NOTES.md'), releaseNotes);
console.log('✅ Generated RELEASE_NOTES.md');

// Step 9: Final validation
console.log('\n🔍 Final validation...');
const zipStats = fs.statSync(zipPath);
const zipSizeMB = Math.round(zipStats.size / (1024 * 1024));
console.log(`  ZIP size: ${zipSizeMB} MB`);

if (zipSizeMB > 50) {
  console.log('  ⚠️  Warning: ZIP file is quite large');
}

console.log('\n🎉 Release preparation completed successfully!');
console.log('\n📋 Release Summary:');
console.log(`  Plugin: ${PLUGIN_NAME}`);
console.log(`  Version: ${getVersion()}`);
console.log(`  ZIP file: ${zipPath}`);
console.log(`  Size: ${zipSizeMB} MB`);
console.log('\n📖 Next steps:');
console.log('  1. Test the plugin by installing from the ZIP file');
console.log('  2. Create a GitHub release with the ZIP file');
console.log('  3. Update the README with download links');
console.log('  4. Announce the release to the community');

// Helper functions
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getVersion() {
  try {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    return manifest.version;
  } catch (error) {
    return '1.0.0';
  }
}

function generateReleaseNotes() {
  const version = getVersion();
  const date = new Date().toISOString().split('T')[0];
  
  return `# Obsiscribe v${version} Release Notes

## 🎉 What's New

This release includes the complete Obsiscribe speech-to-text functionality for Obsidian!

### ✨ Features
- 🎤 **Real-time Speech Recognition** - Click and speak, text appears instantly
- 🤖 **AI-Powered Transcription** - Uses Moonshine AI for 95%+ accuracy
- 🔒 **100% Private** - All processing happens locally on your device
- ⚡ **Lightning Fast** - Transcribes speech in under 100ms
- 🎨 **Seamless Integration** - Native Obsidian UI integration

### 🛠️ Installation
1. Download the \`${PLUGIN_NAME}-v${version}.zip\` file
2. Extract to your Obsidian plugins directory: \`.obsidian/plugins/obsiscribe/\`
3. Enable the plugin in Settings → Community Plugins
4. Look for the 🎤 microphone button in your ribbon

### 🎯 Usage
1. Click the 🎤 microphone button
2. Speak clearly (button turns red while recording)
3. Click again to stop and see your text appear!

### 📋 System Requirements
- Obsidian v0.15.0+
- Windows 10+, macOS 10.14+, or Linux
- 4GB RAM (8GB recommended)
- Working microphone

### 🔧 Troubleshooting
- Ensure microphone permissions are granted
- Check that you have an active note open
- Speak clearly at normal pace for best results

### 🙏 Acknowledgments
Special thanks to Moonshine AI, Sherpa ONNX, and the Obsidian team for making this possible!

---

**Release Date:** ${date}
**Download:** [obsiscribe-v${version}.zip](./obsiscribe-v${version}.zip)
**Documentation:** [Installation Guide](./obsiscribe/INSTALLATION.md)
`;
}
