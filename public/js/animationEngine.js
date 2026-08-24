// public/js/animationEngine.js

import { drawBars } from './renderer.js';
import { playCompletionChime } from './sound.js';
import { getAlgorithmForSlot, syncPickerLabel } from './commandPalette.js';
import { resetTimer, startTimerSegment, pauseTimerSegment, setTimerDisplayText, formatElapsedMs } from './timer.js';
import { resetCounters, setTrackCounterDisplay } from './counters.js';
import { isCodePanelOpen, setCodePanelOpen, refreshCodePanelIfOpen, setCodePanelDisabled } from './codePanel.js';
import { showBenchmarkLoading, runBenchmark } from './benchmark.js';
import { updateDescription } from './descriptionPopup.js';
import { playSoundForStep } from './soundBridge.js';
import { closeAllStatsPopups } from './statsPopup.js';
import { bindRangeToNumber } from './rangeInput.js';
import { getTickDelay, getStepsPerTick, FRAME_BUDGET_MS } from './speedCurve.js';
import {
	pushHistoryEntry,
	getHistoryEntry,
	getHistoryIndex,
	decrementHistoryIndex,
	advanceSingleModeCursor as advanceHistoryCursor,
	isPlaybackCaughtUpAndDone as historyIsCaughtUpAndDone,
	resetHistory,
} from './stepHistory.js';
import {
	getTrackStatus,
	isTrackDone,
	getNextTrackStep,
	isEverythingDone as trackStateIsEverythingDone,
	resetTrackState,
	markTrackDone,
	getRaceFinishTimes,
} from './trackState.js';

// re-exported public API - lived here before the split, now sourced from trackState.js
export { getTrackStatus };

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
const resetBtn = document.getElementById('reset-btn');
const stepBackBtn = document.getElementById('step-back-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const stepForwardBtn = document.getElementById('step-forward-btn');
const jumpEndBtn = document.getElementById('jump-end-btn');
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
const trackStatsAEl = document.querySelector('#track-row-a .track-stats');
const canvasLabelAEl = document.getElementById('canvas-label-a');
const canvasLabelBEl = document.getElementById('canvas-label-b');

const mainEl = document.querySelector('main');
const timelineControlsEl = document.getElementById('timeline-controls');

const winnerBadgeAEl = document.getElementById('winner-badge-a');
const winnerBadgeBEl = document.getElementById('winner-badge-b');

// --- state ---
let currentArray = [];
let currentMaxValue = 1;
let isPlaying = false;
let animationTimeoutId = null;
let animationFrameId = null;
let isRaceMode = false;

// --- public api ---

export function initAnimationEngine() {
	bindRangeToNumber(sizeSlider, sizeNumber, () => {});
	bindRangeToNumber(speedSlider, speedNumber, () => {});

	newArrayBtn.addEventListener('click', handleNewArray);
	resetBtn.addEventListener('click', handleResetTimeline);
	stepBackBtn.addEventListener('click', handleStepBack);
	playPauseBtn.addEventListener('click', togglePlayPause);
	stepForwardBtn.addEventListener('click', handleStepForward);
	jumpEndBtn.addEventListener('click', handleJumpToEnd);
	benchmarkBtn.addEventListener('click', handleBenchmark);
	raceToggleBtn.addEventListener('click', toggleRaceMode);

	// align timeline to canvas when its width is changed
	const resizeObserver = new ResizeObserver(() => alignTimelineToCanvas());
	resizeObserver.observe(canvas);
	resizeObserver.observe(mainEl);
	window.addEventListener('resize', alignTimelineToCanvas);
	requestAnimationFrame(alignTimelineToCanvas);
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

	if (isPlaybackFullyFinished()) {
		resetRaceState();
		resetTimer();
		renderCurrentArray();
	}

	isPlaying = true;
	playPauseBtn.classList.add('is-playing');
	playPauseBtn.setAttribute('aria-label', 'Pause')

	startTimerSegment();
	runAnimationLoop();
}

export function handleStepForward() {
	restoreVisualizerView();
	stopPlaybackLoop();

	if (isRaceMode) {
		if (isEverythingDone()) {
			resetRaceState();
			resetTimer();
			renderCurrentArray();
			return;
		}
		advanceOneStep();
		return;
	}

	if (isPlaybackCaughtUpAndDone()) {
		handleResetTimeline();
		return;
	}

	if (advanceSingleModeCursor()) {
		const index = getHistoryIndex();
		displayHistoryEntry(index);
		playSoundForStep(getHistoryEntry(index).stepData);
	}

	if (isPlaybackCaughtUpAndDone()) onRunComplete();
}

export function handleStepBack() {
	if (isRaceMode) return;
	stopPlaybackLoop();
	restoreVisualizerView();

	if (getHistoryIndex() < 0) return; // already at the og array

	const newIndex = decrementHistoryIndex();

	if (newIndex < 0) {
		drawTrack('A', null);
		setTrackCounterDisplay('A', 0, 0);
		setTimerDisplayText('A', formatElapsedMs(0));
		updateTimelineButtonStates();
	} else {
		displayHistoryEntry(newIndex);
	}
}

export function handleJumpToEnd() {
	if (isRaceMode) return;
	stopPlaybackLoop();
	restoreVisualizerView();

	if (isPlaybackCaughtUpAndDone()) return;

	const sortedArray = [...currentArray].sort((a, b) => a - b);
	const finalStep = {
		array: sortedArray,
		comparing: [],
		swapping: [],
		sortedIndices: sortedArray.map((_, i) => i),
	};

	markTrackDone('A');
	pushHistoryEntry(finalStep);
	displayHistoryEntry(getHistoryIndex());
	onRunComplete();
}

export function handleResetTimeline() {
	stopPlaybackLoop();
	resetRaceState();
	resetTimer();
	restoreVisualizerView();
	renderCurrentArray();
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

function alignTimelineToCanvas() {
	const canvasRect = canvas.getBoundingClientRect();
	const mainRect = mainEl.getBoundingClientRect();
	if (canvasRect.width === 0 || mainRect.width === 0) return;

	const canvasCenterX = canvasRect.left + canvasRect.width / 2;
	const mainCenterX = mainRect.left + mainRect.width / 2;
	timelineControlsEl.style.transform = `translateX(${canvasCenterX - mainCenterX}px)`;
	if (isRaceMode) {
		trackStatsAEl.style.transform = '';
	} else {
		trackStatsAEl.style.transform = 'none';
		const statsLeft = trackStatsAEl.getBoundingClientRect().left;
		trackStatsAEl.style.transform = `translateX(${canvasRect.left - statsLeft}px)`;
	}
}

// --- timeline / history helpers ---

function displayHistoryEntry(index) {
	const entry = getHistoryEntry(index);
	if (!entry) return;
	drawTrack('A', entry.stepData);
	setTrackCounterDisplay('A', entry.comparisons, entry.swaps);
	setTimerDisplayText('A', formatElapsedMs(entry.elapsedMs));
	updateTimelineButtonStates();
}

function advanceSingleModeCursor() {
	return advanceHistoryCursor(isTrackDone('A'), () => getNextTrackStep('A', currentArray, isRaceMode));
}

function isPlaybackCaughtUpAndDone() {
	return historyIsCaughtUpAndDone(isTrackDone('A'));
}

function isPlaybackFullyFinished() {
	return isRaceMode ? isEverythingDone() : isPlaybackCaughtUpAndDone();
}

function updateTimelineButtonStates() {
	if (isRaceMode) return;
	stepBackBtn.disabled = getHistoryIndex() < 0;
	jumpEndBtn.disabled = isPlaybackCaughtUpAndDone();
}

// --- sorting / animation ---

function stopPlaybackLoop() {
	isPlaying = false;
	playPauseBtn.classList.remove('is-playing');
	playPauseBtn.setAttribute('aria-label', 'Play')
	clearTimeout(animationTimeoutId);
	cancelAnimationFrame(animationFrameId);
	pauseTimerSegment();
}

function resetRaceState() {
	resetTrackState();
	resetHistory();
	resetCounters();
	winnerBadgeAEl.classList.remove('visible');
	winnerBadgeBEl.classList.remove('visible');
	updateTimelineButtonStates();
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

function isEverythingDone() {
	return trackStateIsEverythingDone(isRaceMode);
}

function showRaceBanner() {
	if (!isRaceMode) return;

	const { trackAFinishMs, trackBFinishMs } = getRaceFinishTimes();

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
	const stepA = getNextTrackStep('A', currentArray, isRaceMode);
	if (stepA) {
		drawTrack('A', stepA);
		playSoundForStep(stepA);
	}

	if (isRaceMode) {
		const stepB = getNextTrackStep('B', currentArray, isRaceMode);
		if (stepB) drawTrack('B', stepB);
	}

	if (isEverythingDone()) onRunComplete();
}

function runAnimationLoop() {
	if (!isPlaying) return;

	const speed = Number(speedSlider.value);
	const tickDelay = getTickDelay(speed);
	const stepsThisTick = getStepsPerTick(speed);
	const tickStart = performance.now();

	if (isRaceMode) {
		let lastStepA = null;
		let lastStepB = null;

		for (let i = 0; i < stepsThisTick; i++) {
			if (performance.now() - tickStart > FRAME_BUDGET_MS) break;
			if (isEverythingDone()) break;

			if (!isTrackDone('A')) {
				const s = getNextTrackStep('A', currentArray, isRaceMode);
				if (s) lastStepA = s;
			}
			if (!isTrackDone('B')) {
				const s = getNextTrackStep('B', currentArray, isRaceMode);
				if (s) lastStepB = s;
			}
		}

		if (lastStepA) drawTrack('A', lastStepA);
		if (lastStepB) drawTrack('B', lastStepB);

		if (isEverythingDone()) {
			onRunComplete();
			return;
		}
	} else {
		let advanced = false;

		for (let i = 0; i < stepsThisTick; i++) {
			if (performance.now() - tickStart > FRAME_BUDGET_MS) break;
			if (isPlaybackCaughtUpAndDone()) break;

			if (advanceSingleModeCursor()) advanced = true;
		}

		if (advanced) {
			const index = getHistoryIndex();
			displayHistoryEntry(index);
			playSoundForStep(getHistoryEntry(index).stepData);
		}

		if (isPlaybackCaughtUpAndDone()) {
			onRunComplete();
			return;
		}
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
	appEl.classList.toggle('racing', isRaceMode);

	benchmarkBtn.disabled = isRaceMode;
	resetBtn.disabled = isRaceMode;
	stepBackBtn.disabled = isRaceMode;
	jumpEndBtn.disabled = isRaceMode;
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
