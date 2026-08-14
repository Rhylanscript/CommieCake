// public/js/algorithms/heapSort.js

const meta = {
    id: 'heap',
    name: 'Heap Sort',
    category: 'Divide & Conquer',
    complexity: 'O(n log n)',
    description: "Builds a max heap, then repeatedly swaps the root (largest remaining value) to the end and re heapifies.",
};

/**
 * Heap Sort
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* heapSort(input) {
    const a = [...input];
    const n = a.length;
    const sortedIndices = [];

    // defined inside heapSort so it closes over `a` and `sortedIndices`
    // instead of needing them passed on every recursive call
    function* heapify(heapSize, rootIndex) {
        let largest = rootIndex;
        const left = 2 * rootIndex + 1;
        const right = 2 * rootIndex + 2;

        if (left < heapSize) {
            yield { array: [...a], comparing: [largest, left], swapping: [], sortedIndices: [...sortedIndices] };
            if (a[left] > a[largest]) largest = left;
        }
        if (right < heapSize) {
            yield { array: [...a], comparing: [largest, right], swapping: [], sortedIndices: [...sortedIndices] };
            if (a[right] > a[largest]) largest = right;
        }
        if (largest !== rootIndex) {
            [a[rootIndex], a[largest]] = [a[largest], a[rootIndex]];
            yield { array: [...a], comparing: [], swapping: [rootIndex, largest], sortedIndices: [...sortedIndices] };
            yield* heapify(heapSize, largest);
        }
    }

    // build initial maxheap (start from the last parent node and work back to root)
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        yield* heapify(n, i);
    }

    // repeatedly extract the max to the end and re heapify the rest
    for (let i = n - 1; i > 0; i--) {
        [a[0], a[i]] = [a[i], a[0]];
        sortedIndices.push(i);
        yield { array: [...a], comparing: [], swapping: [0, i], sortedIndices: [...sortedIndices] };
        yield* heapify(i, 0);
    }

    sortedIndices.push(0);
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: [...sortedIndices] };
}

export default { meta, run: heapSort };
