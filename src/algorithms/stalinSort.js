// src/js/algorithms/stalinSort.js

/**
 * stalin Sort - walks through once whilst keeping a running "last approved" value
 * anything smaller than the last approved value gets DELETED
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
export function* stalinSort(input) {
    const a = [...input];
    if (a.length === 0) {
        yield { array: [], comparing: [], swapping: [], sortedIndices: [] };
        return;
    }

    let lastApprovedValue = a[0];
    let i = 1;

    while (i < a.length) {
        // the element just before `i` is always the most recently approved
        // value since deleting never touches anything before the current index
        yield { array: [...a], comparing: [i - 1, i], swapping: [], sortedIndices: [] };

        if (a[i] < lastApprovedValue) {
            a.splice(i, 1); // did not conform to the established order? DELETED!
            yield { array: [...a], comparing: [], swapping: [Math.min(i, a.length - 1)], sortedIndices: [] };
        } else {
            lastApprovedValue = a[i];
            i++;
        }
    }

    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, k) => k) };
}
