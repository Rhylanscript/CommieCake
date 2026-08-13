// public/js/sound.js

const MIN_FREQ = 200;
const MAX_FREQ = 880;

let audioCtx = null;
let enabled = false;

const customBufferCache = new Map();

function getOrCreateAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

export function isSoundEnabled() {
    return enabled;
}

export function setSoundEnabled(next) {
    enabled = next;
    const ctx = getOrCreateAudioContext();
    if (enabled && ctx.state === 'suspended') { // yo thats frickin sus
        ctx.resume();
    }
}

function frequencyFor(value, maxValue) {
    const ratio = Math.min(1, Math.max(0, value / maxValue));
    return MIN_FREQ + ratio * (MAX_FREQ - MIN_FREQ);
}

function playTone({ frequency, durationSec, waveform, peakGain }) {
    if (!enabled || !audioCtx) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = waveform;
    oscillator.frequency.value = frequency;

    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(now);
    oscillator.stop(now + durationSec);
}

export function playComparisonTone(value, maxValue) {
    playTone({
        frequency: frequencyFor(value, maxValue),
        durationSec: 0.05,
        waveform: 'sine',
        peakGain: 0.06,
    });
}

export function playSwapTone(value, maxValue) {
    playTone({
        frequency: frequencyFor(value, maxValue),
        durationSec: 0.08,
        waveform: 'triangle',
        peakGain: 0.08,
    });
}

export function playCompletionChime() {
    if (!enabled || !audioCtx) return;
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
        setTimeout(() => {
            playTone({ 
                frequency: freq, 
                durationSec: 0.12,
                waveform: 'sine',
                peakGain: 0.07,
            });
        }, i * 70);
    });
}

// custom sound stuff

export function isCustomSoundReady(url) {
    return customBufferCache.get(url) instanceof AudioBuffer;
}

export async function preloadCustomSound(url) {
    if (customBufferCache.has(url)) return;
    customBufferCache.set(url, 'loading');
    try {
        const ctx = getOrCreateAudioContext();
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        customBufferCache.set(url, audioBuffer);
    } catch (err) {
        console.error(`Failed to load custom sound: ${url}`, err);
        customBufferCache.set(url, 'error');
    }
}

export function preloadCustomSounds(urls) {
	urls.forEach((url) => preloadCustomSound(url));
}

export function playCustomSample(url, value, maxValue) {
	if (!enabled || !audioCtx) return;
	const buffer = customBufferCache.get(url);
	if (!(buffer instanceof AudioBuffer)) return;

	const source = audioCtx.createBufferSource();
	source.buffer = buffer;

	const ratio = Math.min(1, Math.max(0, value / maxValue));
	source.playbackRate.value = 0.75 + ratio * 0.75; // 0.75x-1.5x speed

	const gainNode = audioCtx.createGain();
	gainNode.gain.value = 0.5;

	source.connect(gainNode);
	gainNode.connect(audioCtx.destination);
	source.start();
}
