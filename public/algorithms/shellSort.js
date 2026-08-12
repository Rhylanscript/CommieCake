// public/js/algorithms/shellSort.js

const meta = {
    id: 'shell',
    name: 'Shell Sort',
    complexity: 'O(n log² n) approx',
    description: "Similar to insertion sort but compares far apart elements first using a shrinking gap, so big moves happen early.",
};

/**
 * Shell Sort
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* shellSort(input) {
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

export default { meta, run: shellSort };
