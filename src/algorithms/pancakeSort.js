// src/js/algorithms/pancakeSort.js

/**
 * Pancake Sort - sorts using only one operation: "flip (reverse) the first
 * k elements" repeatedly finds the largest unsorted value and flips it to
 * the front, then flips it again to send it to its final position at the
 * back of the unsorted region
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
export function* pancakeSort(input) {
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
