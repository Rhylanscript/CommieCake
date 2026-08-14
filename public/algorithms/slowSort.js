// public/js/algorithms/slowSort.js

const meta = {
	id: 'slow',
	name: 'Slowsort',
    category: 'Miscellaneous',
	complexity: 'O(n^log n)',
	description: "The evil twin of quicksort that uses the 'multiply and surrender' strategy: deliberately does more recursive work than necessary at every step.",
    file: import.meta.url,
};

/**
 * Slowsort
 * ~O(n^(log n)) - grows super fast. keep array size around 10-15 
 * or lower, or this will hang the tab lol
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* slowSort(input) {
    const a = [...input];
    yield* sortRange(a, 0, a.length - 1);
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

function* sortRange(a, i, j) {
    if (i >= j) return;

    const mid = Math.floor((i + j) / 2);
    yield* sortRange(a, i, mid);
    yield* sortRange(a, mid + 1, j);

    yield { array: [...a], comparing: [mid, j], swapping: [], sortedIndices: [] };
    if (a[j] < a[mid]) {
        [a[mid], a[j]] = [a[j], a[mid]];
        yield { array: [...a], comparing: [], swapping: [mid, j], sortedIndices: [] };
    }

    yield* sortRange(a, i, j - 1);
}

export default { meta, run: slowSort };
