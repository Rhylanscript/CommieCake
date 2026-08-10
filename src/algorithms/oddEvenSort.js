// src/js/algorithms/oddEvenSort.js

/**
 * Odd-Even Transposition Sort. Alternates between two full passes each
 * round: compare-and-swap every EVEN-indexed pair (0,1),(2,3),... at once,
 * then every ODD-indexed pair (1,2),(3,4),... at once. Unlike every other
 * algorithm here, each yield represents a whole phase's worth of pairs
 * happening simultaneously — not a single cursor crawling one step at a
 * time — which is why it reads as "waves" across the array rather than a
 * moving highlight.
 * @param {number[]} input
 * @yields {object} step snapshot — { array, comparing, swapping, sortedIndices }
 */
export function* oddEvenSort(input) {
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