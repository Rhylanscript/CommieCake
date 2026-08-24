// public/js/trackState.js

import { getAlgorithmForSlot } from './commandPalette.js';
import { getCurrentElapsedMs } from './timer.js';
import { tallyTrackStep } from './counters.js';
import { pushHistoryEntry } from './stepHistory.js';

let generatorA = null;
let generatorB = null;
let trackADone = false;
let trackBDone = false;
let trackAFinishMs = null;
let trackBFinishMs = null;

export function getTrackStatus(slot) {
	return {
		isDone: slot === 'A' ? trackADone : trackBDone,
		finishMs: slot === 'A' ? trackAFinishMs : trackBFinishMs,
	};
}

export function isTrackDone(slot) {
	return slot === 'A' ? trackADone : trackBDone;
}

export function markTrackDone(slot) {
	if (slot === 'A') {
		trackADone = true;
		trackAFinishMs = getCurrentElapsedMs();
	} else {
		trackBDone = true;
		trackBFinishMs = getCurrentElapsedMs();
	}
}

export function getNextTrackStep(slot, currentArray, isRaceMode) {
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
		markTrackDone(slot);
		return null;
	}

	tallyTrackStep(slot, result.value);

	if (isA && !isRaceMode) pushHistoryEntry(result.value);

	return result.value;
}

export function isEverythingDone(isRaceMode) {
	return isRaceMode ? trackADone && trackBDone : trackADone;
}

export function resetTrackState() {
	generatorA = null;
	generatorB = null;
	trackADone = false;
	trackBDone = false;
	trackAFinishMs = null;
	trackBFinishMs = null;
}

export function getRaceFinishTimes() {
	return { trackAFinishMs, trackBFinishMs };
}
