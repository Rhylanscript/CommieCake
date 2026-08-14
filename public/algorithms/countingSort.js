// public/js/algorithms/countingSort.js

const meta = {
	id: 'counting',
	name: 'Counting Sort',
    category: 'Non-Comparison',
	complexity: 'O(n + k)',
	description: 'Tallies how many times each value occurs, then writes values back out in order (no comparisons)',
};

/**
 * Counting Sort
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* countingSort(input) {
    const a = [...input];
    const n = a.length;
    const minVal = Math.min(...a);
    const maxVal = Math.max(...a);
    const counts = new Array(maxVal - minVal + 1).fill(0);
    const sortedIndices = [];

    // tally how many times each value occurs
    for (let i = 0; i < n; i++) {
        yield { array: [...a], comparing: [i], swapping: [], sortedIndices: [...sortedIndices] };
        counts[a[i] - minVal]++;
    }

    // write values back in ascending order 
    // each write lands in its TRUE final position 
    // (unlike merge sort the GOAT) so sortedIndices can grow
    // incrementally here
    let writeIndex = 0;
    for (let value = 0; value < counts.length; value++) {
        while (counts[value] > 0) {
            a[writeIndex] = value + minVal;
            sortedIndices.push(writeIndex);
            yield { array: [...a], comparing: [], swapping: [writeIndex], sortedIndices: [...sortedIndices] };
            counts[value]--;
            writeIndex++;
        }
    }

    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

export default { meta, run: countingSort };
