// public/js/counters.js

const comparisonsValueEl = document.getElementById('comparisons-value');
const swapsValueEl = document.getElementById('swaps-value');
const comparisonsValueBEl = document.getElementById('comparisons-value-b');
const swapsValueBEl = document.getElementById('swaps-value-b');

let comparisonCountA = 0;
let swapCountA = 0;
let comparisonCountB = 0;
let swapCountB = 0;

function updateTrackCounterDisplay(slot) {
	if (slot === 'A') {
		comparisonsValueEl.textContent = comparisonCountA.toLocaleString();
		swapsValueEl.textContent = swapCountA.toLocaleString();
	} else {
		comparisonsValueBEl.textContent = comparisonCountB.toLocaleString();
		swapsValueBEl.textContent = swapCountB.toLocaleString();
	}
}

export function resetCounters() {
	comparisonCountA = 0;
	swapCountA = 0;
	comparisonCountB = 0;
	swapCountB = 0;
	updateTrackCounterDisplay('A');
	updateTrackCounterDisplay('B');
}

function countUnits(indices) {
	if (!indices || indices.length === 0) return 0;
	return Math.max(1, Math.floor(indices.length / 2));
}

export function tallyTrackStep(slot, stepData) {
	if (slot === 'A') {
		comparisonCountA += countUnits(stepData.comparing);
		swapCountA += countUnits(stepData.swapping);
	} else {
		comparisonCountB += countUnits(stepData.comparing);
		swapCountB += countUnits(stepData.swapping);
	}
	updateTrackCounterDisplay(slot);
}
