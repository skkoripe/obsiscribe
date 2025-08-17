#!/usr/bin/env node

/**
 * FIXED Live Microphone Speech-to-Text Script
 * 
 * This script fixes the sample rate mismatch issue by properly resampling
 * audio from 48kHz (microphone) to 16kHz (Moonshine requirement).
 */

const fs = require('fs');
const path = require('path');
const mic = require('mic');

// Configuration
const PLUGIN_DIR = '/Users/skkoripe/Library/CloudStorage/GoogleDrive-sairamk0@gmail.com/My Drive/obsidian-files/Second brain/.obsidian/plugins/obsiscribe';
const NATIVE_LIB_DIR = path.join(PLUGIN_DIR, 'native-modules', 'sherpa-onnx-darwin-arm64');
const NATIVE_MODULE_PATH = path.join(NATIVE_LIB_DIR, 'sherpa-onnx.node');
const MODEL_DIR = path.join(PLUGIN_DIR, 'sherpa-onnx-moonshine-tiny-en-int8');

console.log('🎤 FIXED Live Microphone Speech-to-Text');
console.log('======================================');
console.log('🔧 Now with proper sample rate conversion!');
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
            'sampleRate': 16000,  // Moonshine expects 16kHz
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
        recognizer = sherpa.createOfflineRecognizer(config);
        console.log('✅ Speech recognizer ready!');
        return true;
    } catch (error) {
        console.error('❌ Failed to setup recognizer:', error.message);
        return false;
    }
}

function resampleAudio(inputSamples, inputSampleRate, outputSampleRate) {
    console.log(`🔄 Resampling audio: ${inputSampleRate}Hz → ${outputSampleRate}Hz`);
    
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.floor(inputSamples.length / ratio);
    const outputSamples = new Float32Array(outputLength);
    
    // Simple linear interpolation resampling
    for (let i = 0; i < outputLength; i++) {
        const inputIndex = i * ratio;
        const inputIndexFloor = Math.floor(inputIndex);
        const inputIndexCeil = Math.min(inputIndexFloor + 1, inputSamples.length - 1);
        const fraction = inputIndex - inputIndexFloor;
        
        // Linear interpolation between two samples
        outputSamples[i] = inputSamples[inputIndexFloor] * (1 - fraction) + 
                          inputSamples[inputIndexCeil] * fraction;
    }
    
    console.log(`✅ Resampled: ${inputSamples.length} samples → ${outputSamples.length} samples`);
    return outputSamples;
}

function setupMicrophone() {
    console.log('🎙️  Setting up microphone...');
    console.log('   📝 Note: Microphone will record at 48kHz, then we\'ll resample to 16kHz');
    
    // Accept the microphone's native sample rate (48kHz)
    const micInstance = mic({
        rate: '48000',         // Accept 48kHz from microphone
        channels: '1',         // Mono audio
        debug: false,          // Disable debug for cleaner output
        exitOnSilence: 6,      // Exit after 6 seconds of silence
        bitwidth: '16'         // 16-bit audio
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
    
    console.log('✅ Microphone ready (48kHz capture)!');
    return micInstance;
}

function startRecording(micInstance) {
    console.log('🎤 SPEAK NOW! (Will auto-stop after silence)');
    console.log('   💡 Try: "Hello world, this is a test"');
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
        console.log('⚠️  No audio data captured');
        return;
    }
    
    // Combine audio chunks
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedBuffer = Buffer.concat(audioChunks, totalLength);
    
    console.log(`✅ Captured ${combinedBuffer.length} bytes of raw audio`);
    
    // Convert Buffer to Float32Array (48kHz audio)
    const audioSamples48k = new Float32Array(combinedBuffer.length / 2);
    for (let i = 0; i < audioSamples48k.length; i++) {
        const sample = combinedBuffer.readInt16LE(i * 2);
        audioSamples48k[i] = sample / 32768.0;
    }
    
    console.log(`✅ Converted to ${audioSamples48k.length} samples at 48kHz`);
    
    // **FIX: Resample from 48kHz to 16kHz**
    const audioSamples16k = resampleAudio(audioSamples48k, 48000, 16000);
    
    console.log(`✅ Resampled to ${audioSamples16k.length} samples at 16kHz`);
    console.log(`   Duration: ${(audioSamples16k.length / 16000).toFixed(2)} seconds`);
    
    // Analyze the resampled audio quality
    analyzeAudio(audioSamples16k);
    
    // Transcribe the properly resampled audio
    await transcribeAudio({
        samples: audioSamples16k,
        sampleRate: 16000,  // Now correctly 16kHz
        duration: audioSamples16k.length / 16000
    });
}

function analyzeAudio(audioSamples) {
    let min = Infinity, max = -Infinity, sum = 0, sumSquares = 0;
    let nonZeroCount = 0;
    
    for (let i = 0; i < audioSamples.length; i++) {
        const sample = audioSamples[i];
        min = Math.min(min, sample);
        max = Math.max(max, sample);
        sum += sample;
        sumSquares += sample * sample;
        if (Math.abs(sample) > 0.001) nonZeroCount++;
    }
    
    const mean = sum / audioSamples.length;
    const variance = (sumSquares / audioSamples.length) - (mean * mean);
    const rms = Math.sqrt(variance);
    
    console.log('📊 Resampled Audio Analysis:');
    console.log(`   • Sample count: ${audioSamples.length}`);
    console.log(`   • Duration: ${(audioSamples.length / 16000).toFixed(2)} seconds`);
    console.log(`   • RMS level: ${rms.toFixed(6)}`);
    console.log(`   • Dynamic range: ${(max - min).toFixed(6)}`);
    console.log(`   • Active samples: ${nonZeroCount} (${(nonZeroCount/audioSamples.length*100).toFixed(1)}%)`);
}

async function transcribeAudio(audioData) {
    console.log('🔄 Transcribing resampled audio...');
    
    try {
        // Create a new stream
        const stream = sherpa.createOfflineStream(recognizer);
        
        // Accept waveform with correct sample rate
        sherpa.acceptWaveformOffline(stream, {
            sampleRate: audioData.sampleRate,  // Now correctly 16000
            samples: audioData.samples
        });
        console.log('✅ Audio data accepted (16kHz)');
        
        // Decode
        sherpa.decodeOfflineStream(recognizer, stream);
        console.log('✅ Audio decoded');
        
        // Get result
        const resultJson = sherpa.getOfflineStreamResultAsJson(stream);
        const result = JSON.parse(resultJson);
        
        console.log('✅ Transcription completed');
        console.log();
        
        displayResults(result);
        
    } catch (error) {
        console.error('❌ Transcription failed:', error.message);
        console.error('Stack trace:', error.stack);
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
        console.log('🔧 Sample rate conversion fixed the issue!');
        
    } else {
        console.log('⚠️  No speech detected in the recording');
        console.log();
        console.log('💡 Possible reasons:');
        console.log('   • Try speaking louder and more clearly');
        console.log('   • Use simple phrases like "Hello world"');
        console.log('   • Ensure good microphone quality');
        console.log('   • Reduce background noise');
        console.log();
        console.log('🔧 Note: Sample rate is now correctly converted (48kHz → 16kHz)');
    }
    
    console.log();
    console.log('🔍 Raw transcription result:');
    console.log(JSON.stringify(result, null, 2));
}

async function main() {
    try {
        console.log('🚀 Starting FIXED Live Microphone Test...');
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
        console.log('🎤 READY FOR SPEECH INPUT!');
        console.log('==========================');
        console.log('🔧 FIXED: Now properly converts 48kHz → 16kHz');
        console.log();
        console.log('📋 Instructions:');
        console.log('   • Speak clearly into your microphone');
        console.log('   • Try: "Hello world, this is a test"');
        console.log('   • Will auto-stop after 6 seconds of silence');
        console.log('   • Or press Ctrl+C to stop manually');
        console.log();
        
        startRecording(micInstance);
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n\n🛑 Manual stop requested...');
    stopRecording().then(() => {
        console.log('👋 Thanks for testing the FIXED speech-to-text system!');
        process.exit(0);
    });
});

console.log('🔧 This script fixes the sample rate mismatch issue');
console.log('   Microphone: 48kHz → Resampling → Moonshine: 16kHz');
console.log();
main().catch(console.error);
