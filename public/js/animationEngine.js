// public/js/animationEngine.js

import { drawBars } from './renderer.js';
import { playCompletionChime } from './sound.js';
import { getAlgorithmForSlot, syncPickerLabel } from './commandPalette.js';
import { getCurrentElapsedMs, resetTimer, startTimerSegment, pauseTimerSegment, setTimerDisplayText } from './timer.js';
import { resetCounters, tallyTrackStep } from './counters.js';
import { isCodePanelOpen, setCodePanelOpen, refreshCodePanelIfOpen, setCodePanelDisabled } from './codePanel.js';
import { showBenchmarkLoading, runBenchmark } from './benchmark.js';
import { updateDescription } from './descriptionPopup.js';
import { playSoundForStep } from './soundBridge.js';
import { closeAllStatsPopups } from './statsPopup.js';

// --- get the elements ---
const appEl = document.getElementById('app');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasB = document.getElementById('canvas-b');
const ctxB = canvasB.getContext('2d');

const algoPickerLabelEl = document.getElementById('algo-picker-label');

const algoBControlGroupEl = document.getElementById('algo-b-control-group');
const descriptionRowEl = document.getElementById('description-row');

const sizeSlider = document.getElementById('size-slider');
const sizeNumber = document.getElementById('size-number');
const speedSlider = document.getElementById('speed-slider');
const speedNumber = document.getElementById('speed-number');

const newArrayBtn = document.getElementById('new-array-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const stepBtn = document.getElementById('step-btn');
const benchmarkBtn = document.getElementById('benchmark-btn');
const raceToggleBtn = document.getElementById('race-toggle-btn');

const timeComplexityValueEl = document.getElementById('time-complexity-value');
const timeComplexityValueBEl = document.getElementById('time-complexity-value-b');
const spaceComplexityValueEl = document.getElementById('space-complexity-value');
const spaceComplexityValueBEl = document.getElementById('space-complexity-value-b');
const stableValueEl = document.getElementById('stable-value');
const stableValueBEl = document.getElementById('stable-value-b');
const inPlaceValueEl = document.getElementById('in-place-value');
const inPlaceValueBEl = document.getElementById('in-place-value-b');

const trackRowBEl = document.getElementById('track-row-b');
const canvasLabelAEl = document.getElementById('canvas-label-a');
const canvasLabelBEl = document.getElementById('canvas-label-b');

const winnerBadgeAEl = document.getElementById('winner-badge-a');
const winnerBadgeBEl = document.getElementById('winner-badge-b');

// --- state ---
let currentArray = [];
let currentMaxValue = 1;
let isPlaying = false;
let animationTimeoutId = null;
let animationFrameId = null;

// --- race mode state ---
let isRaceMode = false;
let generatorA = null;
let generatorB = null;
let trackADone = false;
let trackBDone = false;
let trackAFinishMs = null;
let trackBFinishMs = null;

// --- speed curve tuning ---
const MAX_TICK_MS = 220;
const FRAME_TICK_MS = 16;
const BATCH_START_SPEED = 350;
const SPEED_MAX = 500;
const MAX_STEPS_PER_TICK = 4000;
const FRAME_BUDGET_MS = 8;

// --- public api ---

export function initAnimationEngine() {
	bindRangeToNumber(sizeSlider, sizeNumber, () => {});
	bindRangeToNumber(speedSlider, speedNumber, () => {});

	newArrayBtn.addEventListener('click', handleNewArray);
	playPauseBtn.addEventListener('click', togglePlayPause);
	stepBtn.addEventListener('click', handleStep);
	benchmarkBtn.addEventListener('click', handleBenchmark);
	raceToggleBtn.addEventListener('click', toggleRaceMode);
}

export function getSelectedAlgorithm() {
	return getAlgorithmForSlot('A');
}

export function isRaceModeOn() {
	return isRaceMode;
}

export function getCurrentMaxValue() {
	return currentMaxValue;
}

export function getTrackStatus(slot) {
	return {
		isDone: slot === 'A' ? trackADone : trackBDone,
		finishMs: slot === 'A' ? trackAFinishMs : trackBFinishMs,
	};
}

export function updateStatLabels() {
	const algoA = getAlgorithmForSlot('A');
	timeComplexityValueEl.textContent = algoA.time;
	spaceComplexityValueEl.textContent = algoA.space;
	stableValueEl.textContent = algoA.stable;
	inPlaceValueEl.textContent = algoA.inPlace;

	if (isRaceMode) {
		const algoB = getAlgorithmForSlot('B');
		timeComplexityValueBEl.textContent = algoB.time;
		spaceComplexityValueBEl.textContent = algoB.space;
		stableValueBEl.textContent = algoB.stable;
		inPlaceValueBEl.textContent = algoB.inPlace;
	}
}

export function updateTrackLabels() {
	canvasLabelAEl.textContent = getAlgorithmForSlot('A').name;
	if (isRaceMode) canvasLabelBEl.textContent = getAlgorithmForSlot('B').name;
}

// dispatched by the command palette module whenever a pick changes a slot's selection
export function handleAlgorithmSelect(slot) {
	if (slot === 'B') handleAlgorithmChangeB();
	else handleAlgorithmChangeA();
}

export function handleNewArray() {
	const size = Number(sizeSlider.value);
	currentArray = generateShuffledArray(size);
	currentMaxValue = size;
	stopPlaybackLoop();
	resetRaceState();
	resetTimer();
	restoreVisualizerView();
	renderCurrentArray();
}

export function togglePlayPause() {
	if (isPlaying) {
		stopPlaybackLoop();
		return;
	}

	restoreVisualizerView();

	if (isEverythingDone()) {
		resetRaceState();
		resetTimer();
		renderCurrentArray();
	}

	isPlaying = true;
	playPauseBtn.textContent = 'Pause';
	startTimerSegment();
	runAnimationLoop();
}

export function handleStep() {
	restoreVisualizerView();
	stopPlaybackLoop();

	if (isEverythingDone()) {
		resetRaceState();
		resetTimer();
		renderCurrentArray();
		return;
	}

	advanceOneStep();
}

// --- rendering ---

function generateShuffledArray(size) {
	const values = Array.from({ length: size }, (_, i) => i + 1);
	for (let i = values.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[values[i], values[j]] = [values[j], values[i]];
	}
	return values;
}

function drawTrack(slot, stepData) {
	const targetCtx = slot === 'A' ? ctx : ctxB;
	const targetCanvas = slot === 'A' ? canvas : canvasB;
	drawBars(targetCtx, targetCanvas, stepData ?? { array: currentArray }, currentMaxValue);
}

function renderCurrentArray() {
	drawTrack('A', null);
	if (isRaceMode) drawTrack('B', null);
}

function restoreVisualizerView() {
	canvas.classList.remove('no-grid');
	updateStatLabels();
}

// --- sorting / animation ---

function stopPlaybackLoop() {
	isPlaying = false;
	playPauseBtn.textContent = 'Start';
	clearTimeout(animationTimeoutId);
	cancelAnimationFrame(animationFrameId);
	pauseTimerSegment();
}

function resetRaceState() {
	generatorA = null;
	generatorB = null;
	trackADone = false;
	trackBDone = false;
	trackAFinishMs = null;
	trackBFinishMs = null;
	resetCounters();
	winnerBadgeAEl.classList.remove('visible');
	winnerBadgeBEl.classList.remove('visible');
}

function handleAlgorithmChangeA() {
	stopPlaybackLoop();
	resetRaceState();
	resetTimer();
	restoreVisualizerView();
	updateDescription();
	updateTrackLabels();
	renderCurrentArray();
	refreshCodePanelIfOpen();
	closeAllStatsPopups();
}

function handleAlgorithmChangeB() {
	stopPlaybackLoop();
	resetRaceState();
	resetTimer();
	updateStatLabels();
	updateTrackLabels();
	renderCurrentArray();
	closeAllStatsPopups();
}

function getNextTrackStep(slot) {
	const isA = slot === 'A';
	if (isA ? trackADone : trackBDone) return null;

	let gen = isA ? generatorA : generatorB;
	if (!gen) {
		gen = getAlgorithmForSlot(slot).run(currentArray);
		if (isA) generatorA = gen;
		else generatorB = gen;
	}

	const result = gen.next();
	if (result.done) {
		if (isA) {
			trackADone = true;
			trackAFinishMs = getCurrentElapsedMs();
		} else {
			trackBDone = true;
			trackBFinishMs = getCurrentElapsedMs();
		}
		return null;
	}

	tallyTrackStep(slot, result.value);
	return result.value;
}

function isEverythingDone() {
	return isRaceMode ? trackADone && trackBDone : trackADone;
}

function showRaceBanner() {
	if (!isRaceMode) return;

	if (trackAFinishMs === trackBFinishMs) {
		winnerBadgeAEl.textContent = "Draw!";
		winnerBadgeBEl.textContent = "Draw!";
		winnerBadgeAEl.classList.add('visible');
		winnerBadgeBEl.classList.add('visible');
		return;
	}

	if (trackAFinishMs < trackBFinishMs) {
		winnerBadgeAEl.classList.add('visible');
		winnerBadgeAEl.textContent = "Winner!";
	} else {
		winnerBadgeBEl.classList.add('visible');
		winnerBadgeBEl.textContent = "Winner!";
	}
}

function onRunComplete() {
	stopPlaybackLoop();
	if (isRaceMode) showRaceBanner();
	playCompletionChime();
}

function advanceOneStep() {
	const stepA = getNextTrackStep('A');
	if (stepA) {
		drawTrack('A', stepA);
		playSoundForStep(stepA);
	}

	if (isRaceMode) {
		const stepB = getNextTrackStep('B');
		if (stepB) drawTrack('B', stepB);
	}

	if (isEverythingDone()) onRunComplete();
}

function getTickDelay() {
	const speed = Number(speedSlider.value);
	if (speed >= BATCH_START_SPEED) return 0;
	const t = speed / BATCH_START_SPEED;
	return FRAME_TICK_MS * Math.pow(MAX_TICK_MS / FRAME_TICK_MS, 1 - t);
}

function getStepsPerTick() {
	const speed = Number(speedSlider.value);
	if (speed < BATCH_START_SPEED) return 1;
	const t = (speed - BATCH_START_SPEED) / (SPEED_MAX - BATCH_START_SPEED);
	return Math.max(1, Math.round(Math.pow(MAX_STEPS_PER_TICK, t)));
}

function runAnimationLoop() {
	if (!isPlaying) return;

	const tickDelay = getTickDelay();
	const stepsThisTick = getStepsPerTick();
	const tickStart = performance.now();

	let lastStepA = null;
	let lastStepB = null;

	for (let i = 0; i < stepsThisTick; i++) {
		if (performance.now() - tickStart > FRAME_BUDGET_MS) break;
		if (isEverythingDone()) break;

		if (!trackADone) {
			const s = getNextTrackStep('A');
			if (s) lastStepA = s;
		}
		if (isRaceMode && !trackBDone) {
			const s = getNextTrackStep('B');
			if (s) lastStepB = s;
		}
	}

	if (lastStepA) {
		drawTrack('A', lastStepA);
		if (!isRaceMode) playSoundForStep(lastStepA);
	}
	if (isRaceMode && lastStepB) drawTrack('B', lastStepB);

	if (isEverythingDone()) {
		onRunComplete();
		return;
	}

	if (tickDelay > 0) {
		animationTimeoutId = setTimeout(runAnimationLoop, tickDelay);
	} else {
		animationFrameId = requestAnimationFrame(runAnimationLoop);
	}
}

// --- race mode ---

function toggleRaceMode() {
	isRaceMode = !isRaceMode;

	algoPickerLabelEl.textContent = isRaceMode ? 'Algorithm A' : 'Algorithm';
	raceToggleBtn.textContent = isRaceMode ? 'Race Mode: On' : 'Race Mode: Off';
	raceToggleBtn.classList.toggle('active', isRaceMode);
	descriptionRowEl.classList.toggle('hidden', isRaceMode);
	algoBControlGroupEl.classList.toggle('hidden', !isRaceMode);
	trackRowBEl.classList.toggle('hidden', !isRaceMode);
	appEl.classList.toggle('racing', isRaceMode); // drives the whole layout switch — see style.css

	benchmarkBtn.disabled = isRaceMode;
	setCodePanelDisabled(isRaceMode);
	if (isRaceMode && isCodePanelOpen()) setCodePanelOpen(false);

	if (isRaceMode) {
		syncPickerLabel('B');
	}

	stopPlaybackLoop();
	resetRaceState();
	resetTimer();
	updateStatLabels();
	updateTrackLabels();
	renderCurrentArray();
	closeAllStatsPopups();
}

// --- internals: benchmark mode ---

function handleBenchmark() {
	if (isRaceMode) return;

	stopPlaybackLoop();
	resetRaceState();
	resetTimer();
	setCodePanelOpen(false);

	canvas.classList.add('no-grid');
	setTimerDisplayText('A', '—');
	timeComplexityValueEl.textContent = `n = ${sizeSlider.value}`;

	showBenchmarkLoading(ctx, canvas);
	setTimeout(() => {
		const size = Number(sizeSlider.value);
		const baseArray = generateShuffledArray(size);
		runBenchmark(ctx, canvas, baseArray, size);
	}, 30);
}

// --- range/num binding ---

function bindRangeToNumber(rangeEl, numberEl, onChange) {
	const min = Number(rangeEl.min);
	const max = Number(rangeEl.max);

	rangeEl.addEventListener('input', () => {
		numberEl.value = rangeEl.value;
		onChange();
	});

	numberEl.addEventListener('change', () => {
		let value = Number(numberEl.value);
		if (Number.isNaN(value)) value = min;
		value = Math.min(max, Math.max(min, value));
		numberEl.value = value;
		rangeEl.value = value;
		onChange();
	});
}
