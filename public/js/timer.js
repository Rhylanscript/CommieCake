// public/js/timer.js

const timerValueEl = document.getElementById('timer-value');
const timerValueBEl = document.getElementById('timer-value-b');

let accumulatedElapsedMs = 0;
let segmentStartTimestamp = null;
let timerIntervalId = null;

// supplied via initTimer so this module can ask about race/track state
// without owning that state itself (it belongs to the animation engine)
let isRaceMode = () => false;
let getTrackStatus = () => ({ isDone: false, finishMs: null });

export function initTimer({ isRaceMode: isRaceModeFn, getTrackStatus: getTrackStatusFn }) {
	isRaceMode = isRaceModeFn;
	getTrackStatus = getTrackStatusFn;
}

export function formatElapsedMs(ms) {
	return (ms / 1000).toFixed(2) + 's';
}

export function getCurrentElapsedMs() {
	const liveSegment = segmentStartTimestamp !== null ? performance.now() - segmentStartTimestamp : 0;
	return accumulatedElapsedMs + liveSegment;
}

function updateTrackTimerDisplay(slot) {
	const { isDone, finishMs } = getTrackStatus(slot);
	const el = slot === 'A' ? timerValueEl : timerValueBEl;
	const displayMs = isDone && finishMs !== null ? finishMs : getCurrentElapsedMs();
	el.textContent = formatElapsedMs(displayMs);
}

export function updateTimerDisplay() {
	updateTrackTimerDisplay('A');
	if (isRaceMode()) updateTrackTimerDisplay('B');
}

export function resetTimer() {
	accumulatedElapsedMs = 0;
	segmentStartTimestamp = null;
	clearInterval(timerIntervalId);
	updateTimerDisplay();
}

export function startTimerSegment() {
	segmentStartTimestamp = performance.now();
	timerIntervalId = setInterval(updateTimerDisplay, 50);
}

export function pauseTimerSegment() {
	if (segmentStartTimestamp !== null) {
		accumulatedElapsedMs += performance.now() - segmentStartTimestamp;
		segmentStartTimestamp = null;
	}
	clearInterval(timerIntervalId);
	updateTimerDisplay();
}

// escape hatch for callers that need to stamp arbitrary text into a timer
// slot outside the normal tick/finish flow (e.g. benchmark mode's '-')
export function setTimerDisplayText(slot, text) {
	const el = slot === 'A' ? timerValueEl : timerValueBEl;
	el.textContent = text;
}
