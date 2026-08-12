// public/js/renderer.js

/**
 * Draws one animation frame
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {object} stepData - { array, comparing, swapping, sortedIndices, pivot }
 * @param {number} scaleMax - the fixed height reference
 */
export function drawBars(ctx, canvas, stepData, scaleMax) {
    const { array, comparing = [], swapping = [], sortedIndices = [], pivot = null } = stepData;
    const minBars = 5;
    const maxBars = 300;
    const scaleFactor = 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const t = Math.min(1, Math.max(0, (array.length - minBars) / (maxBars - minBars)));
    const barGap = scaleFactor * (1 - t)
    const barWidth = canvas.width / array.length;

    const maxValue = scaleMax ?? Math.max(...array, 1);
    const { leftStreakEnd, rightStreakStart } = getEdgeStreaks(array);

    array.forEach((value, i) => {
        const barHeight = (value / maxValue) * (canvas.height - 20);
        const x0 = Math.round(i * barWidth);
        const x1 = Math.round((i + 1) * barWidth);
        const y = canvas.height - barHeight;

        const isInEdgeStreak = i < leftStreakEnd || i >= rightStreakStart;
        ctx.fillStyle = colorFor(i, { 
            comparing, 
            swapping, 
            sortedIndices, 
            pivot, 
            isInEdgeStreak 
        });

        const isActive =
            comparing.includes(i) ||
            swapping.includes(i) ||
            i === pivot;

        const drawX = x0;
        const drawWidth = Math.max(1, (x1 - x0) - barGap);

        ctx.fillRect(
            drawX, 
            y, 
            drawWidth, 
            barHeight
        );
    });
}

// finds how far the "correctly placed" run extends inward from each edge
// a bar only counts as part of a streak if EVERY bar between it and that
// edge is also correctly placed so a lone correct bar surrounded by
// out of place ones doesnt qualify.

// leftStreakEnd = first idx (from the left) that is NOT part of the run
// rightStreakStart = first idx (from the right) that IS part of the run

function getEdgeStreaks(array) {
    const n = array.length;
    const isCorrect = (i) => array[i] === i + 1; // arrays here are always shuffled 1..n permutation

    let leftStreakEnd = 0;
    while (leftStreakEnd < n && isCorrect(leftStreakEnd)) leftStreakEnd++;

    let rightStreakStart = n;
    while (rightStreakStart > leftStreakEnd && isCorrect(rightStreakStart - 1)) rightStreakStart--;

    return { leftStreakEnd, rightStreakStart };
}

function colorFor(index, { comparing, swapping, sortedIndices, pivot, isInEdgeStreak }) {
    if (swapping.includes(index)) return '#e8483d';         // actively swapping
    if (index === pivot) return '#c34fe0';                  // purple for pivot
    if (comparing.includes(index)) return '#e8a33d';        // being compared
    if (sortedIndices.includes(index)) return '#3ec9b0';    // confirmed sorted

    // currently sitting in its final position but the algorithm hasnt proven it yet, 
    // meaning it isnt in sortedIndices - doesnt affect algorithm at all
    if (isInEdgeStreak) return '#1f6b5c';

    return '#4a5a8a';                                       // default bar color
}

/* --------------- BENCHMARK TEST ----------------- */

/**
 * Draws a horizontal bar chart comparing how long each algorithm took to
 * fully drain (no animation, no per step drawing js raw computation time)
 * log scaled because a linear scale would make the O(n log n) algorithms 
 * invisible as tiny slivers next to the O(n²) ones
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {{name: string, ms: number}[]} results - presorted fastest to slowest
 */
export function drawBenchmarkChart(ctx, canvas, results, arraySize) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const inset = 28;
    const labelWidth = 170;
    const rightPadding = 90;
    const chartWidth = canvas.width - inset * 2 - labelWidth - rightPadding;
    const topPadding = 54;
    const bottomPadding = 20;
    const rowHeight = (canvas.height - topPadding - bottomPadding) / results.length;
    const barHeight = Math.min(22, rowHeight * 0.55);

    ctx.fillStyle = '#8890b5';
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`BENCHMARK - n = ${arraySize}, single run, no animation`, inset, 28);

    const maxMs = Math.max(...results.map((r) => r.ms), 1);
    const scaledWidth = (ms) => Math.max(2, (Math.log10(ms + 1) / Math.log10(maxMs + 1)) * chartWidth);

    ctx.font = "13px 'JetBrains Mono', monospace";
    ctx.textBaseline = 'middle';

    results.forEach((result, i) => {
        const rowTop = topPadding + rowHeight * i;
        const y = rowTop + rowHeight / 2;
        
        if (i % 2 === 0) {
            ctx.fillStyle = 'rgba(46, 55, 104, 0.25)';
            ctx.fillRect(0, rowTop, canvas.width, rowHeight);
        }

        const barWidth = scaledWidth(result.ms);
        const barX = inset + labelWidth;

        ctx.fillStyle = '#e7e6dc';
        ctx.textAlign = 'left';
        ctx.fillText(result.name, inset, y);

        ctx.fillStyle = '#e8a33d';
        ctx.fillRect(barX, y - barHeight / 2, barWidth, barHeight);

        ctx.fillStyle = '#8890b5';
        ctx.fillText(`${result.ms.toFixed(2)}ms`, barX + barWidth + 10, y);
    });
}

export function drawBenchmarkLoadingMessage(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8890b5';
    ctx.font = "16px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Running benchmark…', canvas.width / 2, canvas.height / 2);
}