// public/js/algorithms/insertionSort.js

const meta = {
    id: 'insertion',
    name: 'Insertion Sort',
    category: 'Comparison',
    time: 'O(n²)',
    space: 'O(1)',
    stable: true,
    inPlace: true,
    description: "Builds a sorted region one element at a time, shifting larger elements right to make room for each new one.",
    file: import.meta.url,
}

/**
 * Insertion Sort.
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* insertionSort(input) {
    const a = [...input];
    const n = a.length;

    for (let i = 1; i < n; i++) {
        const current = a[i];
        let j = i - 1;

        // the first `i` elements are always sorted relative to each other at this point
        const sortedSoFar = Array.from({ length: i }, (_, k) => k);

        while (j >= 0) {
            yield { array: [...a], comparing: [j, j + 1], swapping: [], sortedIndices: sortedSoFar };

            if (a[j] <= current) break; // found the right spot so stop shifting

            a[j + 1] = a[j]; // shift the bigger element right
            yield { array: [...a], swapping: [j, j + 1], comparing: [], sortedIndices: sortedSoFar };
            j--;
        }

        a[j + 1] = current; // drop `current` into its final spot for this pass
    }

    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

export default { meta, run: insertionSort };
