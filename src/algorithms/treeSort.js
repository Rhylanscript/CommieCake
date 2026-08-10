// src/js/algorithms/treeSort.js

/**
 * Tree Sort - builds a binary search tree from the array (phase 1), then
 * reads it back out via an in order traversal (phase 2), which visits bst
 * nodes in ascending order for free 
 * 
 * structurally the most different algorithm here: two phases 
 * threaded together with `yield*` rather than one loop over the array
 * 
 * @param {number[]} input
 * @yields {object} step snapshot - { array, comparing, swapping, sortedIndices }
 */
export function* treeSort(input) {
    const a = [...input];
    const n = a.length;
    let root = null;

    // 1: insert every value into the bst
    for (let i = 0; i < n; i++) {
        root = yield* insertNode(root, a[i], a, i);
    }

    // 2: in order traversal writes values back in ascending order
    const sortedIndices = [];
    yield* inOrderWrite(root, a, sortedIndices, { writeIndex: 0 });

    yield { array: [...a], comparing: [], swapping: [], sortedIndices: a.map((_, i) => i) };
}

// inserts `value` into the bst rooted at `node`, returning the (possibly new) root
function* insertNode(node, value, a, sourceIndex) {
    if (node === null) {
        return { value, left: null, right: null };
    }
    yield { array: [...a], comparing: [sourceIndex], swapping: [], sortedIndices: [] };

    if (value < node.value) {
        node.left = yield* insertNode(node.left, value, a, sourceIndex);
    } else {
        node.right = yield* insertNode(node.right, value, a, sourceIndex);
    }
    return node;
}

// in order traversal (left, self, right) which visits bst nodes in ascending order
function* inOrderWrite(node, a, sortedIndices, progress) {
    if (node === null) return;

    yield* inOrderWrite(node.left, a, sortedIndices, progress);

    a[progress.writeIndex] = node.value;
    sortedIndices.push(progress.writeIndex);
    yield { array: [...a], comparing: [], swapping: [progress.writeIndex], sortedIndices: [...sortedIndices] };
    progress.writeIndex++;

    yield* inOrderWrite(node.right, a, sortedIndices, progress);
}