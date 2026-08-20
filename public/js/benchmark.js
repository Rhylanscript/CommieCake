// public/js/benchmark.js

import { drawBenchmarkChart, drawBenchmarkLoadingMessage } from './renderer.js';
import { algorithms } from './registry.js';

// algorithm ids skipped here because they can take an unbounded/very long
// time at larger array sizes and would hang the browser mid-benchmark
const DONT_PLEASE_NO = ['bogo', 'slow'];

export function showBenchmarkLoading(ctx, canvas) {
	drawBenchmarkLoadingMessage(ctx, canvas);
}

export function runBenchmark(ctx, canvas, baseArray, size) {
	const results = algorithms
		.filter((algo) => !DONT_PLEASE_NO.includes(algo.id))
		.map((algo) => {
			const inputCopy = [...baseArray];
			const gen = algo.run(inputCopy);

			const start = performance.now();
			let done = false;
			while (!done) {
				done = gen.next().done;
			}
			const elapsedMs = performance.now() - start;

			return { name: algo.name, ms: elapsedMs };
		})
		.sort((a, b) => a.ms - b.ms);

	drawBenchmarkChart(ctx, canvas, results, size);
}
