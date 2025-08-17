#!/usr/bin/env node

/**
 * Plugin Audio Debug Script
 * 
 * This script helps debug why the plugin gets empty results while
 * the test script works. It will analyze the audio processing differences.
 */

const fs = require('fs');
const path = require('path');
const mic = require('mic');

// Configuration
const PLUGIN_DIR = '/Users/skkoripe/Library/CloudStorage/GoogleDrive-sairamk0@gmail.com/My Drive/obsidian-files/Second brain/.obsidian/plugins/obsiscribe';
const NATIVE_LIB_DIR = path.join(PLUGIN_DIR, 'native-modules', 'sherpa-onnx-darwin-arm64');
const NATIVE_MODULE_PATH = path.join(NATIVE_LIB_DIR, 'sherpa-onnx.node');
const MODEL_DIR = path.join(PLUGIN_DIR, 'sherpa-onnx-moonshine-tiny-en-int8');

console.log('🔍 Plugin Audio Debug Analysis');
console.log('==============================');
console.log();

let sherpa = null;

async function loadSherpaONNX() {
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

function getModelConfig() {
    return {
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
}

function resampleAudio(inputSamples, inputSampleRate, outputSampleRate) {
    console.log(`🔄 Resampling audio: ${inputSampleRate}Hz → ${outputSampleRate}Hz`);
    
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.floor(inputSamples.length / ratio);
    const outputSamples = new Float32Array(outputLength);
    
    for (let i = 0; i < outputLength; i++) {
        const inputIndex = i * ratio;
        const inputIndexFloor = Math.floor(inputIndex);
        const inputIndexCeil = Math.min(inputIndexFloor + 1, inputSamples.length - 1);
        const fraction = inputIndex - inputIndexFloor;
        
        outputSamples[i] = inputSamples[inputIndexFloor] * (1 - fraction) + 
                          inputSamples[inputIndexCeil] * fraction;
    }
    
    console.log(`✅ Resampled: ${inputSamples.length} samples → ${outputSamples.length} samples`);
    return outputSamples;
}

function convertAudioBufferToFloat32Array(buffer, sampleRate) {
    console.log(`Converting audio buffer: ${buffer.byteLength} bytes at ${sampleRate}Hz`);
    
    // Handle odd-sized buffers
    let audioBuffer = buffer;
    if (buffer.byteLength % 2 !== 0) {
        console.log('Buffer has odd byte length, padding to even length');
        const paddedBuffer = new ArrayBuffer(buffer.byteLength + 1);
        const paddedView = new Uint8Array(paddedBuffer);
        const originalView = new Uint8Array(buffer);
        paddedView.set(originalView);
        paddedView[buffer.byteLength] = 0;
        audioBuffer = paddedBuffer;
    }
    
    // Convert ArrayBuffer to Int16Array
    const int16Array = new Int16Array(audioBuffer);
    
    // Convert Int16Array to Float32Array
    const float32Array = new Float32Array(int16Array.length);
    
    for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
    }
    
    console.log(`Converted audio buffer: ${buffer.byteLength} bytes -> ${float32Array.length} samples at ${sampleRate}Hz`);
    
    return float32Array;
}

function analyzeAudio(audioSamples, label) {
    let min = Infinity, max = -Infinity, sum = 0, sumSquares = 0;
    let nonZeroCount = 0;
    let peakCount = 0;
    
    for (let i = 0; i < audioSamples.length; i++) {
        const sample = audioSamples[i];
        min = Math.min(min, sample);
        max = Math.max(max, sample);
        sum += sample;
        sumSquares += sample * sample;
        
        if (Math.abs(sample) > 0.001) nonZeroCount++;
        if (Math.abs(sample) > 0.01) peakCount++;
    }
    
    const mean = sum / audioSamples.length;
    const variance = (sumSquares / audioSamples.length) - (mean * mean);
    const rms = Math.sqrt(variance);
    const dynamicRange = max - min;
    
    console.log(`📊 ${label} Audio Analysis:`);
    console.log(`   • Duration: ${(audioSamples.length / 16000).toFixed(2)} seconds`);
    console.log(`   • RMS level: ${rms.toFixed(6)}`);
    console.log(`   • Dynamic range: ${dynamicRange.toFixed(6)}`);
    console.log(`   • Min/Max: ${min.toFixed(6)} / ${max.toFixed(6)}`);
    console.log(`   • Active samples: ${nonZeroCount} (${(nonZeroCount/audioSamples.length*100).toFixed(1)}%)`);
    console.log(`   • Speech-like peaks: ${peakCount} (${(peakCount/audioSamples.length*100).toFixed(1)}%)`);
    
    return {
        duration: audioSamples.length / 16000,
        rms,
        dynamicRange,
        nonZeroCount,
        peakCount,
        min,
        max
    };
}

async function simulatePluginAudioProcessing() {
    console.log('🎤 Simulating Plugin Audio Processing...');
    console.log('========================================');
    
    await loadSherpaONNX();
    
    let audioChunks = [];
    let isRecording = false;
    let recordingStartTime = null;
    
    const micInstance = mic({
        rate: '48000',
        channels: '1',
        debug: false,
        exitOnSilence: 6,
        bitwidth: '16',
        device: 'default'
    });
    
    const micInputStream = micInstance.getAudioStream();
    
    micInputStream.on('data', (data) => {
        if (isRecording) {
            audioChunks.push(data);
            process.stdout.write('🔊');
        }
    });
    
    micInputStream.on('silence', async () => {
        const recordingDuration = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 0;
        console.log(`\n🔇 Silence detected after ${recordingDuration.toFixed(1)}s, processing...`);
        await processRecording();
    });
    
    async function processRecording() {
        if (!isRecording) return;
        
        console.log('\n🛑 Processing recording (simulating plugin workflow)...');
        isRecording = false;
        
        if (audioChunks.length === 0) {
            console.log('⚠️  No audio data captured');
            return;
        }
        
        // Combine audio chunks (same as plugin)
        const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedBuffer = Buffer.concat(audioChunks, totalLength);
        
        console.log(`✅ Captured ${combinedBuffer.length} bytes of raw audio`);
        
        // Convert to ArrayBuffer (same as plugin)
        const audioBuffer = combinedBuffer.buffer.slice(
            combinedBuffer.byteOffset,
            combinedBuffer.byteOffset + combinedBuffer.byteLength
        );
        
        console.log(`✅ Created ArrayBuffer: ${audioBuffer.byteLength} bytes`);
        
        // **PLUGIN SIMULATION**: Follow exact plugin workflow
        const audioData = {
            buffer: audioBuffer,
            sampleRate: 48000,
            duration: combinedBuffer.length / (48000 * 2) // 16-bit = 2 bytes per sample
        };
        
        console.log(`📊 Audio data: ${audioData.duration.toFixed(2)}s at ${audioData.sampleRate}Hz`);
        
        // Convert audio data to Float32Array (same as plugin)
        let audioSamples = convertAudioBufferToFloat32Array(audioData.buffer, audioData.sampleRate);
        console.log(`Audio samples converted: ${audioSamples.length} samples at ${audioData.sampleRate}Hz`);
        
        // Analyze original audio
        const originalAnalysis = analyzeAudio(audioSamples, 'ORIGINAL (48kHz)');
        
        // Resample audio (same as plugin)
        let finalSampleRate = audioData.sampleRate;
        if (audioData.sampleRate !== 16000) {
            console.log(`🔄 Resampling audio: ${audioData.sampleRate}Hz → 16000Hz`);
            audioSamples = resampleAudio(audioSamples, audioData.sampleRate, 16000);
            finalSampleRate = 16000;
            console.log(`✅ Resampled: ${audioSamples.length} samples at 16kHz`);
        }
        
        // Analyze resampled audio
        const resampledAnalysis = analyzeAudio(audioSamples, 'RESAMPLED (16kHz)');
        
        // Create recognizer and stream (same as plugin)
        const recognizer = sherpa.createOfflineRecognizer(getModelConfig());
        const stream = sherpa.createOfflineStream(recognizer);
        
        console.log('✅ Recognizer and stream created');
        
        // Process audio (same as plugin)
        sherpa.acceptWaveformOffline(stream, {
            sampleRate: finalSampleRate,
            samples: audioSamples
        });
        console.log('✅ Audio data accepted');
        
        sherpa.decodeOfflineStream(recognizer, stream);
        console.log('✅ Audio decoded');
        
        const resultJson = sherpa.getOfflineStreamResultAsJson(stream);
        const result = JSON.parse(resultJson);
        console.log('✅ Transcription completed');
        
        console.log();
        console.log('📊 PLUGIN SIMULATION RESULTS:');
        console.log('=============================');
        console.log('Raw transcription result:', result);
        
        if (result && result.text && result.text.trim()) {
            console.log('🎉 SUCCESS! Transcription:', result.text);
        } else {
            console.log('⚠️  No speech detected');
            
            console.log();
            console.log('🔍 DEBUGGING ANALYSIS:');
            console.log('======================');
            console.log('Original audio quality:', originalAnalysis.rms > 0.001 ? '✅ GOOD' : '❌ POOR');
            console.log('Resampled audio quality:', resampledAnalysis.rms > 0.001 ? '✅ GOOD' : '❌ POOR');
            console.log('Audio duration adequate:', resampledAnalysis.duration > 0.5 ? '✅ GOOD' : '❌ TOO SHORT');
            console.log('Speech-like content:', resampledAnalysis.peakCount > resampledAnalysis.nonZeroCount * 0.01 ? '✅ LIKELY' : '❌ UNLIKELY');
        }
        
        process.exit(0);
    }
    
    console.log('🎤 SPEAK NOW! (Plugin simulation mode)');
    console.log('   💡 Try: "Hello world, this is a test"');
    console.log('   ⏱️  Speak for at least 2-3 seconds');
    console.log('   Audio input: ');
    
    audioChunks = [];
    isRecording = true;
    recordingStartTime = Date.now();
    micInstance.start();
}

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n\n🛑 Manual stop requested...');
    process.exit(0);
});

console.log('🚀 Starting plugin audio debug analysis...');
console.log();
simulatePluginAudioProcessing().catch(console.error);
