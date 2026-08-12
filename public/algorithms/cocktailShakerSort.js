// public/js/algorithms/cocktailShakerSort.js

const meta = {
    id: 'cocktail',
    name: 'Cocktail Shaker Sort',
    complexity: 'O(n²)',
    description: "Bubble sort that alternates direction each pass, shrinking the unsorted window from both ends at once.",
};

/**
 * Cocktail Shaker Sort
 * @param {number[]} input
 * @yields {object} step snapshot — { array, comparing, swapping, sortedIndices }
 */
function* cocktailShakerSort(input) {
    const a = [...input];
    let start = 0;
    let end = a.length - 1;
    let swapped = true;

    while (swapped) {
        swapped = false;

        for (let i = start; i < end; i++) {
            yield { array: [...a], comparing: [i, i + 1], swapping: [], sortedIndices: sortedEdges(a.length, start, end) };
            if (a[i] > a[i + 1]) {
                [a[i], a[i + 1]] = [a[i + 1], a[i]];
                swapped = true;
                yield { array: [...a], comparing: [], swapping: [i, i + 1], sortedIndices: sortedEdges(a.length, start, end) };
            }
        }
        end--;
        if (!swapped) break;

        swapped = false;
        for (let i = end; i > start; i--) {
            yield { array: [...a], comparing: [i - 1, i], swapping: [], sortedIndices: sortedEdges(a.length, start, end) };
            if (a[i - 1] > a[i]) {
                [a[i - 1], a[i]] = [a[i], a[i - 1]];
                swapped = true;
                yield { array: [...a], comparing: [], swapping: [i - 1, i], sortedIndices: sortedEdges(a.length, start, end) };
            }
        }
        start++;
    }
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

// everything outside current [start, end] window is already confirmed sorted
function sortedEdges(n, start, end) {
    const indices = [];
    for (let k = 0; k < start; k++) indices.push(k);
    for (let k = end + 1; k < n; k++) indices.push(k);
    return indices;
}

export default { meta, run: cocktailShakerSort };
