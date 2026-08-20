// public/js/algorithms/quickSort.js

const meta = {
    id: 'quick',
    name: 'Quicksort',
    category: 'Divide & Conquer',
    time: 'O(n log n) avg',
    space: 'O(log n)',
    stable: false,
    inPlace: true,
    description: "Picks a pivot, partitions smaller values to one side and larger to the other, then recurses on each side.",
    file: import.meta.url,
};

/**
 * Quick Sort
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices, pivot }
 */
function* quickSort(input) {
    const a = [...input];
    yield* sortRange(a, 0, a.length - 1);
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

function* sortRange(a, low, high) {
    if (low >= high) return;

    const pivotIndex = yield* partition(a, low, high);
    yield* sortRange(a, low, pivotIndex - 1);
    yield* sortRange(a, pivotIndex + 1, high);
}

function* partition(a, low, high) {
    const pivotValue = a[high];
    let i = low - 1; // bound of the 'smaller than pivot' region

    for (let j = low; j < high; j++) {
        yield { array: [...a], comparing: [j, high], swapping: [], sortedIndices: [], pivot: high };

        if (a[j] < pivotValue) {
            i++;
            [a[i], a[j]] = [a[j], a[i]];
            yield { array: [...a], comparing: [], swapping: [i, j], sortedIndices: [], pivot: high };
        }
    }

    [a[i + 1], a[high]] = [a[high], a[i + 1]]; // drop pivot to final spot
    yield { array: [...a], comparing: [], swapping: [i + 1, high], sortedIndices: [], pivot: i + 1 };

    return i + 1; // pivots final resting idx
}

export default { meta, run: quickSort };
