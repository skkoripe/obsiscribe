#!/usr/bin/env node

/**
 * Native Module API Discovery Script
 * 
 * This script directly loads the Sherpa ONNX native module and explores
 * its actual API to find the correct method names for transcription.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PLUGIN_DIR = '/Users/skkoripe/Library/CloudStorage/GoogleDrive-sairamk0@gmail.com/My Drive/obsidian-files/Second brain/.obsidian/plugins/obsiscribe';
const NATIVE_LIB_DIR = path.join(PLUGIN_DIR, 'native-modules', 'sherpa-onnx-darwin-arm64');
const NATIVE_MODULE_PATH = path.join(NATIVE_LIB_DIR, 'sherpa-onnx.node');
const MODEL_DIR = path.join(PLUGIN_DIR, 'sherpa-onnx-moonshine-tiny-en-int8');

console.log('🔍 Native Module API Discovery');
console.log('==============================');
console.log();

async function exploreNativeModule() {
    console.log('📦 Loading native module...');
    console.log('Module path:', NATIVE_MODULE_PATH);
    
    // Set up library path
    const originalPath = process.env.DYLD_LIBRARY_PATH || '';
    process.env.DYLD_LIBRARY_PATH = NATIVE_LIB_DIR + (originalPath ? ':' + originalPath : '');
    
    try {
        // Load the native module
        const nativeModule = require(NATIVE_MODULE_PATH);
        console.log('✅ Native module loaded successfully!');
        
        // Restore library path
        if (originalPath) {
            process.env.DYLD_LIBRARY_PATH = originalPath;
        } else {
            delete process.env.DYLD_LIBRARY_PATH;
        }
        
        console.log();
        console.log('🔍 Exploring native module exports...');
        console.log('=====================================');
        
        const exports = Object.keys(nativeModule);
        console.log('📋 Available exports:', exports.length);
        
        exports.forEach((exportName, index) => {
            const exportValue = nativeModule[exportName];
            const type = typeof exportValue;
            console.log(`${index + 1}. ${exportName} (${type})`);
            
            if (type === 'function') {
                console.log(`   └─ Function: ${exportName}()`);
                
                // Try to get function signature if possible
                try {
                    const funcStr = exportValue.toString();
                    if (funcStr.length < 200) {
                        console.log(`      Signature: ${funcStr}`);
                    } else {
                        console.log(`      Signature: [native function]`);
                    }
                } catch (e) {
                    console.log(`      Signature: [unable to inspect]`);
                }
            } else if (type === 'object' && exportValue !== null) {
                console.log(`   └─ Object with properties:`, Object.keys(exportValue));
            }
        });
        
        console.log();
        console.log('🎯 Testing API Methods...');
        console.log('=========================');
        
        // Test different API patterns
        await testAPIPatterns(nativeModule);
        
    } catch (error) {
        console.error('❌ Failed to load native module:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        // Restore original library path
        if (originalPath) {
            process.env.DYLD_LIBRARY_PATH = originalPath;
        } else {
            delete process.env.DYLD_LIBRARY_PATH;
        }
    }
}

async function testAPIPatterns(nativeModule) {
    console.log('🧪 Testing different API patterns...');
    
    // Model configuration
    const config = {
        'featConfig': {
            'sampleRate': 16000,
            'featureDim': 80,
        },
        'modelConfig': {
            'moonshine': {
                'preprocessor': path.join(MODEL_DIR, 'preprocess.onnx'),
                'encoder': path.join(MODEL_DIR, 'encode.int8.onnx'),
                'uncachedDecoder': path.join(MODEL_DIR, 'uncached_decode.int8.onnx'),
                'cachedDecoder': path.join(MODEL_DIR, 'cached_decode.int8.onnx'),
            },
            'tokens': path.join(MODEL_DIR, 'tokens.txt'),
            'numThreads': 2,
            'provider': 'cpu',
            'debug': 1, // Enable debug
        }
    };
    
    console.log('📋 Model config:', JSON.stringify(config, null, 2));
    
    // Test Pattern 1: createOfflineRecognizer
    if (nativeModule.createOfflineRecognizer) {
        console.log('✅ Found createOfflineRecognizer - testing...');
        try {
            const recognizer = nativeModule.createOfflineRecognizer(config);
            console.log('✅ Recognizer created:', recognizer ? 'success' : 'failed');
            
            if (recognizer) {
                console.log('🔍 Recognizer methods:', Object.keys(recognizer));
                
                // Test createOfflineStream
                if (nativeModule.createOfflineStream) {
                    console.log('✅ Found createOfflineStream - testing...');
                    const stream = nativeModule.createOfflineStream(recognizer);
                    console.log('✅ Stream created:', stream ? 'success' : 'failed');
                    
                    if (stream) {
                        console.log('🔍 Stream methods:', Object.keys(stream));
                        
                        // Test the working API pattern from our test scripts
                        await testWorkingPattern(nativeModule, recognizer, stream);
                    }
                } else {
                    console.log('❌ createOfflineStream not found');
                }
            }
        } catch (error) {
            console.error('❌ createOfflineRecognizer failed:', error.message);
        }
    } else {
        console.log('❌ createOfflineRecognizer not found');
    }
    
    // Test Pattern 2: Direct function calls
    console.log();
    console.log('🧪 Testing direct function calls...');
    
    const directFunctions = [
        'acceptWaveformOffline',
        'decodeOfflineStream', 
        'getOfflineStreamResultAsJson',
        'createOfflineRecognizer',
        'createOfflineStream'
    ];
    
    directFunctions.forEach(funcName => {
        if (nativeModule[funcName]) {
            console.log(`✅ Found ${funcName}`);
        } else {
            console.log(`❌ Missing ${funcName}`);
        }
    });
}

async function testWorkingPattern(sherpa, recognizer, stream) {
    console.log();
    console.log('🎯 Testing the working API pattern from our test scripts...');
    console.log('=========================================================');
    
    try {
        // Generate test audio (simple sine wave)
        const sampleRate = 16000;
        const duration = 2; // 2 seconds
        const frequency = 440; // A4 note
        const numSamples = sampleRate * duration;
        const audioSamples = new Float32Array(numSamples);
        
        for (let i = 0; i < numSamples; i++) {
            audioSamples[i] = 0.3 * Math.sin(2 * Math.PI * frequency * i / sampleRate);
        }
        
        console.log(`✅ Generated test audio: ${numSamples} samples at ${sampleRate}Hz`);
        
        // Test acceptWaveformOffline
        if (sherpa.acceptWaveformOffline) {
            console.log('🧪 Testing acceptWaveformOffline...');
            sherpa.acceptWaveformOffline(stream, {
                sampleRate: sampleRate,
                samples: audioSamples
            });
            console.log('✅ acceptWaveformOffline succeeded');
        } else {
            console.log('❌ acceptWaveformOffline not available');
            return;
        }
        
        // Test decodeOfflineStream
        if (sherpa.decodeOfflineStream) {
            console.log('🧪 Testing decodeOfflineStream...');
            sherpa.decodeOfflineStream(recognizer, stream);
            console.log('✅ decodeOfflineStream succeeded');
        } else {
            console.log('❌ decodeOfflineStream not available');
            return;
        }
        
        // Test getOfflineStreamResultAsJson
        if (sherpa.getOfflineStreamResultAsJson) {
            console.log('🧪 Testing getOfflineStreamResultAsJson...');
            const resultJson = sherpa.getOfflineStreamResultAsJson(stream);
            const result = JSON.parse(resultJson);
            console.log('✅ getOfflineStreamResultAsJson succeeded');
            console.log('📊 Result:', result);
            
            if (result.text && result.text.trim()) {
                console.log('🎉 SUCCESS! Got transcription result:', result.text);
            } else {
                console.log('⚠️  No text in result (expected for sine wave test audio)');
            }
        } else {
            console.log('❌ getOfflineStreamResultAsJson not available');
        }
        
        console.log();
        console.log('🎊 API Pattern Test Complete!');
        console.log('The working pattern is:');
        console.log('1. sherpa.createOfflineRecognizer(config)');
        console.log('2. sherpa.createOfflineStream(recognizer)');
        console.log('3. sherpa.acceptWaveformOffline(stream, {sampleRate, samples})');
        console.log('4. sherpa.decodeOfflineStream(recognizer, stream)');
        console.log('5. sherpa.getOfflineStreamResultAsJson(stream)');
        
    } catch (error) {
        console.error('❌ Working pattern test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the exploration
console.log('🚀 Starting native module API discovery...');
console.log();
exploreNativeModule().catch(console.error);
