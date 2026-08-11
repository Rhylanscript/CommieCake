// src/js/algorithms/oddEvenSort.js

const meta = {
    id: 'oddeven',
    name: 'Odd-Even Transposition Sort',
    complexity: 'O(n²) sequential, O(n) phases',
    description: "Alternates comparing all even indexed and all odd indexed pairs simultaneously (designed for parallel hardware)",
};

/**
 * Odd-Even Transposition Sort.
 * @param {number[]} input
 * @yields {object} step snapshot — { array, comparing, swapping, sortedIndices }
 */
function* oddEvenSort(input) {
  const a = [...input];
  const n = a.length;
  let isSorted = false;

  while (!isSorted) {
    isSorted = true;

    isSorted = (yield* runPhase(a, 0)) && isSorted; // even phase
    isSorted = (yield* runPhase(a, 1)) && isSorted; // odd phase
  }

  yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

// Runs one full phase (every non-overlapping pair starting at `startIndex`),
// yielding the whole phase's comparisons together, then the whole phase's
// swaps together. Returns whether the array was already sorted going in
// (no swaps made), via `return` — captured by the `yield*` expression above.
function* runPhase(a, startIndex) {
  const n = a.length;
  const pairIndices = [];
  for (let i = startIndex; i < n - 1; i += 2) pairIndices.push(i);

  if (pairIndices.length === 0) return true;

  const comparing = pairIndices.flatMap((i) => [i, i + 1]);
  yield { array: [...a], comparing, swapping: [], sortedIndices: [] };

  const swapping = [];
  for (const i of pairIndices) {
    if (a[i] > a[i + 1]) {
      [a[i], a[i + 1]] = [a[i + 1], a[i]];
      swapping.push(i, i + 1);
    }
  }

  if (swapping.length > 0) {
    yield { array: [...a], comparing: [], swapping, sortedIndices: [] };
  }

  return swapping.length === 0;
}

export default { meta, run: oddEvenSort };
