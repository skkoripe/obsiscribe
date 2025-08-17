#!/usr/bin/env node

/**
 * AI Model Download Script for Obsiscribe
 * 
 * This script downloads the required AI models for Obsiscribe.
 * Native modules are handled by npm dependencies (sherpa-onnx-node).
 * It's designed to be run during installation or setup to avoid committing large
 * binary files to the repository.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// AI Model configurations
const DOWNLOADS = {
  // Moonshine AI Models
  'sherpa-onnx-moonshine-tiny-en-int8/preprocess.onnx': {
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-moonshine-tiny-en-int8.tar.bz2',
    extract: true,
    extractPath: 'sherpa-onnx-moonshine-tiny-en-int8/preprocess.onnx'
  },
  'sherpa-onnx-moonshine-tiny-en-int8/encode.int8.onnx': {
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-moonshine-tiny-en-int8.tar.bz2',
    extract: true,
    extractPath: 'sherpa-onnx-moonshine-tiny-en-int8/encode.int8.onnx'
  },
  'sherpa-onnx-moonshine-tiny-en-int8/uncached_decode.int8.onnx': {
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-moonshine-tiny-en-int8.tar.bz2',
    extract: true,
    extractPath: 'sherpa-onnx-moonshine-tiny-en-int8/uncached_decode.int8.onnx'
  },
  'sherpa-onnx-moonshine-tiny-en-int8/cached_decode.int8.onnx': {
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-moonshine-tiny-en-int8.tar.bz2',
    extract: true,
    extractPath: 'sherpa-onnx-moonshine-tiny-en-int8/cached_decode.int8.onnx'
  },
  'sherpa-onnx-moonshine-tiny-en-int8/tokens.txt': {
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-moonshine-tiny-en-int8.tar.bz2',
    extract: true,
    extractPath: 'sherpa-onnx-moonshine-tiny-en-int8/tokens.txt'
  }
};

// Platform detection
function getCurrentPlatform() {
  const platform = process.platform;
  const arch = process.arch;
  
  if (platform === 'darwin') {
    return arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
  } else if (platform === 'win32') {
    return 'win32-x64';
  } else if (platform === 'linux') {
    return 'linux-x64';
  }
  
  throw new Error(`Unsupported platform: ${platform}-${arch}`);
}

// Download cache to avoid re-downloading
const downloadCache = new Map();

async function downloadFile(url, destPath) {
  // Check if already downloaded
  if (downloadCache.has(url)) {
    console.log(`  📦 Using cached download for ${path.basename(destPath)}`);
    return downloadCache.get(url);
  }
  
  console.log(`  ⬇️  Downloading ${path.basename(destPath)}...`);
  
  return new Promise((resolve, reject) => {
    const tempPath = destPath + '.tmp';
    const file = fs.createWriteStream(tempPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize) {
          const percent = Math.round((downloadedSize / totalSize) * 100);
          process.stdout.write(`\r    Progress: ${percent}% (${Math.round(downloadedSize / 1024 / 1024)}MB)`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        fs.renameSync(tempPath, destPath);
        console.log(`\n  ✅ Downloaded ${path.basename(destPath)}`);
        downloadCache.set(url, destPath);
        resolve(destPath);
      });
      
      file.on('error', (err) => {
        fs.unlinkSync(tempPath);
        reject(err);
      });
    }).on('error', reject);
  });
}

async function extractArchive(archivePath, extractPath, targetFile) {
  console.log(`  📦 Extracting ${path.basename(targetFile)}...`);
  
  try {
    const tempDir = path.join(path.dirname(archivePath), 'temp_extract');
    
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Extract archive
    if (archivePath.endsWith('.tar.bz2')) {
      execSync(`tar -xjf "${archivePath}" -C "${tempDir}"`, { stdio: 'pipe' });
    } else if (archivePath.endsWith('.zip')) {
      execSync(`unzip -q "${archivePath}" -d "${tempDir}"`, { stdio: 'pipe' });
    }
    
    // Find and copy the target file
    const extractedFile = path.join(tempDir, extractPath);
    if (fs.existsSync(extractedFile)) {
      const destDir = path.dirname(targetFile);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(extractedFile, targetFile);
      console.log(`  ✅ Extracted ${path.basename(targetFile)}`);
    } else {
      throw new Error(`Target file not found in archive: ${extractPath}`);
    }
    
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(archivePath);
    
  } catch (error) {
    console.error(`  ❌ Extraction failed: ${error.message}`);
    throw error;
  }
}

async function downloadAndSetup() {
  console.log('🚀 Setting up Obsiscribe models and native modules...\n');
  
  const currentPlatform = getCurrentPlatform();
  console.log(`📱 Detected platform: ${currentPlatform}\n`);
  
  // Create directories
  const dirs = ['native-modules', 'sherpa-onnx-moonshine-tiny-en-int8'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  let downloadCount = 0;
  let skipCount = 0;
  
  for (const [targetPath, config] of Object.entries(DOWNLOADS)) {
    // Skip platform-specific files for other platforms
    if (config.platforms && !config.platforms.includes(currentPlatform)) {
      console.log(`⏭️  Skipping ${targetPath} (not needed for ${currentPlatform})`);
      skipCount++;
      continue;
    }
    
    // Check if file already exists
    if (fs.existsSync(targetPath)) {
      console.log(`✅ ${targetPath} already exists`);
      skipCount++;
      continue;
    }
    
    try {
      console.log(`📥 Processing ${targetPath}...`);
      
      if (config.extract) {
        // Download to temp file and extract
        const tempArchive = `${targetPath}.archive`;
        await downloadFile(config.url, tempArchive);
        await extractArchive(tempArchive, config.extractPath, targetPath);
      } else {
        // Direct download
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        await downloadFile(config.url, targetPath);
      }
      
      downloadCount++;
      
    } catch (error) {
      console.error(`❌ Failed to download ${targetPath}: ${error.message}`);
      process.exit(1);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🎉 Setup completed successfully!');
  console.log(`📊 Summary: ${downloadCount} downloaded, ${skipCount} skipped\n`);
  
  // Verify AI model files
  console.log('🔍 Verifying AI models...');
  const criticalFiles = [
    'sherpa-onnx-moonshine-tiny-en-int8/preprocess.onnx',
    'sherpa-onnx-moonshine-tiny-en-int8/encode.int8.onnx',
    'sherpa-onnx-moonshine-tiny-en-int8/uncached_decode.int8.onnx',
    'sherpa-onnx-moonshine-tiny-en-int8/cached_decode.int8.onnx',
    'sherpa-onnx-moonshine-tiny-en-int8/tokens.txt'
  ];
  
  let allPresent = true;
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log(`  ✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      allPresent = false;
    }
  });
  
  if (allPresent) {
    console.log('\n🎊 All AI models downloaded successfully!');
    console.log('📝 Note: Native modules are handled by npm dependencies (sherpa-onnx-node)');
    console.log('🎉 Obsiscribe is ready to use!');
  } else {
    console.log('\n⚠️  Some AI model files are missing. Please run the script again.');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🎤 Obsiscribe Model Download Script

Usage: node scripts/download-models.js [options]

Options:
  --help, -h     Show this help message
  --force        Force re-download even if files exist
  --platform     Specify platform (darwin-arm64, darwin-x64, win32-x64, linux-x64)

Examples:
  node scripts/download-models.js
  node scripts/download-models.js --force
  node scripts/download-models.js --platform darwin-arm64

This script downloads the required AI models and native modules for Obsiscribe.
Total download size: ~150-200MB depending on platform.
`);
  process.exit(0);
}

// Force re-download if requested
if (process.argv.includes('--force')) {
  console.log('🔄 Force mode enabled - will re-download existing files\n');
  // Clear existing files
  Object.keys(DOWNLOADS).forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
}

// Run the setup
downloadAndSetup().catch(error => {
  console.error('\n💥 Setup failed:', error.message);
  process.exit(1);
});
