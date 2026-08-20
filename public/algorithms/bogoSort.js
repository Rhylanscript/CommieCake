// public/js/algorithms/bogoSort.js

const meta = {
	id: 'bogo',
	name: 'Bogo Sort',
    category: 'Miscellaneous',
	time: 'O((n+1)!) expected',
    space: 'O(1)',
    stable: false,
    inPlace: true,
	description: "Shuffles randomly and checks if it got lucky. Expected runtime is astronomically bad.",
    file: import.meta.url,
};

/**
 * Bogo Sort ("stupid sort")
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* bogoSort(input) {
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

export default { meta, run: bogoSort };
