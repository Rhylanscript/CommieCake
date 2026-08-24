// public/js/arrayGenerators.js

function generateShuffledArray(size) {
    const values = Array.from({ length: size }, (_, i) => i + 1);
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
}

function generateNearlySorted(size) {
    const values = Array.from({ length: size }, (_, i) => i + 1);
    const swapCount = Math.max(1, Math.round(size * 0.05));
    for (let i = 0; i < swapCount; i++) {
        const idx = Math.floor(Math.random() * (size - 1));
        [values[idx], values[idx + 1]] = [values[idx + 1], values[idx]];
    }
    return values;
}

function generateFewUnique(size) {
    const poolSize = Math.max(2, Math.min(8, Math.ceil(size / 10)));
    const pool = Array.from({ length: poolSize }, (_, i) => Math.round(((i + 1) / poolSize) * size));
    return Array.from({ length: size }, () => pool[Math.floor(Math.random() * pool.length)]);
}

// array generator registry

export const ARRAY_GENERATORS = [
    { id: 'random', name: 'Random', generate: generateShuffledArray },
    { id: 'sorted', name: 'Sorted', generate: (size) => Array.from({ length: size }, (_, i) => i + 1) },
    { id: 'reversed', name: 'Reversed', generate: (size) => Array.from({ length: size }, (_, i) => size - i) },
    { id: 'nearlySorted', name: 'Nearly Sorted', generate: generateNearlySorted },
    { id: 'fewUnique', name: 'Few Unique', generate: generateFewUnique },
];

export function getGeneratorById(id) {
    return ARRAY_GENERATORS.find((g) => g.id === id) ?? ARRAY_GENERATORS[0];
}
