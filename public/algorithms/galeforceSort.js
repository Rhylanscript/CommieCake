// public/algorithms/galeForceSort.js

const meta = {
    id: 'galeforce',
    name: 'Gale-Force Sort',
    category: 'Comparison',
    complexity: 'O(n²)',
    description: 'Simulates a wind tunnel. A forward gust carries small elements ahead, a reverse tide drags large elements back, and localized micro-turbulence rapidly shakes items into place.',
    file: import.meta.url,
};

/**
 * @param {number[]} input - the array to sort. NEVER mutate this directly.
 * @yields {object} step snapshot
 */
function* galeForceSort(input) {
    const a = [...input];
    let left = 0;
    let right = a.length - 1;
    let swapped = true;

    // Track which elements are strictly locked in their final positions
    const finalized = new Set();

    while (left < right && swapped) {
        swapped = false;

        // --- FORWARD PASS (The Left Gust) ---
        for (let i = left; i < right; i++) {
            const currentSorted = Array.from(finalized);

            // 1. Show the comparison BEFORE deciding whether to swap
            yield { array: [...a], comparing: [i, i + 1], swapping: [], sortedIndices: currentSorted };

            if (a[i] > a[i + 1]) {
                [a[i], a[i + 1]] = [a[i + 1], a[i]];
                swapped = true;

                // 2. Show the swap that just occurred
                yield { array: [...a], comparing: [], swapping: [i, i + 1], sortedIndices: currentSorted };

                // Micro-turbulence: Check one step backward instantly
                if (i > left) {
                    yield { array: [...a], comparing: [i - 1, i], swapping: [], sortedIndices: currentSorted };
                    
                    if (a[i - 1] > a[i]) {
                        [a[i - 1], a[i]] = [a[i], a[i - 1]];
                        yield { array: [...a], comparing: [], swapping: [i - 1, i], sortedIndices: currentSorted };
                    }
                }
            }
        }

        // Rightmost element is now proven to be in its final position
        finalized.add(right);
        right--;

        if (!swapped) break;
        swapped = false;

        // --- BACKWARD PASS (The Right Gust) ---
        for (let i = right; i >= left + 1; i--) {
            const currentSorted = Array.from(finalized);

            // 1. Show the comparison BEFORE deciding whether to swap
            yield { array: [...a], comparing: [i - 1, i], swapping: [], sortedIndices: currentSorted };

            if (a[i] < a[i - 1]) {
                [a[i], a[i - 1]] = [a[i - 1], a[i]];
                swapped = true;

                // 2. Show the swap that just occurred
                yield { array: [...a], comparing: [], swapping: [i - 1, i], sortedIndices: currentSorted };

                // Micro-turbulence: Check one step forward instantly
                if (i < right) {
                    yield { array: [...a], comparing: [i, i + 1], swapping: [], sortedIndices: currentSorted };

                    if (a[i] > a[i + 1]) {
                        [a[i], a[i + 1]] = [a[i + 1], a[i]];
                        yield { array: [...a], comparing: [], swapping: [i, i + 1], sortedIndices: currentSorted };
                    }
                }
            }
        }

        // Leftmost element is now proven to be in its final position
        finalized.add(left);
        left++;
    }

    // Final mandatory step: Mark everything globally sorted so it flashes green at the end!
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

export default { meta, run: galeForceSort };
