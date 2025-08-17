#!/usr/bin/env node

/**
 * Audio Debug Script
 * 
 * This script helps diagnose audio capture and processing issues
 * by analyzing the captured audio and testing different formats.
 */

const fs = require('fs');
const path = require('path');
const mic = require('mic');

// Configuration
const PLUGIN_DIR = '/Users/skkoripe/Library/CloudStorage/GoogleDrive-sairamk0@gmail.com/My Drive/obsidian-files/Second brain/.obsidian/plugins/obsiscribe';
const NATIVE_LIB_DIR = path.join(PLUGIN_DIR, 'native-modules', 'sherpa-onnx-darwin-arm64');
const NATIVE_MODULE_PATH = path.join(NATIVE_LIB_DIR, 'sherpa-onnx.node');
const MODEL_DIR = path.join(PLUGIN_DIR, 'sherpa-onnx-moonshine-tiny-en-int8');

console.log('🔍 Audio Debug & Diagnostic Script');
console.log('==================================');
console.log();

let sherpa = null;
let recognizer = null;
let audioChunks = [];
let isRecording = false;

async function loadNativeModule() {
    console.log('📦 Loading native module...');
    
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
        if (originalPath) {
            process.env.DYLD_LIBRARY_PATH = originalPath;
        } else {
            delete process.env.DYLD_LIBRARY_PATH;
        }
    }
}

async function setupRecognizer() {
    console.log('⚙️  Setting up speech recognizer...');

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
            'debug': 1, // Enable debug for more info
        }
    };

    try {
        recognizer = sherpa.createOfflineRecognizer(config);
        console.log('✅ Speech recognizer ready!');
        return true;
    } catch (error) {
        console.error('❌ Failed to setup recognizer:', error.message);
        return false;
    }
}

function analyzeAudioData(audioSamples) {
    console.log('🔍 Analyzing captured audio...');
    
    // Calculate audio statistics
    let min = Infinity, max = -Infinity, sum = 0, sumSquares = 0;
    let nonZeroCount = 0;
    
    for (let i = 0; i < audioSamples.length; i++) {
        const sample = audioSamples[i];
        min = Math.min(min, sample);
        max = Math.max(max, sample);
        sum += sample;
        sumSquares += sample * sample;
        if (Math.abs(sample) > 0.001) nonZeroCount++; // Count significant samples
    }
    
    const mean = sum / audioSamples.length;
    const variance = (sumSquares / audioSamples.length) - (mean * mean);
    const rms = Math.sqrt(variance);
    const dynamicRange = max - min;
    
    console.log('📊 Audio Analysis:');
    console.log(`   • Sample count: ${audioSamples.length}`);
    console.log(`   • Duration: ${(audioSamples.length / 16000).toFixed(2)} seconds`);
    console.log(`   • Min value: ${min.toFixed(6)}`);
    console.log(`   • Max value: ${max.toFixed(6)}`);
    console.log(`   • Mean: ${mean.toFixed(6)}`);
    console.log(`   • RMS: ${rms.toFixed(6)}`);
    console.log(`   • Dynamic range: ${dynamicRange.toFixed(6)}`);
    console.log(`   • Non-zero samples: ${nonZeroCount} (${(nonZeroCount/audioSamples.length*100).toFixed(1)}%)`);
    
    // Determine if audio looks like speech
    const hasSignificantAudio = nonZeroCount > audioSamples.length * 0.1; // At least 10% non-zero
    const hasGoodDynamicRange = dynamicRange > 0.01; // Some variation
    const hasReasonableRMS = rms > 0.001 && rms < 1.0; // Not too quiet or too loud
    
    console.log();
    console.log('🎯 Audio Quality Assessment:');
    console.log(`   • Has significant audio: ${hasSignificantAudio ? '✅' : '❌'}`);
    console.log(`   • Has good dynamic range: ${hasGoodDynamicRange ? '✅' : '❌'}`);
    console.log(`   • Has reasonable RMS: ${hasReasonableRMS ? '✅' : '❌'}`);
    
    const audioQualityGood = hasSignificantAudio && hasGoodDynamicRange && hasReasonableRMS;
    console.log(`   • Overall quality: ${audioQualityGood ? '✅ GOOD' : '❌ POOR'}`);
    
    return {
        sampleCount: audioSamples.length,
        duration: audioSamples.length / 16000,
        min, max, mean, rms, dynamicRange,
        nonZeroCount,
        qualityGood: audioQualityGood
    };
}

function setupMicrophone() {
    console.log('🎙️  Setting up microphone with debug info...');
    
    // Try different microphone configurations
    const micInstance = mic({
        rate: '16000',
        channels: '1',
        debug: true,           // Enable debug to see what's happening
        exitOnSilence: 10,     // Longer silence detection
        bitwidth: '16',
        device: 'default'      // Use default device
    });
    
    const micInputStream = micInstance.getAudioStream();
    
    micInputStream.on('data', (data) => {
        if (isRecording) {
            audioChunks.push(data);
            process.stdout.write('🔊');
        }
    });
    
    micInputStream.on('error', (err) => {
        console.error('❌ Microphone error:', err);
    });
    
    micInputStream.on('silence', () => {
        console.log('\n🔇 Silence detected, stopping recording...');
        stopRecording();
    });
    
    console.log('✅ Microphone ready with debug enabled!');
    return micInstance;
}

function startRecording(micInstance) {
    console.log('🎤 SPEAK LOUDLY AND CLEARLY NOW!');
    console.log('   (Try saying: "Hello world, this is a test")');
    console.log('   Audio input: ');
    
    audioChunks = [];
    isRecording = true;
    micInstance.start();
}

async function stopRecording() {
    if (!isRecording) return;
    
    console.log('\n🛑 Stopping recording...');
    isRecording = false;
    
    if (audioChunks.length === 0) {
        console.log('⚠️  No audio data captured - microphone issue?');
        return;
    }
    
    // Combine audio chunks
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedBuffer = Buffer.concat(audioChunks, totalLength);
    
    console.log(`✅ Captured ${combinedBuffer.length} bytes of raw audio`);
    
    // Convert to Float32Array
    const audioSamples = new Float32Array(combinedBuffer.length / 2);
    for (let i = 0; i < audioSamples.length; i++) {
        const sample = combinedBuffer.readInt16LE(i * 2);
        audioSamples[i] = sample / 32768.0;
    }
    
    console.log(`✅ Converted to ${audioSamples.length} float samples`);
    console.log();
    
    // Analyze the audio
    const analysis = analyzeAudioData(audioSamples);
    
    console.log();
    
    if (!analysis.qualityGood) {
        console.log('⚠️  Audio quality issues detected!');
        console.log('💡 Possible solutions:');
        console.log('   • Check microphone permissions in System Preferences');
        console.log('   • Try a different microphone or headset');
        console.log('   • Increase microphone volume in system settings');
        console.log('   • Reduce background noise');
        console.log();
    }
    
    // Try transcription anyway
    await testTranscription(audioSamples, analysis);
}

async function testTranscription(audioSamples, analysis) {
    console.log('🔄 Testing transcription with captured audio...');
    
    try {
        // Create a new stream for each transcription attempt
        const stream = sherpa.createOfflineStream(recognizer);
        
        // Accept waveform
        sherpa.acceptWaveformOffline(stream, {
            sampleRate: 16000,
            samples: audioSamples
        });
        console.log('✅ Audio data accepted by recognizer');
        
        // Decode
        sherpa.decodeOfflineStream(recognizer, stream);
        console.log('✅ Audio decoded by recognizer');
        
        // Get result
        const resultJson = sherpa.getOfflineStreamResultAsJson(stream);
        const result = JSON.parse(resultJson);
        
        console.log('✅ Transcription completed');
        console.log();
        
        displayResults(result, analysis);
        
    } catch (error) {
        console.error('❌ Transcription failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

function displayResults(result, analysis) {
    console.log('📊 FINAL RESULTS:');
    console.log('=================');
    
    if (result && result.text && result.text.trim()) {
        console.log('🎉 SUCCESS! Transcribed text:');
        console.log(`   "${result.text}"`);
        console.log();
        console.log('🎊 The speech-to-text system is working perfectly!');
    } else {
        console.log('⚠️  No speech detected in transcription');
        console.log();
        console.log('🔍 Diagnostic Information:');
        console.log(`   • Audio captured: ${analysis.qualityGood ? '✅ Good quality' : '❌ Poor quality'}`);
        console.log(`   • Audio duration: ${analysis.duration.toFixed(2)} seconds`);
        console.log(`   • Audio level: ${analysis.rms.toFixed(6)} RMS`);
        console.log();
        
        if (analysis.qualityGood) {
            console.log('💡 Audio quality is good but no speech detected. Possible reasons:');
            console.log('   • Moonshine model may need clearer speech patterns');
            console.log('   • Try speaking more distinctly');
            console.log('   • Try simple phrases like "Hello world"');
            console.log('   • Model might be optimized for specific accents/languages');
        } else {
            console.log('💡 Audio quality issues detected. Try:');
            console.log('   • Check microphone permissions');
            console.log('   • Increase microphone volume');
            console.log('   • Use a better microphone');
            console.log('   • Reduce background noise');
        }
    }
    
    console.log();
    console.log('🔍 Raw transcription result:');
    console.log(JSON.stringify(result, null, 2));
}

async function main() {
    try {
        console.log('🚀 Starting Audio Debug Session...');
        console.log();
        
        // Load and setup
        await loadNativeModule();
        const setupSuccess = await setupRecognizer();
        if (!setupSuccess) {
            console.error('💥 Failed to setup recognizer');
            process.exit(1);
        }
        
        const micInstance = setupMicrophone();
        
        console.log();
        console.log('🎤 READY FOR DIAGNOSTIC RECORDING!');
        console.log('==================================');
        console.log('📋 Instructions:');
        console.log('   • Speak VERY CLEARLY and LOUDLY');
        console.log('   • Try: "Hello world, this is a test"');
        console.log('   • Speak for 3-5 seconds');
        console.log('   • Press Ctrl+C to stop manually');
        console.log();
        
        startRecording(micInstance);
        
    } catch (error) {
        console.error('💥 Debug session failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n\n🛑 Manual stop requested...');
    stopRecording().then(() => {
        console.log('👋 Debug session complete!');
        process.exit(0);
    });
});

console.log('🔍 This script will help diagnose audio capture and transcription issues');
console.log('Press Ctrl+C to stop at any time');
console.log();
main().catch(console.error);
