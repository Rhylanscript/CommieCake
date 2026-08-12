// public/js/algorithms/bubbleSort.js

const meta = {
    id: 'bubble',
    name: 'Bubble Sort',
    complexity: 'O(n²)',
    description: "Repeatedly swaps adjacent out of order elements, letting the largest values 'bubble' to the end each pass."
};

/**
 * Bubble sort.
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* bubbleSort(input) {
    const a = [...input];
    const n = a.length;

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            yield { array: [...a], comparing: [j, j + 1], swapping: [], sortedIndices: [] };

            if (a[j] > a[j + 1]) {
                [a[j], a[j+1]] = [a[j+1], a[j]];
                yield { array: [...a], comparing: [], swapping: [j, j + 1], sortedIndices: [] };
            }
        }
    }

    // everythings sorted now
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

export default { meta, run: bubbleSort };
