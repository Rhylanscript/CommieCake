// src/js/algorithms/radixSort.js

const meta = {
	id: 'radix',
	name: 'Radix Sort',
	complexity: 'O(d(n + k))',
	description: 'Sorts by one digit at a time, least significant first, using counting sort as the subroutine for each pass.',
};

/**
 * Radix Sort (LSD)
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* radixSort(input) {
    const a = [...input];
    const maxVal = Math.max(...a);
    let exp = 1; // 1, 10, 100, ... selects which digit countingPassByDigit reads

    while (Math.floor(maxVal / exp) > 0) {
        yield* countingPassByDigit(a, exp);
        exp *= 10;
    }

    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

// a stable counting sort keyed on one digit (selected by `exp`) rather than
// the whole value. like mergeSort, a value placed here can still move again
// on next digit pass so no sortedIndices are claimed midway through
function* countingPassByDigit(a, exp) {
	const n = a.length;
	const output = new Array(n).fill(0);
	const counts = new Array(10).fill(0);

	for (let i = 0; i < n; i++) {
		const digit = Math.floor(a[i] / exp) % 10;
		yield { array: [...a], comparing: [i], swapping: [], sortedIndices: [] };
		counts[digit]++;
	}

	for (let d = 1; d < 10; d++) counts[d] += counts[d - 1]; // running totals -> final positions

	for (let i = n - 1; i >= 0; i--) {
		const digit = Math.floor(a[i] / exp) % 10;
		counts[digit]--;
		output[counts[digit]] = a[i];
	}

	for (let i = 0; i < n; i++) {
		a[i] = output[i];
		yield { array: [...a], comparing: [], swapping: [i], sortedIndices: [] };
	}
}

export default { meta, run: radixSort };
