// src/js/algorithms/shellSort.js

/**
 * Shell Sort - insertion sort, but comparing elements far apart first
 * (the "gap"), shrinking the gap each pass until it's plain insertion sort
 * @ gap=1
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
export function* shellSort(input) {
    const a = [...input];
    const n = a.length;

    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
        for (let i = gap; i < n; i++) {
            const temp = a[i];
            let j = i;

            while (j >= gap) {
                yield { array: [...a], comparing: [j - gap, j], swapping: [], sortedIndices: [] };
                if (a[j - gap] <= temp) break;

                a[j] = a[j - gap];
                yield { array: [...a], comparing: [], swapping: [j, j - gap], sortedIndices: [] };
                j -= gap;
            }
            a[j] = temp;
        }
    }

    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}