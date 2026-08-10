// src/js/algorithms/mergeSort.js

/**
 * Merge Sort.
 * @param {number[]} input
 * @yields {object} step snapshot — { array, comparing, swapping, sortedIndices }
 */
export function* mergeSort(input) {
    const a = [...input];
    yield* sortRange(a, 0, a.length - 1);
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

// recursively splits [left, right] in half, sorts each half, then merges them
function* sortRange(a, left, right) {
    if (left >= right) return; // a single element is already "sorted"

    const mid = Math.floor((left + right) / 2);
    yield* sortRange(a, left, mid);
    yield* sortRange(a, mid + 1, right);
    yield* merge(a, left, mid, right);
}

// merges the two already sorted halves [left..mid] and [mid+1..right] back into `a`
function* merge(a, left, mid, right) {
    const leftPart = a.slice(left, mid + 1);
    const rightPart = a.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;

    while (i < leftPart.length && j < rightPart.length) {
        yield { array: [...a], comparing: [left + i, mid + 1 + j], swapping: [], sortedIndices: [] };

        if (leftPart[i] <= rightPart[j]) {
            a[k] = leftPart[i];
            i++;
        } else {
            a[k] = rightPart[j];
            j++;
        }
        yield { array: [...a], comparing: [], swapping: [k], sortedIndices: [] };
        k++;
    }

    // drain whichever half still has leftovers
    while (i < leftPart.length) {
        a[k] = leftPart[i];
        yield { array: [...a], comparing: [], swapping: [k], sortedIndices: [] };
        i++; k++;
    }
    while (j < rightPart.length) {
        a[k] = rightPart[j];
        yield { array: [...a], comparing: [], swapping: [k], sortedIndices: [] };
        j++; k++;
    }
}
