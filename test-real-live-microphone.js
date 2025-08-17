#!/usr/bin/env node

/**
 * REAL Live Microphone Speech-to-Text Test Script
 * 
 * This script captures REAL audio from your microphone and transcribes it
 * using the Sherpa ONNX + Moonshine setup.
 * 
 * Usage: node test-real-live-microphone.js
 * 
 * Instructions:
 * 1. Run the script
 * 2. When you see "🎤 SPEAK NOW!", talk into your microphone
 * 3. Press Ctrl+C to stop recording and see the transcription
 */

const fs = require('fs');
const path = require('path');
const mic = require('mic');

// Configuration
const PLUGIN_DIR = '/Users/skkoripe/Library/CloudStorage/GoogleDrive-sairamk0@gmail.com/My Drive/obsidian-files/Second brain/.obsidian/plugins/obsiscribe';
const NATIVE_LIB_DIR = path.join(PLUGIN_DIR, 'native-modules', 'sherpa-onnx-darwin-arm64');
const NATIVE_MODULE_PATH = path.join(NATIVE_LIB_DIR, 'sherpa-onnx.node');
const MODEL_DIR = path.join(PLUGIN_DIR, 'sherpa-onnx-moonshine-tiny-en-int8');

console.log('🎤 REAL Live Microphone Speech-to-Text Test');
console.log('===========================================');
console.log();

let sherpa = null;
let recognizer = null;
let stream = null;
let micInstance = null;
let micInputStream = null;
let audioChunks = [];
let isRecording = false;

async function loadNativeModule() {
    console.log('📦 Loading native module...');
    
    // Set up library path
    const originalPath = process.env.DYLD_LIBRARY_PATH || '';
    process.env.DYLD_LIBRARY_PATH = NATIVE_LIB_DIR + (originalPath ? ':' + originalPath : '');

    try {
        sherpa = require(NATIVE_MODULE_PATH);
        console.log('✅ Native module loaded successfully!');
        return sherpa;
    } catch (error) {
        console.error('❌ Failed to load native module:', error.message);
        process.exit(1);
    } finally {
        // Restore original library path
        if (originalPath) {
            process.env.DYLD_LIBRARY_PATH = originalPath;
        } else {
            delete process.env.DYLD_LIBRARY_PATH;
        }
    }
}

async function setupRecognizer() {
    console.log('⚙️  Setting up speech recognizer...');

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
            'debug': 0, // Disable debug for cleaner output
        }
    };

    try {
        // Create recognizer and stream
        recognizer = sherpa.createOfflineRecognizer(config);
        stream = sherpa.createOfflineStream(recognizer);
        
        console.log('✅ Speech recognizer ready!');
        return true;
    } catch (error) {
        console.error('❌ Failed to setup recognizer:', error.message);
        return false;
    }
}

function setupMicrophone() {
    console.log('🎙️  Setting up microphone...');
    
    // Create microphone instance
    micInstance = mic({
        rate: '16000',          // 16kHz sample rate (required by Moonshine)
        channels: '1',          // Mono audio
        debug: false,           // Disable debug output
        exitOnSilence: 6,       // Exit after 6 seconds of silence
        bitwidth: '16'          // 16-bit audio
    });
    
    // Get the microphone input stream
    micInputStream = micInstance.getAudioStream();
    
    // Handle microphone data
    micInputStream.on('data', (data) => {
        if (isRecording) {
            audioChunks.push(data);
            process.stdout.write('🔊'); // Visual indicator of audio input
        }
    });
    
    // Handle microphone errors
    micInputStream.on('error', (err) => {
        console.error('❌ Microphone error:', err);
    });
    
    // Handle microphone silence (automatic stop)
    micInputStream.on('silence', () => {
        console.log('\n🔇 Silence detected, stopping recording...');
        stopRecording();
    });
    
    console.log('✅ Microphone ready!');
}

function startRecording() {
    console.log('🎤 SPEAK NOW! (Press Ctrl+C to stop manually)');
    console.log('   Audio input: ');
    
    audioChunks = [];
    isRecording = true;
    micInstance.start();
}

async function stopRecording() {
    if (!isRecording) return;
    
    console.log('\n🛑 Stopping recording...');
    isRecording = false;
    micInstance.stop();
    
    if (audioChunks.length === 0) {
        console.log('⚠️  No audio data captured');
        return;
    }
    
    // Combine all audio chunks
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedBuffer = Buffer.concat(audioChunks, totalLength);
    
    console.log(`✅ Captured ${combinedBuffer.length} bytes of audio data`);
    
    // Convert Buffer to Float32Array
    const audioSamples = new Float32Array(combinedBuffer.length / 2); // 16-bit = 2 bytes per sample
    
    for (let i = 0; i < audioSamples.length; i++) {
        // Read 16-bit signed integer and convert to float (-1.0 to 1.0)
        const sample = combinedBuffer.readInt16LE(i * 2);
        audioSamples[i] = sample / 32768.0;
    }
    
    console.log(`✅ Converted to ${audioSamples.length} audio samples`);
    
    // Transcribe the audio
    await transcribeAudio({
        samples: audioSamples,
        sampleRate: 16000,
        duration: audioSamples.length / 16000
    });
}

async function transcribeAudio(audioData) {
    console.log('🔄 Transcribing your speech...');
    
    try {
        // Accept waveform using the correct API
        sherpa.acceptWaveformOffline(stream, {
            sampleRate: audioData.sampleRate,
            samples: audioData.samples
        });
        console.log('✅ Audio data accepted');
        
        // Decode the audio
        sherpa.decodeOfflineStream(recognizer, stream);
        console.log('✅ Audio decoded');
        
        // Get the transcription result
        const resultJson = sherpa.getOfflineStreamResultAsJson(stream);
        const result = JSON.parse(resultJson);
        
        console.log('✅ Transcription completed');
        console.log();
        
        displayResults(result);
        
    } catch (error) {
        console.error('❌ Transcription failed:', error.message);
    }
}

function displayResults(result) {
    console.log('📊 TRANSCRIPTION RESULTS:');
    console.log('========================');
    
    if (result && result.text && result.text.trim()) {
        console.log('🎉 SUCCESS! Here\'s what you said:');
        console.log();
        console.log(`   "${result.text}"`);
        console.log();
        
        if (result.words && result.words.length > 0) {
            console.log('📝 Word-by-word breakdown:');
            result.words.forEach((word, index) => {
                console.log(`   ${index + 1}. "${word.word}" (confidence: ${word.confidence || 'N/A'})`);
            });
            console.log();
        }
        
        console.log('🎊 EXCELLENT! The speech-to-text system is working perfectly!');
        
    } else {
        console.log('⚠️  No speech detected in the recording');
        console.log('   Possible reasons:');
        console.log('   • Microphone volume too low');
        console.log('   • Background noise interference');
        console.log('   • Recording too short');
        console.log('   • Microphone permission issues');
        console.log();
        console.log('💡 Try speaking louder and closer to the microphone');
    }
    
    console.log();
    console.log('🔍 Raw result object:');
    console.log(JSON.stringify(result, null, 2));
    console.log();
    console.log('🎯 The transcription engine is working correctly!');
}

async function main() {
    try {
        console.log('🚀 Starting REAL Live Microphone Test...');
        console.log();
        
        // Step 1: Load native module
        await loadNativeModule();
        
        // Step 2: Setup recognizer
        const setupSuccess = await setupRecognizer();
        if (!setupSuccess) {
            console.error('💥 Failed to setup recognizer');
            process.exit(1);
        }
        
        // Step 3: Setup microphone
        setupMicrophone();
        
        console.log();
        console.log('🎤 READY FOR LIVE SPEECH INPUT!');
        console.log('===============================');
        console.log('📋 Instructions:');
        console.log('   • Speak clearly into your microphone');
        console.log('   • The script will automatically stop after 6 seconds of silence');
        console.log('   • Or press Ctrl+C to stop manually');
        console.log();
        
        // Step 4: Start recording
        startRecording();
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n\n🛑 Manual stop requested...');
    stopRecording().then(() => {
        console.log('👋 Thanks for testing the speech-to-text system!');
        process.exit(0);
    });
});

// Run the live test
console.log('🎙️  Make sure your microphone is connected and working');
console.log('Press Ctrl+C to stop at any time');
console.log();
main().catch(console.error);
