// public/js/main.js

import { drawBars, drawBenchmarkChart, drawBenchmarkLoadingMessage } from './renderer.js';
import { highlightJs } from './codeHighlight.js';
import { algorithms, CATEGORY_ORDER } from './registry.js';
import { setSoundEnabled, isSoundEnabled, playComparisonTone, playSwapTone, playCompletionChime, isCustomSoundReady, playCustomSample, preloadCustomSounds } from './sound.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const algoPickerToggleEl = document.getElementById('algo-picker-toggle');
const algoPickerCurrentEl = document.getElementById('algo-picker-current');
const commandPaletteBackdropEl = document.getElementById('command-palette-backdrop');
const commandPaletteSearchEl = document.getElementById('command-palette-search');
const commandPaletteListEl = document.getElementById('command-palette-list');
const categoryFilterSelectEl = document.getElementById('category-filter-select');
const sortSelectEl = document.getElementById('sort-select');

const algorithmDescEl = document.getElementById('algorithm-description');
const infoBtn = document.getElementById('info-btn');
const descriptionPopupEl = document.getElementById('description-popup');

const sizeSlider = document.getElementById('size-slider');
const sizeNumber = document.getElementById('size-number');
const speedSlider = document.getElementById('speed-slider');
const speedNumber = document.getElementById('speed-number');

const newArrayBtn = document.getElementById('new-array-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const stepBtn = document.getElementById('step-btn');
const benchmarkBtn = document.getElementById('benchmark-btn');
const codeBtn = document.getElementById('code-btn');

const soundBtn = document.getElementById('sound-btn');
const soundIcon = document.getElementById('sound-icon');

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
let isCommandPaletteOpen = false;
let activeOptionIndex = 0;
let selectedAlgorithmId = algorithms[0].id;

// --- command palette filter/sort state ---
let activeCategoryFilter = 'All';
let sortMode = 'category'; 			// 'category' | 'name-asc' | 'name-dsc'

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

// --- code source files ---
const sourceFileCache = new Map();

function getSelectedAlgorithm() {
	return algorithms.find((a) => a.id === selectedAlgorithmId);
}

function updateComplexityLabel() {
	complexityValueEl.textContent = getSelectedAlgorithm().complexity;
}

function updateDescription() {
	const text = getSelectedAlgorithm().description;
	algorithmDescEl.textContent = text;
	descriptionPopupEl.textContent = text;
}

// --- sound ---

function handleSoundBtnClick() {
	const next = !isSoundEnabled();
	setSoundEnabled(next);
	soundIcon.src = next ? './assets/images/sound-on.svg' : './assets/images/sound-off.svg';
	soundBtn.classList.toggle('active', next);
	soundBtn.setAttribute('aria-pressed', String(next));
}

function averageValueAt(array, indices) {
	if (!indices || indices.length === 0) return null;
	const values = indices.map((i) => array[i]).filter((v) => v !== undefined);
	if (values.length === 0) return null;
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function playSoundForStep(stepData) {
	if (!isSoundEnabled()) return;
	const algo = getSelectedAlgorithm();

	if (stepData.swapping && stepData.swapping.length > 0) {
		const value = averageValueAt(stepData.array, stepData.swapping);
		if (value === null) return;
		const customUrl = algo.sound?.swap;
		if (customUrl && isCustomSoundReady(customUrl)) {
			playCustomSample(customUrl, value, currentMaxValue);
		} else {
			playSwapTone(value, currentMaxValue);
		}
	} else if (stepData.comparing && stepData.comparing.length > 0) {
		const value = averageValueAt(stepData.array, stepData.comparing);
		if (value === null) return;
		const customUrl = algo.sound?.comparison;
		if (customUrl && isCustomSoundReady(customUrl)) {
			playCustomSample(customUrl, value, currentMaxValue);
		} else {
			playComparisonTone(value, currentMaxValue);
		}
	}
}

// --- command palette ---

function populateCategoryFilterSelect() {
	const presentCategories = new Set(algorithms.map((a) => a.category));
	const orderedPresent = [
		...CATEGORY_ORDER.filter((c) => presentCategories.has(c)),
		...[...presentCategories].filter((c) => !CATEGORY_ORDER.includes(c)),
	];

	categoryFilterSelectEl.innerHTML = '';
	['All', ...orderedPresent].forEach((category) => {
		const option = document.createElement('option');
		option.value = category;
		option.textContent = category;
		categoryFilterSelectEl.appendChild(option);
	});
	categoryFilterSelectEl.value = activeCategoryFilter;
}

function handleCategoryFilterChange() {
	activeCategoryFilter = categoryFilterSelectEl.value;
	renderCommandPaletteList(commandPaletteSearchEl.value);
}

function handleSortSelectChange() {
	sortMode = sortSelectEl.value;
	renderCommandPaletteList(commandPaletteSearchEl.value);
}

function createOptionElement(algo) {
	const option = document.createElement('button');
	option.type = 'button';
	option.className = 'algo-picker-option';
	option.dataset.id = algo.id;
	option.setAttribute('role', 'option');
	option.innerHTML = `<span>${algo.name}</span><span class="algo-picker-option-complexity">${algo.complexity}</span>`;
	option.addEventListener('click', () => handleAlgorithmPick(algo.id));
	option.addEventListener('mouseenter', () => {
		const visible = getVisibleOptions();
		const hoveredIndex = visible.indexOf(option);
		if (hoveredIndex !== -1) setActiveIndex(hoveredIndex, visible);
	});
	return option;
}

function renderCommandPaletteList(query) {
	const normalizedQuery = query.trim().toLowerCase();

	const filtered = algorithms.filter((algo) => {
		const matchesQuery = algo.name.toLowerCase().includes(normalizedQuery);
		const matchesCategory = activeCategoryFilter === 'All' || algo.category === activeCategoryFilter;
		return matchesQuery && matchesCategory;
	});

	commandPaletteListEl.innerHTML = '';

	if (filtered.length === 0) {
		const empty = document.createElement('p');
		empty.className = 'command-palette-empty';
		empty.textContent = 'No algorithms match.';
		commandPaletteListEl.appendChild(empty);
		setActiveIndex(0, []);
		return;
	}

	if (sortMode === 'name-asc' || sortMode === 'name-dsc') {
		const direction = sortMode === 'name-asc' ? 1 : -1;
		[...filtered]
			.sort((a, b) => direction * a.name.localeCompare(b.name))
			.forEach((algo) => commandPaletteListEl.appendChild(createOptionElement(algo)));
	} else {
		const grouped = new Map();
		filtered.forEach((algo) => {
			if (!grouped.has(algo.category)) grouped.set(algo.category, []);
			grouped.get(algo.category).push(algo);
		});

		// sort category keys by their pos in CATEGORY_ORDER
		// categories not listed there fallback to infinity so they sort after
		// every listed category but relative to each other unlisted categories
		// keep the order they were encountered in
		const orderedCategories = [...grouped.keys()].sort((a, b) => {
			const rankA = CATEGORY_ORDER.indexOf(a) === -1 ? Infinity : CATEGORY_ORDER.indexOf(a);
			const rankB = CATEGORY_ORDER.indexOf(b) === -1 ? Infinity : CATEGORY_ORDER.indexOf(b);
			return rankA - rankB;
		});

		orderedCategories.forEach((category) => {
			const groupLabel = document.createElement('p');
			groupLabel.className = 'algo-picker-group-label';
			groupLabel.textContent = category;
			commandPaletteListEl.appendChild(groupLabel);

			grouped.get(category).forEach((algo) => commandPaletteListEl.appendChild(createOptionElement(algo)));
		});
	}

	setActiveIndex(0, getVisibleOptions());
}

function getVisibleOptions() {
	return Array.from(commandPaletteListEl.querySelectorAll('.algo-picker-option'));
}

function setActiveIndex(index, visible) {
	activeOptionIndex = index;
	visible.forEach((el, i) => el.classList.toggle('active', i === activeOptionIndex));
	visible[activeOptionIndex]?.scrollIntoView({ block: 'nearest' });
}

function moveActiveIndex(delta) {
	const visible = getVisibleOptions();
	if (visible.length === 0) return;
	const nextIndex = (activeOptionIndex + delta + visible.length) % visible.length;
	setActiveIndex(nextIndex, visible);
}

function selectActiveOption() {
	const visible = getVisibleOptions();
	const el = visible[activeOptionIndex];
	if (el) handleAlgorithmPick(el.dataset.id);
}

function handleCommandPaletteSearchInput() {
	renderCommandPaletteList(commandPaletteSearchEl.value);
}

function openCommandPalette() {
	isCommandPaletteOpen = true;
	commandPaletteBackdropEl.classList.remove('hidden');
	algoPickerToggleEl.setAttribute('aria-expanded', 'true');
	commandPaletteSearchEl.value = '';
	renderCommandPaletteList('');
	commandPaletteSearchEl.focus();
}

function closeCommandPalette() {
	isCommandPaletteOpen = false;
	commandPaletteBackdropEl.classList.add('hidden');
	algoPickerToggleEl.setAttribute('aria-expanded', 'false');
}

function handleBackdropClick(e) {
	if (e.target === commandPaletteBackdropEl) closeCommandPalette();
}

function handleAlgorithmPick(id) {
	if (id !== selectedAlgorithmId) {
		selectedAlgorithmId = id;
		algoPickerCurrentEl.textContent = getSelectedAlgorithm().name;
		handleAlgorithmChange();
	}
	closeCommandPalette();
}

// --- description popup ---

function setPopupOpen(open) {
	descriptionPopupEl.classList.toggle('open', open);
	infoBtn.setAttribute('aria-expanded', String(open));
}

function handleInfoBtnClick(e) {
	e.stopPropagation();
	setPopupOpen(!descriptionPopupEl.classList.contains('open'));
}

function handleDocumentClick(e) {
	if (e.target !== infoBtn && !descriptionPopupEl.contains(e.target)) {
		setPopupOpen(false);
	}
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

async function updateCodeContent() {
	const algo = getSelectedAlgorithm();

	if (sourceFileCache.has(algo.id)) {
		codeContentEl.innerHTML = highlightJs(sourceFileCache.get(algo.id));
		return;
	}

	codeContentEl.textContent = "Loading Source...";

	try {
		const response = await fetch(algo.file);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const fullSource = await response.text();
		sourceFileCache.set(algo.id, fullSource);
		codeContentEl.innerHTML = highlightJs(fullSource);
	} catch (err) {
		// i have no idea how this could be reached but ig just return 
		// function only view like before??
		console.error(`Failed to load full source for ${algo.id}:`, err);
		codeContentEl.innerHTML = highlightJs(algo.run.toString());
	}
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
	comparisonCount += countUnits(stepData.comparing);
	swapCount += countUnits(stepData.swapping);
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
		playCompletionChime();
		return null;
	}
	tallyStep(result.value);
	return result.value;
}

function advanceOneStep() {
	const stepData = getNextGeneratorStep();
	if (!stepData) return false;
	drawBars(ctx, canvas, stepData, currentMaxValue);
	playSoundForStep(stepData);
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

	if (lastStep) {
		drawBars(ctx, canvas, lastStep, currentMaxValue);
		playSoundForStep(lastStep);
	}
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

// > palette options
// esc:	close modal
// down arrow: select option below current
// up arrow: select option above current
// enter: select option

function handleKeydown(e) {
	// command palette keybinds
	if (isCommandPaletteOpen) {
		if (e.key === 'Escape') {
			closeCommandPalette();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			moveActiveIndex(1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			moveActiveIndex(-1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			selectActiveOption();
		}
		return;
	}

	// other stuff

	if (e.key === 'Escape') {
		setPopupOpen(false);
		return;
	}

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
document.addEventListener('click', handleDocumentClick);
infoBtn.addEventListener('click', handleInfoBtnClick);

algoPickerToggleEl.addEventListener('click', openCommandPalette);
commandPaletteSearchEl.addEventListener('input', handleCommandPaletteSearchInput);
commandPaletteBackdropEl.addEventListener('click', handleBackdropClick);
categoryFilterSelectEl.addEventListener('change', handleCategoryFilterChange);
sortSelectEl.addEventListener('change', handleSortSelectChange);

newArrayBtn.addEventListener('click', handleNewArray);
playPauseBtn.addEventListener('click', togglePlayPause);
stepBtn.addEventListener('click', handleStep);
benchmarkBtn.addEventListener('click', handleBenchmark);
codeBtn.addEventListener('click', handleToggleCode);
soundBtn.addEventListener('click', handleSoundBtnClick);

populateCategoryFilterSelect();

// preload all custom sounds
const customSoundUrls = new Set();
algorithms.forEach((algo) => {
	if (algo.sound) Object.values(algo.sound).forEach((url) => customSoundUrls.add(url));
});
preloadCustomSounds([...customSoundUrls]);

algoPickerCurrentEl.textContent = getSelectedAlgorithm().name;
updateComplexityLabel();
updateDescription();
handleNewArray();
