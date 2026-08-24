// public/js/speedCurve.js

const MAX_TICK_MS = 220;
const FRAME_TICK_MS = 16;
const BATCH_START_SPEED = 350;
const SPEED_MAX = 500;
const MAX_STEPS_PER_TICK = 4000;
export const FRAME_BUDGET_MS = 8;

export function getTickDelay(speed) {
	if (speed >= BATCH_START_SPEED) return 0;
	const t = speed / BATCH_START_SPEED;
	return FRAME_TICK_MS * Math.pow(MAX_TICK_MS / FRAME_TICK_MS, 1 - t);
}

export function getStepsPerTick(speed) {
	if (speed < BATCH_START_SPEED) return 1;
	const t = (speed - BATCH_START_SPEED) / (SPEED_MAX - BATCH_START_SPEED);
	return Math.max(1, Math.round(Math.pow(MAX_STEPS_PER_TICK, t)));
}
