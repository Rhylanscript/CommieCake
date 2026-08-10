// src/js/algorithms/selectionSort.js

/**
 * Selection Sort
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
export function* selectionSort(input) {
    const a = [...input];
    const n = a.length;
    const sortedIndices = [];

    for (let i = 0; i < n; i++) {
        let minIndex = i;

        for (let j = i + 1; j < n; j++) {
            // show which element is the current "smallest found so far" vs the one being checked
            yield { array: [...a], comparing: [minIndex, j], swapping: [], sortedIndices: [...sortedIndices] };

            if (a[j] < a[minIndex]) {
                minIndex = j;
            }
        }

        if (minIndex !== i) {
            [a[i], a[minIndex]] = [a[minIndex], a[i]];
            yield { array: [...a], comparing: [], swapping: [i, minIndex], sortedIndices: [...sortedIndices] };
        }

        sortedIndices.push(i);
    }

    yield { array: [...a], comparing: [], swapping: [], sortedIndices: [...sortedIndices] };
}