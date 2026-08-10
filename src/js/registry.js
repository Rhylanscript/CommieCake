// src/js/registry.js

import { bogoSort } from "../algorithms/bogoSort.js";
import { bubbleSort } from "../algorithms/bubblesort.js";
import { bucketSort } from "../algorithms/bucketSort.js";
import { cocktailShakerSort } from "../algorithms/cocktailShakerSort.js";
import { communistSort } from "../algorithms/communistSort.js";
import { countingSort } from "../algorithms/countingSort.js";
import { gnomeSort } from "../algorithms/gnomeSort.js";
import { heapSort } from "../algorithms/heapSort.js";
import { insertionSort } from "../algorithms/insertionSort.js";
import { mergeSort } from "../algorithms/mergeSort.js";
import { oddEvenSort } from "../algorithms/oddEvenSort.js";
import { pancakeSort } from "../algorithms/pancakeSort.js";
import { quickSort } from "../algorithms/quickSort.js";
import { radixSort } from "../algorithms/radixSort.js";
import { selectionSort } from "../algorithms/selectionSort.js";
import { shellSort } from "../algorithms/shellSort.js";
import { slowSort } from "../algorithms/slowSort.js";
import { stalinSort } from "../algorithms/stalinSort.js";
import { treeSort } from "../algorithms/treeSort.js";
import { tungSort } from "../algorithms/tungSort.js";

// symbols lol 
// ² — ±

export const algorithms = [
    { id: 'bubble',     name: 'Bubble Sort',                    complexity: 'O(n²)',                        run: bubbleSort         },
    { id: 'selection',  name: 'Selection Sort',                 complexity: 'O(n²)',                        run: selectionSort      },
    { id: 'insertion',  name: 'Insertion Sort',                 complexity: 'O(n²)',                        run: insertionSort      },
    { id: 'gnome',      name: 'Gnome Sort',                     complexity: 'O(n²)',                        run: gnomeSort          },
    { id: 'shell',      name: 'Shell Sort',                     complexity: 'O(n log² n) approx',           run: shellSort          },
    { id: 'oddeven',    name: 'Odd Even Transposition Sort',    complexity: 'O(n²) sequential, O(n) phases',run: oddEvenSort        },
    { id: 'cocktail',   name: 'Cocktail Shaker Sort',           complexity: 'O(n²)',                        run: cocktailShakerSort },
    { id: 'pancake',    name: 'Pancake Sort',                   complexity: 'O(n²)',                        run: pancakeSort        },
    { id: 'merge',      name: 'Merge Sort',                     complexity: 'O(n log n)',                   run: mergeSort          },
    { id: 'quick',      name: 'Quicksort',                      complexity: 'O(n log n) avg',               run: quickSort          },
    { id: 'heap',       name: 'Heap Sort',                      complexity: 'O(n log n)',                   run: heapSort           },
    { id: 'tree',       name: 'Tree Sort',                      complexity: 'O(n log n) avg, O(n²) worst',  run: treeSort           },
    { id: 'bucket',     name: 'Bucket Sort',                    complexity: 'O(n + k) avg, O(n²) worst',    run: bucketSort         },
    { id: 'counting',   name: 'Counting Sort',                  complexity: 'O(n + k)',                     run: countingSort       },
    { id: 'radix',      name: 'Radix Sort',                     complexity: 'O(d(n + k))',                  run: radixSort          },
    { id: 'tung',       name: 'Tung Sort',                      complexity: 'O(n log n) avg',                        run: tungSort           },
    { id: 'stalin',     name: 'Stalin Sort',                    complexity: 'O(n) + minor casualties',      run: stalinSort         },
    { id: 'communist',  name: 'Communist Sort',                 complexity: 'O(n)',                         run: communistSort      },
    { id: 'slow',       name: 'Slowsort',                       complexity: 'O(n^log n)',                   run: slowSort           },
    { id: 'bogo',       name: 'Bogo Sort',                      complexity: 'O((n+1)!) expected',           run: bogoSort           },
];
