// public/js/algorithms/gnomeSort.js

const meta = {
    id: 'gnome',
    name: 'Gnome Sort',
    category: 'Comparison',
    complexity: 'O(n²)',
    description: "Like insertion sort but implemented as a single walking pointer. Step forward when the pair behind you is fine, step backward (after swapping) when it isnt.",
    file: import.meta.url,
};

/**
 * Gnome Sort
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* gnomeSort(input) {
    const a = [...input];
    const n = a.length;
    let i = 0;

    while (i < n) {
        if (i === 0) {
            i++;
            continue;
        }

        yield { array: [...a], comparing: [i - 1, i], swapping: [], sortedIndices: [] };

        if (a[i - 1] <= a[i]) {
            i++;
        } else {
            [a[i - 1], a[i]] = [a[i], a[i - 1]];
            yield { array: [...a], comparing: [], swapping: [i - 1, i], sortedIndices: [] };
            i--;
        }
    }
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

export default { meta, run: gnomeSort };
