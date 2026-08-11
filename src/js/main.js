// src/js/main.js

import { drawBars, drawBenchmarkChart, drawBenchmarkLoadingMessage } from './renderer.js';
import { highlightJs } from './codeHighlight.js';
import { algorithms } from './registry.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const algorithmSelect = document.getElementById('algorithm-select');
const algorithmDescEl = document.getElementById('algorithm-description');

const sizeSlider = document.getElementById('size-slider');
const sizeNumber = document.getElementById('size-number');
const speedSlider = document.getElementById('speed-slider');
const speedNumber = document.getElementById('speed-number');

const newArrayBtn = document.getElementById('new-array-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const stepBtn = document.getElementById('step-btn');
const benchmarkBtn = document.getElementById('benchmark-btn');
const codeBtn = document.getElementById('code-btn');

const timerValueEl = document.getElementById('timer-value');
const complexityValueEl = document.getElementById('complexity-value');
const comparisonsValueEl = document.getElementById('comparisons-value');
const swapsValueEl = document.getElementById('swaps-value');
const codePanelEl = document.getElementById('code-panel');
const codeContentEl = document.getElementById('code-content');

let currentArray = [];
let currentMaxValue = 1;
let generator = null;
let isPlaying = false;
let animationTimeoutId = null;
let animationFrameId = null;
let isCodePanelOpen = false;

// --- timer state ---
let accumulatedElapsedMs = 0;
let segmentStartTimestamp = null;
let timerIntervalId = null;

// --- counter state ---
let comparisonCount = 0;
let swapCount = 0;

// --- speed curve tuning ---
const MAX_TICK_MS = 220;
const FRAME_TICK_MS = 16;
const BATCH_START_SPEED = 350;
const SPEED_MAX = 500;
const MAX_STEPS_PER_TICK = 4000;
const FRAME_BUDGET_MS = 8;

function populateAlgorithmMenu() {
	algorithms.forEach(({ id, name }) => {
		const option = document.createElement('option');
		option.value = id;
		option.textContent = name;
		algorithmSelect.appendChild(option);
	});
}

function getSelectedAlgorithm() {
	return algorithms.find((a) => a.id === algorithmSelect.value);
}

function updateComplexityLabel() {
	complexityValueEl.textContent = getSelectedAlgorithm().complexity;
}

function updateDescription() {
	algorithmDescEl.textContent = getSelectedAlgorithm().description;
}

function generateShuffledArray(size) {
	const values = Array.from({ length: size }, (_, i) => i + 1);
	for (let i = values.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[values[i], values[j]] = [values[j], values[i]];
	}
	return values;
}

function renderCurrentArray() {
	drawBars(ctx, canvas, { array: currentArray }, currentMaxValue);
}

function restoreVisualizerView() {
	canvas.classList.remove('no-grid');
	updateComplexityLabel();
}

// --- code panel ---

function updateCodeContent() {
	const source = getSelectedAlgorithm().run.toString();
	codeContentEl.innerHTML = highlightJs(source);
}

function setCodePanelOpen(open) {
	isCodePanelOpen = open;
	codePanelEl.classList.toggle('hidden', !open);
	codeBtn.textContent = open ? 'Hide Code' : 'Show Code';
	if (open) updateCodeContent();
}

function handleToggleCode() {
	setCodePanelOpen(!isCodePanelOpen);
}

// --- timer ---

function formatElapsedMs(ms) {
	return (ms / 1000).toFixed(2) + 's';
}

function getCurrentElapsedMs() {
	const liveSegment = segmentStartTimestamp !== null ? performance.now() - segmentStartTimestamp : 0;
	return accumulatedElapsedMs + liveSegment;
}

function updateTimerDisplay() {
	timerValueEl.textContent = formatElapsedMs(getCurrentElapsedMs());
}

function resetTimer() {
	accumulatedElapsedMs = 0;
	segmentStartTimestamp = null;
	clearInterval(timerIntervalId);
	updateTimerDisplay();
}

function startTimerSegment() {
	segmentStartTimestamp = performance.now();
	timerIntervalId = setInterval(updateTimerDisplay, 50);
}

function pauseTimerSegment() {
	if (segmentStartTimestamp !== null) {
		accumulatedElapsedMs += performance.now() - segmentStartTimestamp;
		segmentStartTimestamp = null;
	}
	clearInterval(timerIntervalId);
	updateTimerDisplay();
}

// --- counters ---

function updateCounterDisplay() {
	comparisonsValueEl.textContent = comparisonCount.toLocaleString();
	swapsValueEl.textContent = swapCount.toLocaleString();
}

function resetCounters() {
	comparisonCount = 0;
	swapCount = 0;
	updateCounterDisplay();
}

function countUnits(indices) {
	if (!indices || indices.length === 0) return 0;
	return Math.max(1, Math.floor(indices.length / 2));
}

function tallyStep(stepData) {
	comparisonCount += countUnits(stepData.comparing)
	swapCount += countUnits(stepData.swapping)
	updateCounterDisplay();
}

// --- sorting / animation ---

function resetGenerator() {
	generator = null;
	isPlaying = false;
	playPauseBtn.textContent = 'Start';
	clearTimeout(animationTimeoutId);
	cancelAnimationFrame(animationFrameId);
	pauseTimerSegment();
}

function handleNewArray() {
	const size = Number(sizeSlider.value);
	currentArray = generateShuffledArray(size);
	currentMaxValue = size;
	resetGenerator();
	resetTimer();
	resetCounters();
	restoreVisualizerView();
	renderCurrentArray();
}

function handleAlgorithmChange() {
	resetGenerator();
	resetTimer();
	resetCounters();
	restoreVisualizerView();
	updateDescription();
	renderCurrentArray();
	if (isCodePanelOpen) updateCodeContent();
}

function getNextGeneratorStep() {
	if (!generator) {
		generator = getSelectedAlgorithm().run(currentArray);
	}
	const result = generator.next();
	if (result.done) {
		resetGenerator();
		return null;
	}
	tallyStep(result.value);
	return result.value;
}

function advanceOneStep() {
	const stepData = getNextGeneratorStep();
	if (!stepData) return false;
	drawBars(ctx, canvas, stepData, currentMaxValue);
	return true;
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

	let lastStep = null;
	let finished = false;

	for (let i = 0; i < stepsThisTick; i++) {
		if (performance.now() - tickStart > FRAME_BUDGET_MS) break;
		const stepData = getNextGeneratorStep();
		if (!stepData) {
			finished = true;
			break;
		}
		lastStep = stepData;
	}

	if (lastStep) drawBars(ctx, canvas, lastStep, currentMaxValue);
	if (finished) return;

	if (tickDelay > 0) {
		animationTimeoutId = setTimeout(runAnimationLoop, tickDelay);
	} else {
		animationFrameId = requestAnimationFrame(runAnimationLoop);
	}
}

function togglePlayPause() {
	if (isPlaying) {
		isPlaying = false;
		playPauseBtn.textContent = 'Start';
		clearTimeout(animationTimeoutId);
		cancelAnimationFrame(animationFrameId);
		pauseTimerSegment();
	} else {
		restoreVisualizerView();

		if (!generator) {
			resetTimer();
			resetCounters();
		}

		isPlaying = true;
		playPauseBtn.textContent = 'Pause';
		startTimerSegment();
		runAnimationLoop();
	}
}

function handleStep() {
	restoreVisualizerView();
	isPlaying = false;
	playPauseBtn.textContent = 'Start';
	clearTimeout(animationTimeoutId);
	cancelAnimationFrame(animationFrameId);
	pauseTimerSegment();
	advanceOneStep();
}

// --- benchmark mode ---

function handleBenchmark() {
	resetGenerator();
	resetTimer();
	resetCounters();
	setCodePanelOpen(false);

	canvas.classList.add('no-grid');
	timerValueEl.textContent = '—';
	complexityValueEl.textContent = `n = ${sizeSlider.value}`;

	drawBenchmarkLoadingMessage(ctx, canvas);
	setTimeout(runBenchmark, 30);
}

function runBenchmark() {
	const size = Number(sizeSlider.value);
	const baseArray = generateShuffledArray(size);

	const DONT_PLEASE_NO = ['bogo', 'slow'];

	const results = algorithms
		.filter((algo) => !DONT_PLEASE_NO.includes(algo.id))
		.map((algo) => {
			const inputCopy = [...baseArray];
			const gen = algo.run(inputCopy);

			const start = performance.now();
			let done = false;
			while (!done) {
				done = gen.next().done;
			}
			const elapsedMs = performance.now() - start;

			return { name: algo.name, ms: elapsedMs };
		})
		.sort((a, b) => a.ms - b.ms);

	drawBenchmarkChart(ctx, canvas, results, size);
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

bindRangeToNumber(sizeSlider, sizeNumber, () => {});
bindRangeToNumber(speedSlider, speedNumber, () => {});

// --- keyboard shortcuts ---

// space: play / pause
// right arrow: step forward

function handleKeydown(e) {
	const focusedTag = document.activeElement.tagName;
	if (focusedTag === 'INPUT' || focusedTag === 'SELECT' || focusedTag === 'TEXTAREA') return;

	if (e.code === 'Space') {
		e.preventDefault();
		togglePlayPause();
	} else if (e.code === 'ArrowRight') {
		e.preventDefault();
		handleStep();
	}
}

// --- listeners ---

document.addEventListener('keydown', handleKeydown);

algorithmSelect.addEventListener('change', handleAlgorithmChange);
newArrayBtn.addEventListener('click', handleNewArray);
playPauseBtn.addEventListener('click', togglePlayPause);
stepBtn.addEventListener('click', handleStep);
benchmarkBtn.addEventListener('click', handleBenchmark);
codeBtn.addEventListener('click', handleToggleCode);

populateAlgorithmMenu();
updateComplexityLabel();
updateDescription();
handleNewArray();
