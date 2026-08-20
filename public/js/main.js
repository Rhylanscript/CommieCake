// public/js/main.js

import { getSelectedAlgorithm, getTrackStatus, getCurrentMaxValue, handleAlgorithmSelect, handleNewArray, initAnimationEngine, isRaceModeOn, togglePlayPause, updateStatLabels, updateTrackLabels, handleStep } from "./animationEngine.js";
import { initCodePanel } from "./codePanel.js";
import { closeCommandPalette, initCommandPalette, isPaletteOpen, moveActiveIndex, selectActiveOption } from "./commandPalette.js";
import { initDescriptionPopup, updateDescription } from "./descriptionPopup.js";
import { initSoundBridge } from "./soundBridge.js";
import { initTimer } from "./timer.js";

// keyboard shortcuts

function handleKeydown(e) {
	if (isPaletteOpen()) {
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

initAnimationEngine();
initCommandPalette({ onSelect: handleAlgorithmSelect });
initDescriptionPopup({ getSelectedAlgorithm });
initCodePanel({ getSelectedAlgorithm, isRaceMode: isRaceModeOn });
initTimer({ isRaceMode: isRaceModeOn, getTrackStatus });
initSoundBridge({ getSelectedAlgorithm, getCurrentMaxValue, isRaceMode: isRaceModeOn});

updateStatLabels();
updateDescription();
updateTrackLabels();
handleNewArray();
