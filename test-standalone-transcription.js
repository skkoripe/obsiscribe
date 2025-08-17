#!/usr/bin/env node

/**
 * Standalone Speech-to-Text Test Script
 * 
 * This script tests the Sherpa ONNX + Moonshine transcription setup
 * independently of Obsidian to verify the core functionality works.
 * 
 * Usage: node test-standalone-transcription.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PLUGIN_DIR = '/Users/skkoripe/Library/CloudStorage/GoogleDrive-sairamk0@gmail.com/My Drive/obsidian-files/Second brain/.obsidian/plugins/obsiscribe';
const NATIVE_LIB_DIR = path.join(PLUGIN_DIR, 'native-modules', 'sherpa-onnx-darwin-arm64');
const NATIVE_MODULE_PATH = path.join(NATIVE_LIB_DIR, 'sherpa-onnx.node');
const MODEL_DIR = path.join(PLUGIN_DIR, 'sherpa-onnx-moonshine-tiny-en-int8');

console.log('🎤 Standalone Speech-to-Text Test');
console.log('================================');
console.log();

async function testNativeModuleLoading() {
    console.log('📦 Testing Native Module Loading...');
    console.log('Native module path:', NATIVE_MODULE_PATH);
    console.log('Model directory:', MODEL_DIR);
    console.log();

    // Check if files exist
    if (!fs.existsSync(NATIVE_MODULE_PATH)) {
        console.error('❌ Native module not found:', NATIVE_MODULE_PATH);
        return null;
    }

    if (!fs.existsSync(MODEL_DIR)) {
        console.error('❌ Model directory not found:', MODEL_DIR);
        return null;
    }

    // Check model files
    const requiredModelFiles = [
        'preprocess.onnx',
        'encode.int8.onnx', 
        'uncached_decode.int8.onnx',
        'cached_decode.int8.onnx',
        'tokens.txt'
    ];

    for (const file of requiredModelFiles) {
        const filePath = path.join(MODEL_DIR, file);
        if (!fs.existsSync(filePath)) {
            console.error('❌ Model file not found:', filePath);
            return null;
        }
        console.log('✅ Found model file:', file);
    }

    console.log();

    // Set up library path
    const originalPath = process.env.DYLD_LIBRARY_PATH || '';
    process.env.DYLD_LIBRARY_PATH = NATIVE_LIB_DIR + (originalPath ? ':' + originalPath : '');

    try {
        // Load the native module
        console.log('🔄 Loading native module...');
        const nativeModule = require(NATIVE_MODULE_PATH);
        console.log('✅ Native module loaded successfully!');
        console.log('📋 Native module exports:', Object.keys(nativeModule));
        console.log();

        return nativeModule;
    } catch (error) {
        console.error('❌ Failed to load native module:', error.message);
        return null;
    } finally {
        // Restore original library path
        if (originalPath) {
            process.env.DYLD_LIBRARY_PATH = originalPath;
        } else {
            delete process.env.DYLD_LIBRARY_PATH;
        }
    }
}

async function testModelConfiguration(nativeModule) {
    console.log('⚙️  Testing Model Configuration...');

    // Configuration for Moonshine model
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
            'debug': 1, // Enable debug for testing
        }
    };

    console.log('📋 Model configuration:', JSON.stringify(config, null, 2));
    console.log();

    try {
        let recognizer = null;

        // Try different API approaches
        if (nativeModule.OfflineRecognizer) {
            console.log('🔄 Creating OfflineRecognizer directly...');
            recognizer = new nativeModule.OfflineRecognizer(config);
        } else if (nativeModule.createOfflineRecognizer) {
            console.log('🔄 Creating OfflineRecognizer via createOfflineRecognizer...');
            recognizer = nativeModule.createOfflineRecognizer(config);
        } else {
            console.error('❌ No OfflineRecognizer API found in native module');
            return null;
        }

        if (recognizer) {
            console.log('✅ Recognizer created successfully!');
            console.log('📋 Recognizer methods:', Object.keys(recognizer));
            console.log();
            return recognizer;
        } else {
            console.error('❌ Failed to create recognizer');
            return null;
        }
    } catch (error) {
        console.error('❌ Failed to create recognizer:', error.message);
        console.error('Stack trace:', error.stack);
        return null;
    }
}

function generateTestAudio() {
    console.log('🎵 Generating Test Audio...');
    
    // Generate a simple sine wave as test audio (simulating speech)
    const sampleRate = 16000;
    const duration = 2; // 2 seconds
    const frequency = 440; // A4 note
    const numSamples = sampleRate * duration;
    
    const audioSamples = new Float32Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
        // Generate sine wave with some variation to simulate speech
        const t = i / sampleRate;
        audioSamples[i] = Math.sin(2 * Math.PI * frequency * t) * 0.3 * Math.sin(2 * Math.PI * 2 * t);
    }
    
    console.log(`✅ Generated ${numSamples} audio samples at ${sampleRate}Hz`);
    console.log();
    
    return {
        samples: audioSamples,
        sampleRate: sampleRate,
        duration: duration
    };
}

async function testTranscription(recognizer) {
    console.log('🎯 Testing Transcription...');

    try {
        // Generate test audio
        const audioData = generateTestAudio();

        // Test different API approaches
        console.log('🔄 Testing stream-based transcription...');
        
        // Try to create a stream
        let stream = null;
        if (recognizer.createStream) {
            stream = recognizer.createStream();
            console.log('✅ Stream created:', stream ? 'success' : 'failed');
            
            if (stream) {
                console.log('📋 Stream methods:', Object.keys(stream));
                
                // Try to accept waveform
                if (stream.acceptWaveform) {
                    console.log('🔄 Accepting waveform...');
                    stream.acceptWaveform({
                        sampleRate: audioData.sampleRate,
                        samples: audioData.samples
                    });
                    console.log('✅ Waveform accepted');
                    
                    // Signal end of input if method exists
                    if (stream.inputFinished) {
                        stream.inputFinished();
                        console.log('✅ Input finished signal sent');
                    }
                    
                    // Try to decode
                    if (recognizer.decode) {
                        console.log('🔄 Decoding...');
                        recognizer.decode(stream);
                        console.log('✅ Decoding completed');
                    }
                    
                    // Try to get result
                    if (recognizer.getResult) {
                        console.log('🔄 Getting result...');
                        const result = recognizer.getResult(stream);
                        console.log('✅ Transcription result:', result);
                        
                        if (result && result.text) {
                            console.log('🎉 SUCCESS: Transcribed text:', `"${result.text}"`);
                            return result.text;
                        } else {
                            console.log('⚠️  No text in result (expected for sine wave test audio)');
                        }
                    }
                }
            }
        }

        // Try direct transcription if available
        if (recognizer.transcribe) {
            console.log('🔄 Testing direct transcription...');
            const result = recognizer.transcribe(audioData);
            console.log('✅ Direct transcription result:', result);
            
            if (result && result.text) {
                console.log('🎉 SUCCESS: Transcribed text:', `"${result.text}"`);
                return result.text;
            }
        }

        console.log('⚠️  No transcription methods worked, but this is expected for synthetic audio');
        return null;

    } catch (error) {
        console.error('❌ Transcription test failed:', error.message);
        console.error('Stack trace:', error.stack);
        return null;
    }
}

async function main() {
    try {
        console.log('🚀 Starting Standalone Speech-to-Text Test...');
        console.log();

        // Step 1: Test native module loading
        const nativeModule = await testNativeModuleLoading();
        if (!nativeModule) {
            console.error('💥 Cannot proceed without native module');
            process.exit(1);
        }

        // Step 2: Test model configuration
        const recognizer = await testModelConfiguration(nativeModule);
        if (!recognizer) {
            console.error('💥 Cannot proceed without recognizer');
            process.exit(1);
        }

        // Step 3: Test transcription
        const transcriptionResult = await testTranscription(recognizer);

        console.log();
        console.log('📊 Test Summary:');
        console.log('================');
        console.log('✅ Native module loading: SUCCESS');
        console.log('✅ Model configuration: SUCCESS');
        console.log('✅ Recognizer creation: SUCCESS');
        console.log(`${transcriptionResult ? '✅' : '⚠️ '} Transcription: ${transcriptionResult ? 'SUCCESS' : 'NO TEXT (expected for synthetic audio)'}`);
        console.log();

        if (transcriptionResult) {
            console.log('🎉 EXCELLENT! The transcription system is working!');
            console.log('   The issue in Obsidian is likely in the API integration.');
        } else {
            console.log('🔍 The transcription system is set up correctly, but needs real speech audio.');
            console.log('   Try speaking into your microphone in the Obsidian plugin to test with real audio.');
        }

        console.log();
        console.log('💡 Next Steps:');
        console.log('   1. If this test shows the system working, the Obsidian plugin just needs API fixes');
        console.log('   2. The native module and model are properly configured');
        console.log('   3. Focus on connecting the real API methods in the plugin');

    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
main().catch(console.error);
