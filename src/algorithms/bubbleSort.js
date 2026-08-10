// src/js/algorithms/bubbleSort.js

/**
 * Bubble sort.
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
export function* bubbleSort(input) {
    const a = [...input];
    const n = a.length;

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            // show comparison
            yield { array: [...a], comparing: [j, j + 1], swapping: [], sortedIndices: [] };

            if (a[j] > a[j + 1]) {
                [a[j], a[j+1]] = [a[j+1], a[j]];
                // show the swap
                yield { array: [...a], comparing: [], swapping: [j, j + 1], sortedIndices: [] };
            }
        }
    }

    // everythings sorted now
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}