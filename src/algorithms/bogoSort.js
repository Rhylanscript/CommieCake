// src/js/algorithms/bogoSort.js

/**
 * Bogo Sort ("stupid sort") — shuffles randomly and checks if it got lucky.
 * Expected O((n+1)!) — this is a joke algorithm. Keep array size very small
 * (under ~8-10) or it will run effectively forever.
 * @param {number[]} input
 * @yields {object} step snapshot — { array, comparing, swapping, sortedIndices }
 */
export function* bogoSort(input) {
    const a = [...input];

    while (!(yield* isSorted(a))) {
        shuffle(a);
        yield { array: [...a], comparing: [], swapping: a.map((_, i) => i), sortedIndices: [] };
    }

    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

function* isSorted(a) {
    for (let i = 0; i < a.length - 1; i++) {
        yield { array: [...a], comparing: [i, i + 1], swapping: [], sortedIndices: [] };
        if (a[i] > a[i + 1]) return false;
    }
    return true;
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}