// src/js/algorithms/tungSort.js

/**
 * Tung Sort - a threeway hybrid sort using dual pivot segmentation (two actual
 * elements from the array not a value range split) to guarantee balanced
 * segments even with outlier data recursing into segments above the
 * threshold, dropping to insertion sort below it
 * 
 * expected `O(n log n)` on typical data; balanced by construction rather
 * than by luck (unlike the value range ver)
 * 
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
export function* tungSort(input) {
	const a = [...input];
	yield* processSegment(a, 0, a.length);
	yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

const MICRO_THRESHOLD = 12;

function* processSegment(a, start, end) {
	const size = end - start;
	if (size <= 1) return;

	if (size <= MICRO_THRESHOLD) {
		yield* insertionSweep(a, start, end);
		return;
	}

	let p1Idx = start + Math.floor(size / 3);
	let p2Idx = start + Math.floor((size * 2) / 3);

	yield { array: [...a], comparing: [p1Idx, p2Idx], swapping: [], sortedIndices: [] };
	if (a[p1Idx] > a[p2Idx]) {
		[a[p1Idx], a[p2Idx]] = [a[p2Idx], a[p1Idx]];
		yield { array: [...a], comparing: [], swapping: [p1Idx, p2Idx], sortedIndices: [] };
	}

	const pivot1 = a[p1Idx];
	const pivot2 = a[p2Idx];

	[a[start], a[p1Idx]] = [a[p1Idx], a[start]];
	yield { array: [...a], comparing: [], swapping: [start, p1Idx], sortedIndices: [] };
	[a[end - 1], a[p2Idx]] = [a[p2Idx], a[end - 1]];
	yield { array: [...a], comparing: [], swapping: [end - 1, p2Idx], sortedIndices: [] };

	let low = start + 1;
	let cur = start + 1;
	let high = end - 2;

	while (cur <= high) {
		yield { array: [...a], comparing: [cur], swapping: [], sortedIndices: [] };

		if (a[cur] < pivot1) {
			[a[low], a[cur]] = [a[cur], a[low]];
			yield { array: [...a], comparing: [], swapping: [low, cur], sortedIndices: [] };
			low++;
			cur++;
		} else if (a[cur] > pivot2) {
			[a[cur], a[high]] = [a[high], a[cur]];
			yield { array: [...a], comparing: [], swapping: [cur, high], sortedIndices: [] };
			high--;
		} else {
			cur++;
		}
	}

	low--;
	high++;
	[a[start], a[low]] = [a[low], a[start]];
	yield { array: [...a], comparing: [], swapping: [start, low], sortedIndices: [] };
	[a[end - 1], a[high]] = [a[high], a[end - 1]];
	yield { array: [...a], comparing: [], swapping: [end - 1, high], sortedIndices: [] };

	yield* processSegment(a, start, low);
	if (pivot1 < pivot2) {
		yield* processSegment(a, low + 1, high);
	}
	yield* processSegment(a, high + 1, end);
}

function* insertionSweep(a, start, end) {
	for (let i = start + 1; i < end; i++) {
		const current = a[i];
		let j = i - 1;

		while (j >= start) {
			yield { array: [...a], comparing: [j, j + 1], swapping: [], sortedIndices: [] };
			if (a[j] <= current) break;

			a[j + 1] = a[j];
			yield { array: [...a], swapping: [j, j + 1], comparing: [], sortedIndices: [] };
			j--;
		}
		a[j + 1] = current;
	}
}
