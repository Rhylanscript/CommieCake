// public/js/soundBridge.js

import { algorithms } from './registry.js';
import { setSoundEnabled, isSoundEnabled, playComparisonTone, playSwapTone, isCustomSoundReady, playCustomSample, preloadCustomSounds } from './sound.js';

const soundBtn = document.getElementById('sound-btn');
const soundIcon = document.getElementById('sound-icon');

// supplied via initSoundBridge so this module can ask main.j for the
// currently selected algorithm, the current max bar value (used to scale
// the pitch), and whether race mode is active
let getSelectedAlgorithm = () => null;
let getCurrentMaxValue = () => 1;
let isRaceMode = () => false;

export function initSoundBridge({ getSelectedAlgorithm: getAlgoFn, getCurrentMaxValue: getMaxFn, isRaceMode: isRaceModeFn }) {
	getSelectedAlgorithm = getAlgoFn;
	getCurrentMaxValue = getMaxFn;
	isRaceMode = isRaceModeFn;

	soundBtn.addEventListener('click', handleSoundBtnClick);

	// preload all custom sounds
	const customSoundUrls = new Set();
	algorithms.forEach((algo) => {
		if (algo.sound) Object.values(algo.sound).forEach((url) => customSoundUrls.add(url));
	});
	preloadCustomSounds([...customSoundUrls]);
}

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

// dont play sound in race mode because its too chaotic
export function playSoundForStep(stepData) {
	if (!isSoundEnabled() || isRaceMode()) return;
	const algo = getSelectedAlgorithm();
	const currentMaxValue = getCurrentMaxValue();

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
