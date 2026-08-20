// public/js/algorithms/communistSort.js

const meta = {
	id: 'communist',
	name: 'Communist Sort',
    category: 'Miscellaneous',
	time: 'O(n)',
    space: 'O(1)',
    stable: false,
    inPlace: true,
	description: "Replaces every value with the average. All values are equal, therefore sorted.",
    file: import.meta.url,
};

/**
 * Communist Sort
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* communistSort(input) {
    const a = [...input];
    const n = a.length;
    if (n === 0) {
        yield { array: [], comparing: [], swapping: [], sortedIndices: [] };
        return;
    }

    // 1: collect contributions to average
    let sum = 0;
    for (let i = 0; i < n; i++) {
        yield { array: [...a], comparing: [i], swapping: [], sortedIndices: [] };
        sum += a[i];
    }
    const equalValue = Math.round(sum / n);

    // 2: redistribute the same value to everyone
    for (let i = 0; i < n; i++) {
        a[i] = equalValue;
        yield { array: [...a], comparing: [], swapping: [i], sortedIndices: Array.from({ length: i + 1 }, (_, k) => k) };
    }

    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

export default { meta, run: communistSort };
