# Writing a New Algorithm

Each algorithm lives in its own file in `public/algorithms` and follows the same contract. If this doc is followed, your algorithm will automatically get the picker entry, description, code panel, live counters, sound hooks and benchmark mode.

## File Template

```javascript
// public/algorithms/yourSort.js

const meta = {
    id: 'yoursort',         // unique lowercase identifier used only internally
    name: 'Your Sort',      // shown in the picker and code panel
    category: 'Comparison', // the ribbon the sort will be grouped under
    complexity: 'O(1)',     // shown as a stat when this algorithm is selected
    description: 'One or two sentences explaining how it works, shown in sidebar and info popup.',
    sound: {                // optional - see "custom sounds" below
        swap: 'assets/sounds/your-swap.mp3',
        comparison: 'assets/sounds/your-comparison.mp3',
    },
    file: import.meta.url,  // always include this so the code panel can find the source code
}

/**
 * @param {number[]} input - the array to sort. NEVER mutate this directly - always work on a copy (see `const a = [...input]` below).
 * @yields {object} step snapshot - see "The step snapshot" below
 */
function yourSort(input) {
    const a = [...input];

    // ... your sorting logic, yielding snapshots at important moments ...

    // Always yield a final completed step when everything is sorted
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

// export the metadata and your algorithm as a function
export default { meta, run: yourSort };
```

Two things about the export worth noting:

- Its a **default** export (`export default {...}`) not a named one. Importing it elsewhere looks like `import yourSort from './algorithms/yourSort.js'` (lack of curly braces).
- The generator function itself is **not exported directly**, its exported as the `run` property of the default exported object alongside `meta`.

## The Step Snapshot

Every `yield` should produce an object with this shape:

```javascript
{
    array,          // REQUIRED: the full current state of the array (a copy, see below)
    comparing,      // array of indices currently being compared, e.g. [3, 7]. Can be empty.
    swapping,       // array of indices currently being swapped, e.g. [5, 12]. Can be empty.
    sortedIndices,  // array of indices the algorithm has confirmed are in their final position
    pivot,          // optional: a single index to highlight distinctly (used by quicksort)
}
```

A few rules that matter more than they look like they would:

- **`array` must be a fresh copy every time** (`[..a]`), not a reference to your working array. If you yield the same array reference repeatedly and keep mutating it, every already rendered frame changes too, since canvas drawing reads whatever the object currently holds
- **`comparing`/`swapping` almost always hold exactly 2 indices** - the pair being compared or swapped. An array with a single index (`[i]`) is a valid alternative meaning "reading/writing this one position" - counting sort, radix sort, and tree sort all do this. The renderer doesnt care about the distinction, it just highlights whatever indices are listed.
- **`sortedIndices` means "proven".** Only include an index once your algorithms own logic is sure that value wont move again. Dont include an index just because it happens to hold the right value right now as the visualizer separately (and automatically) shows a dimmer green highlight for "currently correct but unconfirmed" positions, which is calculated independently of what you yield
**Yield at every comparison and every swap**, not just at the end of a pass. The whole point of this being a *visualizer* is watching it happen and an algorithm that only yields once per outer loop will look like its teleporting.

## An Example of a Fully Complete Sort

```javascript
// public/algorithms/exampleSort.js
// (This is just bubble sorts first pass for illustration)

const meta = {
    id: 'example',
    name: 'Example Sort',
    category: 'Comparison',
    complexity: 'O(n)',
    description: 'A single left to right pass, swapping adjacent out of order pairs.',
    file: import.meta.url,
};

function* exampleSort(input) {
    const a = [...input];       // work on a copy and never mutate `input`
    const n = a.length;

    for (let i = 0; i < n - 1; i++) {
        // show the comparison BEFORE deciding whether to swap
        yield { array: [...a], comparing: [i, i + 1], swapping: [], sortedIndices: [] };

        if (a[i] > a[i + 1]) {
            [a[i], a[i + 1]] = [a[i + 1], a[i]];
            // show the swap that just happened
            yield { array: [...a], comparing: [], swapping: [i, i + 1], sortedIndices: [] };
        }
    }

    // final step: mark everything sorted (only accurate here because this
    // example finishes sorted after one pass; a real multi pass algorithm 
    // should only do this on its LAST pass
    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

export default { meta, run: exampleSort };
```

## Registering it

Open `public/js/registry.js` and add two lines:

```javascript
import yourSort from '../algorithms/yourSort.js';    // 1. import it (may be added automatically)

const modules = [
    // ...existing entries...
    yourSort,                                       // 2. add it to the list
];
```

Thats all, nothing in `main.js`, `renderer.js`, or anywhere else needs to change.

## Custom sounds (optional)

By default, comparisons and swaps play tones pitched by values. To use a custom sound instead, add a `sound` field to `meta`:

```javascript
const meta = {
    // ...
    sound: {
        swap: 'assets/sounds/your-swap.mp3',
        comparison: 'assets/sounds/your-comparison.mp3',
    },
};
```

- Drop the audio file in `public/assets/sounds/`.
- Its preloaded automatically at startup (found by scanning every registered algorithm's `meta.sound`) so no extra registration needed beyond adding the field
- Playback rate (not true pitch shifting) is varied by bar value, so the clip still audibly rises and falls with bar height while staying recognizable (hopefully)
- If the file fails to load (wrong path, 404, some slop), it silently falls back to the default synth tone - check the console for a "Failed to load custom sound" error if it isnt playing

## Common mistakes (learned the hard way on this project)

- **`yield* someGenerator() && somethingElse`** doesnt do what it looks like because `yield*` has lower precedence than `&&`, so it will try to delegate into the *result* of the whole expression, not just the generator call for some reason. Wrap it in brackets: `(yield* someGenerator()) && somethingElse`
- **A closure defined and called repeatedly inside a hot loop is much more expensive inside a generator than the same pattern in a normal function** - V8 doesnt optimize it the same way (FOR SOME REASON??????). If a value doesnt change within an outer loop iteration, compute it once outside the inner loop, not via a function called from inside it.
- **Don't forget the final "all sorted" yield.** Without it, the algorithm will stop animating one step early, and the bars will never show fully sorted (very sad)

## Testing your algorithm before committing

1. Select it in the picker, click **Step** repeatedly, confirm each snapshot looks correct and the array visibly converges toward sorted
2. Click **Start** at a slow-medium speed and watch it run to completion.
3. Open **Show Code** and confirm your source renders and highlights correctly.
4. Run **Benchmark**, if your algorithm can take a very long time at large array sizes (like Bogo Sort or Slowsort), add its `id` to the `NEVER_FINISHES_AT_SCALE` array in `main.js`'s `runBenchmark()` so Benchmark mode skips it instead of hanging the browser.

Happy coding[!][whatsthis]

[whatsthis]: ../css/important.css
