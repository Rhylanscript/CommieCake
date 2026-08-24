// public/js/stepHistory.js

import { getCurrentElapsedMs } from './timer.js';
import { getTrackCounters } from './counters.js';

const MAX_HISTORY_STEPS = 2000;
let stepHistory = []; // { stepData, comparisons, swaps, elapsedMs }[]
let historyIndex = -1;

export function pushHistoryEntry(stepData) {
	const { comparisons, swaps } = getTrackCounters('A');
	stepHistory.push({ stepData, comparisons, swaps, elapsedMs: getCurrentElapsedMs() });
	if (stepHistory.length > MAX_HISTORY_STEPS) stepHistory.shift();
	historyIndex = stepHistory.length - 1;
}

export function getHistoryEntry(index) {
	return stepHistory[index] ?? null;
}

export function getHistoryIndex() {
	return historyIndex;
}

export function decrementHistoryIndex() {
	historyIndex--;
	return historyIndex;
}

export function advanceSingleModeCursor(trackADone, getNextStep) {
	if (historyIndex < stepHistory.length - 1) {
		historyIndex++;
		return true;
	}
	if (trackADone) return false;
	const step = getNextStep();
	return step !== null;
}

export function isPlaybackCaughtUpAndDone(trackADone) {
	return trackADone && historyIndex >= stepHistory.length - 1;
}

export function resetHistory() {
	stepHistory = [];
	historyIndex = -1;
}
