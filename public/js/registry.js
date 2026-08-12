// public/js/registry.js

import bogoSort from "../algorithms/bogoSort.js";
import bubblesort from "../algorithms/bubbleSort.js";
import bucketSort from "../algorithms/bucketSort.js";
import cocktailShakerSort from "../algorithms/cocktailShakerSort.js";
import communistSort from "../algorithms/communistSort.js";
import countingSort from "../algorithms/countingSort.js";
import gnomeSort from "../algorithms/gnomeSort.js";
import heapSort from "../algorithms/heapSort.js";
import insertionSort from "../algorithms/insertionSort.js";
import mergeSort from "../algorithms/mergeSort.js";
import oddEvenSort from "../algorithms/oddEvenSort.js";
import pancakeSort from "../algorithms/pancakeSort.js";
import quickSort from "../algorithms/quickSort.js";
import radixSort from "../algorithms/radixSort.js";
import selectionSort from "../algorithms/selectionSort.js";
import shellSort from "../algorithms/shellSort.js";
import slowSort from "../algorithms/slowSort.js";
import stalinSort from "../algorithms/stalinSort.js";
import treeSort from "../algorithms/treeSort.js";
import tungSort from "../algorithms/tungSort.js";

// modules and their { meta, run }

const modules = [
    bubblesort, selectionSort, insertionSort, gnomeSort, cocktailShakerSort, pancakeSort,
    shellSort, heapSort, oddEvenSort, mergeSort, quickSort, radixSort, treeSort, bucketSort,
    countingSort, tungSort, stalinSort, communistSort, slowSort, bogoSort,
];

export const algorithms = modules.map(({ meta, run }) => ({ ...meta, run }));
