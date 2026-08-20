// public/js/algorithms/thanosSort.js

const meta = {
    id: 'thanos',
    name: 'Thanos Sort',
    category: 'Miscellaneous',
    time: 'O(log n)',
    space: 'O(1)',
    stable: true,
    inPlace: true,
    description: "Checks if the array is sorted. If it isnt, randomly deletes half of the elements. Repeats until the array is sorted.",
    file: import.meta.url,
};

/**
 * Thanos Sort
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* thanosSort(input) {
    let a = [...input];

    while (a.length > 1) {
        // check if current array is sorted
        let isSorted = true;
        for (let i = 0; i < a.length - 1; i++) {
            // highlight two elements being compared
            yield { array: [...a], comparing: [i, i+1], swapping: [], sortedIndices: [] };

            if (a[i] > a[i + 1]) {
                isSorted = false;
                break;  // the array is unsorted :(
            }
        }

        if (isSorted) {
            break;
        }

        // select half the array and DELETE it
        const halfSize = Math.floor(a.length / 2);
        const indicesToVaporise = [];

        while (indicesToVaporise.length < halfSize) {
            const randIndex = Math.floor(Math.random() * a.length);
            if (!indicesToVaporise.includes(randIndex)) {
                indicesToVaporise.push(randIndex);
            }
        }

        // flash elements being vaporised using swapping
        yield { array: [...a], comparing: [], swapping: [...indicesToVaporise], sortedIndices: [] };

        // delete the victims
        a = a.filter((_, idx) => !indicesToVaporise.includes(idx));

        // yield the new state
        yield { array: [...a], comparing: [], swapping: [], sortedIndices: [] };
    }

    // yield the final ordered array
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

export default { meta, run: thanosSort };
