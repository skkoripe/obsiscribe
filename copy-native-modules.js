#!/usr/bin/env node

/**
 * Copy native Sherpa ONNX modules to plugin directory for Obsidian
 * This script copies the required native binaries so they can be loaded in Obsidian
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Copying native Sherpa ONNX modules for Obsidian...');

// Create native modules directory
const nativeDir = './native-modules';
if (!fs.existsSync(nativeDir)) {
  fs.mkdirSync(nativeDir, { recursive: true });
  console.log('✅ Created native-modules directory');
}

// Copy sherpa-onnx-node files
const sherpaNodeSrc = './node_modules/sherpa-onnx-node';
const sherpaNodeDest = path.join(nativeDir, 'sherpa-onnx-node');

if (fs.existsSync(sherpaNodeSrc)) {
  if (!fs.existsSync(sherpaNodeDest)) {
    fs.mkdirSync(sherpaNodeDest, { recursive: true });
  }
  
  // Copy JavaScript files
  const jsFiles = ['sherpa-onnx.js', 'non-streaming-asr.js', 'addon.js'];
  for (const file of jsFiles) {
    const srcFile = path.join(sherpaNodeSrc, file);
    const destFile = path.join(sherpaNodeDest, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`✅ Copied ${file}`);
    }
  }
  
  // Copy package.json
  const packageSrc = path.join(sherpaNodeSrc, 'package.json');
  const packageDest = path.join(sherpaNodeDest, 'package.json');
  if (fs.existsSync(packageSrc)) {
    fs.copyFileSync(packageSrc, packageDest);
    console.log('✅ Copied package.json');
  }
}

// Copy sherpa-onnx-darwin-arm64 native binaries
const sherpaNativeSrc = './node_modules/sherpa-onnx-darwin-arm64';
const sherpaNativeDest = path.join(nativeDir, 'sherpa-onnx-darwin-arm64');

if (fs.existsSync(sherpaNativeSrc)) {
  if (!fs.existsSync(sherpaNativeDest)) {
    fs.mkdirSync(sherpaNativeDest, { recursive: true });
  }
  
  // Copy all native files
  const files = fs.readdirSync(sherpaNativeSrc);
  for (const file of files) {
    const srcFile = path.join(sherpaNativeSrc, file);
    const destFile = path.join(sherpaNativeDest, file);
    
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`✅ Copied ${file}`);
    }
  }
}

console.log('');
console.log('🎉 Native modules copied successfully!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Copy the native-modules/ directory to your Obsidian plugin folder');
console.log('2. The plugin will now be able to load Sherpa ONNX natively');
console.log('');
console.log('📁 Files to copy to Obsidian:');
console.log('   - main.js');
console.log('   - manifest.json');
console.log('   - sherpa-onnx-moonshine-tiny-en-int8/');
console.log('   - native-modules/');
