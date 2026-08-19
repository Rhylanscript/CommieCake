// public/js/codePanel.js

import { highlightJs } from './codeHighlight.js';

const codePanelEl = document.getElementById('code-panel');
const codeContentEl = document.getElementById('code-content');
const codeBtn = document.getElementById('code-btn');

const sourceFileCache = new Map();

let isOpen = false;

// supplied via initCodePanel so this module can ask main.js what the
// currently selected algorithm is and whether race mode is active,
// without owning either of those itself
let getSelectedAlgorithm = () => null;
let isRaceMode = () => false;

export function initCodePanel({ getSelectedAlgorithm: getAlgoFn, isRaceMode: isRaceModeFn }) {
	getSelectedAlgorithm = getAlgoFn;
	isRaceMode = isRaceModeFn;
	codeBtn.addEventListener('click', handleToggleCode);
}

export function isCodePanelOpen() {
	return isOpen;
}

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

export function setCodePanelOpen(open) {
	isOpen = open;
	codePanelEl.classList.toggle('hidden', !open);
	codeBtn.textContent = open ? 'Hide Code' : 'Show Code';
	if (open) updateCodeContent();
}

// for callers that just need to rerender the panel if it happens to be
// open right now (e.g. after switching algorithms), without knowing whether
// its open or reaching into updateCodeContent directly
export function refreshCodePanelIfOpen() {
	if (isOpen) updateCodeContent();
}

export function setCodePanelDisabled(disabled) {
	codeBtn.disabled = disabled;
}

function handleToggleCode() {
	if (isRaceMode()) return;
	setCodePanelOpen(!isOpen);
}
