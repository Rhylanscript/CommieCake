// public/js/algorithms/pancakeSort.js

const meta = {
    id: 'pancake',
    name: 'Pancake Sort',
    category: 'Comparison',
    complexity: 'O(n²)',
    description: "Sorts using one move: flipping (reversing) the front of the array (like sorting pancakes with a spatula)",
};

/**
 * Pancake Sort
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* pancakeSort(input) {
    const a = [...input];
    const n = a.length;
    const sortedIndices = [];

    for (let size = n; size > 1; size--) {
        let maxIndex = 0;
        for (let i = 1; i < size; i++) {
            yield { array: [...a], comparing: [maxIndex, i], swapping: [], sortedIndices: [...sortedIndices] };
            if (a[i] > a[maxIndex]) maxIndex = i;
        }

        if (maxIndex !== size - 1) {
            if (maxIndex !== 0) yield* flip(a, maxIndex);
            yield* flip(a, size - 1);
        }

        sortedIndices.push(size - 1);
    }

    sortedIndices.push(0);
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: [...sortedIndices] };
}

// reverses a[0..k] in place yielding each swap `swapping` here marks
// whichever two positions are being exchanged this instant - over
// whole flip the highlight sweeps inward from both ends
function* flip(a, k) {
    let left = 0;
    let right = k;
    while (left < right) {
        [a[left], a[right]] = [a[right], a[left]];
        yield { array: [...a], comparing: [], swapping: [left, right], sortedIndices: [] };
        left++;
        right--;
    }
}

export default { meta, run: pancakeSort };
