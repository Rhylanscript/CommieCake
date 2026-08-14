// public/js/algorithms/bucketSort.js

const meta = {
    id: 'bucket',
    name: 'Bucket Sort',
    category: 'Non-Comparison',
    complexity: 'O(n + k) avg, O(n²) worst',
    description: "Distributes values into several buckets by range, sorts each bucket individually, then concatenates them.",
};

/**
 * Bucket Sort
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
function* bucketSort(input) {
    const a = [...input];
    const n = a.length;
    const minVal = Math.min(...a);
    const maxVal = Math.max(...a);
    const bucketCount = Math.max(1, Math.ceil(Math.sqrt(n)));
    const bucketSize = Math.ceil((maxVal - minVal + 1) / bucketCount);
    const buckets = Array.from({ length: bucketCount }, () => []);

    // 1: distribute each value into its bucket
    for (let i = 0; i < n; i++) {
        yield { array: [...a], comparing: [i], swapping: [], sortedIndices: [] };
        const bucketIndex = Math.min(bucketCount - 1, Math.floor((a[i] - minVal) / bucketSize));
        buckets[bucketIndex].push(a[i]);
    }

    // 2: sort each bucket privately then write it back in order
    const sortedIndices = [];
    let writeIndex = 0;

    for (const bucket of buckets) {
        insertionSortInPlace(bucket);

        for (const value of bucket) {
            a[writeIndex] = value;
            sortedIndices.push(writeIndex);
            yield { array: [...a], comparing: [], swapping: [writeIndex], sortedIndices: [...sortedIndices] };
            writeIndex++;
        }
    }

    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

// a plain insertion sort (no animation)
function insertionSortInPlace(bucket) {
    for (let i = 1; i < bucket.length; i++) {
        const current = bucket[i];
        let j = i - 1;
        while (j >= 0 && bucket[j] > current) {
            bucket[j + 1] = bucket[j];
            j--;
        }
        bucket[j + 1] = current;
    }
}

export default { meta, run: bucketSort };
