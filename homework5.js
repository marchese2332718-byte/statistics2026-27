// Homework 5: Welford's Recurrence Formulas and Sampling Statistics
// Exercise 1: Welford's algorithm for online mean and variance computation
// Exercise 2: Sampling mean and variance analysis with m hackers and n systems

// ============ Exercise 1: Welford's Recurrence Formulas ============

/**
 * Compute mean, variance, and sum of squares using Welford's recurrence formulas
 *
 * Formulas:
 * - M_k = M_{k-1} + (x_k - M_{k-1}) / k
 * - SS_k = SS_{k-1} + (x_k - M_{k-1}) * (x_k - M_k)
 * - Var_k = SS_k / k
 *
 * @param {number[]} data - Array of numerical values
 * @returns {{mean: number, variance: number, sumOfSquares: number}}
 */
function welfordOnlineStats(data) {
    let n = 0;
    let mean = 0;
    let SS = 0;

    for (const x of data) {
        n++;
        const meanPrev = mean;
        mean = meanPrev + (x - meanPrev) / n;
        SS = SS + (x - meanPrev) * (x - mean);
    }

    const variance = n > 0 ? SS / n : 0;
    return { mean, variance, sumOfSquares: SS };
}

// ============ Exercise 2: Sampling Statistics Simulation ============

/**
 * Simulate m hackers each attempting to penetrate n systems
 * Each attempt receives a score from 0 to 10 from a chosen distribution
 *
 * @param {number} m - Number of hackers
 * @param {number} n - Number of systems per hacker
 * @param {string} distribution - 'normal', 'uniform', or 'triangular'
 * @param {Object} params - Distribution parameters
 * @returns {{scores: number[][], theoreticalMean: number, theoreticalVariance: number}}
 */
function simulateHackerPenetrations(m, n, distribution = 'normal', params = {}) {
    const scores = [];
    let theoreticalMean, theoreticalVariance;

    if (distribution === 'normal') {
        // Normal distribution clipped to [0, 10]
        const mu = params.mu !== undefined ? params.mu : 5.0;
        const sigma = params.sigma !== undefined ? params.sigma : 1.5;
        theoreticalMean = mu;
        theoreticalVariance = sigma * sigma;

        for (let i = 0; i < m; i++) {
            const hackerScores = [];
            for (let j = 0; j < n; j++) {
                const score = Math.max(0, Math.min(10, randomNormal(mu, sigma)));
                hackerScores.push(score);
            }
            scores.push(hackerScores);
        }

    } else if (distribution === 'uniform') {
        // Uniform distribution on [a, b] ⊆ [0, 10]
        const a = params.a !== undefined ? params.a : 2.0;
        const b = params.b !== undefined ? params.b : 8.0;
        theoreticalMean = (a + b) / 2;
        theoreticalVariance = ((b - a) * (b - a)) / 12;

        for (let i = 0; i < m; i++) {
            const hackerScores = [];
            for (let j = 0; j < n; j++) {
                const score = a + Math.random() * (b - a);
                hackerScores.push(score);
            }
            scores.push(hackerScores);
        }

    } else if (distribution === 'triangular') {
        // Triangular distribution on [a, b] with mode c
        const a = params.a !== undefined ? params.a : 0;
        const b = params.b !== undefined ? params.b : 10;
        const c = params.c !== undefined ? params.c : 5;
        theoreticalMean = (a + b + c) / 3;
        theoreticalVariance = (a*a + b*b + c*c - a*b - a*c - b*c) / 18;

        for (let i = 0; i < m; i++) {
            const hackerScores = [];
            for (let j = 0; j < n; j++) {
                const score = randomTriangular(a, b, c);
                hackerScores.push(score);
            }
            scores.push(hackerScores);
        }
    }

    return { scores, theoreticalMean, theoreticalVariance };
}

/**
 * Analyze sampling statistics across m hackers
 * For each hacker, compute sampling mean and variance using Welford's algorithm
 *
 * @param {number} m - Number of hackers
 * @param {number} n - Number of systems per hacker
 * @param {string} distribution - Distribution type
 * @param {Object} params - Distribution parameters
 * @returns {Object} Analysis results
 */
function analyzeSamplingStatistics(m, n, distribution = 'normal', params = {}) {
    // Generate scores
    const { scores, theoreticalMean, theoreticalVariance } =
        simulateHackerPenetrations(m, n, distribution, params);

    // For each hacker, compute sampling mean and variance using Welford
    const samplingMeans = [];
    const samplingVariances = [];

    for (let i = 0; i < m; i++) {
        const { mean, variance } = welfordOnlineStats(scores[i]);
        samplingMeans.push(mean);
        samplingVariances.push(variance);
    }

    // Average of sampling means and variances
    const avgSamplingMean = mean(samplingMeans);
    const avgSamplingVariance = mean(samplingVariances);

    // Variability (standard deviation) of sampling statistics
    const stdSamplingMeans = stdDev(samplingMeans);
    const stdSamplingVariances = stdDev(samplingVariances);

    return {
        theoreticalMean,
        theoreticalVariance,
        samplingMeans,
        samplingVariances,
        avgSamplingMean,
        avgSamplingVariance,
        stdSamplingMeans,
        stdSamplingVariances,
        m,
        n,
        distribution
    };
}

// ============ Utility Functions ============

/**
 * Generate random number from normal distribution (Box-Muller transform)
 */
function randomNormal(mu = 0, sigma = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mu + sigma * z0;
}

/**
 * Generate random number from triangular distribution
 */
function randomTriangular(a, b, c) {
    const u = Math.random();
    const F_c = (c - a) / (b - a);

    if (u < F_c) {
        return a + Math.sqrt(u * (b - a) * (c - a));
    } else {
        return b - Math.sqrt((1 - u) * (b - a) * (b - c));
    }
}

/**
 * Calculate mean of array
 */
function mean(arr) {
    return arr.reduce((sum, x) => sum + x, 0) / arr.length;
}

/**
 * Calculate variance of array
 */
function variance(arr) {
    const m = mean(arr);
    return arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / arr.length;
}

/**
 * Calculate standard deviation
 */
function stdDev(arr) {
    return Math.sqrt(variance(arr));
}

/**
 * Normal PDF for plotting
 */
function normalPDF(x, mu, sigma) {
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
           Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
}

/**
 * Create histogram bins
 */
function createHistogram(data, numBins) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / numBins;

    const bins = new Array(numBins).fill(0);
    const binCenters = [];

    for (let i = 0; i < numBins; i++) {
        binCenters.push(min + (i + 0.5) * binWidth);
    }

    for (const value of data) {
        const binIndex = Math.min(
            Math.floor((value - min) / binWidth),
            numBins - 1
        );
        bins[binIndex]++;
    }

    // Normalize to get density
    const total = data.length;
    const density = bins.map(count => count / (total * binWidth));

    return { bins: density, centers: binCenters, binWidth };
}

// ============ Visualization Functions ============

/**
 * Draw histogram with optional theoretical curve
 */
function drawHistogram(canvas, data, theoretical = null, title = '') {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Create histogram
    const numBins = 30;
    const hist = createHistogram(data, numBins);

    // Find max for scaling
    const maxDensity = Math.max(...hist.bins);
    const maxY = theoretical ?
        Math.max(maxDensity, ...theoretical.values) * 1.1 :
        maxDensity * 1.1;

    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw histogram bars
    const barWidth = chartWidth / numBins;
    ctx.fillStyle = '#3b82f6';
    ctx.globalAlpha = 0.7;

    for (let i = 0; i < numBins; i++) {
        const barHeight = (hist.bins[i] / maxY) * chartHeight;
        const x = padding + i * barWidth;
        const y = height - padding - barHeight;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
    }

    // Draw theoretical curve if provided
    if (theoretical) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const xMin = Math.min(...theoretical.x);
        const xMax = Math.max(...theoretical.x);

        for (let i = 0; i < theoretical.x.length; i++) {
            const x = padding + ((theoretical.x[i] - xMin) / (xMax - xMin)) * chartWidth;
            const y = height - padding - (theoretical.values[i] / maxY) * chartHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    // Stats
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Mean: ${mean(data).toFixed(4)}`, padding + 5, padding + 15);
    ctx.fillText(`SD: ${stdDev(data).toFixed(4)}`, padding + 5, padding + 30);

    // Title
    if (title) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(title, width / 2, padding - 10);
    }
}

/**
 * Generate theoretical normal curve points
 */
function generateTheoreticalNormal(mu, sigma, numPoints = 200) {
    const x = [];
    const values = [];
    const range = 4 * sigma;

    for (let i = 0; i < numPoints; i++) {
        const xi = mu - range + (2 * range * i) / numPoints;
        x.push(xi);
        values.push(normalPDF(xi, mu, sigma));
    }

    return { x, values };
}

/**
 * Draw convergence plot showing std deviation vs n
 */
function drawConvergencePlot(canvas, results) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    const nValues = results.map(r => r.n);
    const stdMeans = results.map(r => r.stdSamplingMeans);
    const theoreticalMean = results[0].theoreticalMean;
    const theoreticalVariance = results[0].theoreticalVariance;
    const theoreticalStdDev = Math.sqrt(theoreticalVariance);

    // Theoretical: σ/√n
    const theoreticalStdMeans = nValues.map(n => theoreticalStdDev / Math.sqrt(n));

    // Find ranges
    const maxN = Math.max(...nValues);
    const minN = Math.min(...nValues);
    const maxStd = Math.max(...stdMeans, ...theoreticalStdMeans) * 1.1;

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sample Size (n)', width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Std Dev of Sampling Means', 0, 0);
    ctx.restore();

    // Use log scale for x-axis
    const logScale = true;

    function xPos(n) {
        if (logScale) {
            const logMin = Math.log(minN);
            const logMax = Math.log(maxN);
            return padding + ((Math.log(n) - logMin) / (logMax - logMin)) * chartWidth;
        } else {
            return padding + ((n - minN) / (maxN - minN)) * chartWidth;
        }
    }

    function yPos(std) {
        return height - padding - (std / maxStd) * chartHeight;
    }

    // Draw theoretical curve
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i < nValues.length; i++) {
        const x = xPos(nValues[i]);
        const y = yPos(theoreticalStdMeans[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw observed points
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < nValues.length; i++) {
        const x = xPos(nValues[i]);
        const y = yPos(stdMeans[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw points
    for (let i = 0; i < nValues.length; i++) {
        const x = xPos(nValues[i]);
        const y = yPos(stdMeans[i]);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Legend
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding + 10, padding + 10);
    ctx.lineTo(padding + 40, padding + 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#000';
    ctx.fillText('Theoretical σ/√n', padding + 45, padding + 14);

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(padding + 25, padding + 30, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillText('Observed', padding + 35, padding + 34);

    // X-axis tick labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    for (const n of nValues) {
        const x = xPos(n);
        ctx.fillText(n, x, height - padding + 20);
    }
}

// ============ UI Event Handlers ============

function runWelfordTest() {
    const msgElem = document.getElementById('welford-msg');
    msgElem.textContent = 'Running test...';
    msgElem.style.color = 'var(--color-text-muted)';

    setTimeout(() => {
        // Test data
        const testData = [2, 4, 4, 4, 5, 5, 7, 9];

        // Welford's method
        const welfordResult = welfordOnlineStats(testData);

        // Standard method (for verification)
        const standardMean = mean(testData);
        const standardVariance = variance(testData);
        const standardSS = testData.reduce((sum, x) => sum + (x - standardMean) ** 2, 0);

        // Display results
        document.getElementById('welford-test-data').textContent = testData.join(', ');
        document.getElementById('welford-mean').textContent = welfordResult.mean.toFixed(6);
        document.getElementById('welford-variance').textContent = welfordResult.variance.toFixed(6);
        document.getElementById('welford-ss').textContent = welfordResult.sumOfSquares.toFixed(6);

        document.getElementById('standard-mean').textContent = standardMean.toFixed(6);
        document.getElementById('standard-variance').textContent = standardVariance.toFixed(6);
        document.getElementById('standard-ss').textContent = standardSS.toFixed(6);

        const meanError = Math.abs(welfordResult.mean - standardMean);
        const varError = Math.abs(welfordResult.variance - standardVariance);
        const ssError = Math.abs(welfordResult.sumOfSquares - standardSS);

        document.getElementById('mean-error').textContent = meanError.toExponential(2);
        document.getElementById('var-error').textContent = varError.toExponential(2);
        document.getElementById('ss-error').textContent = ssError.toExponential(2);

        document.getElementById('welford-results').style.display = 'block';

        msgElem.textContent = '✓ Test complete';
        msgElem.style.color = '#10b981';
    }, 50);
}

function runSamplingAnalysis() {
    const m = parseInt(document.getElementById('sampling-m').value);
    const n = parseInt(document.getElementById('sampling-n').value);
    const distribution = document.getElementById('sampling-distribution').value;
    const msgElem = document.getElementById('sampling-msg');

    if (m < 10 || m > 10000 || n < 10 || n > 10000) {
        msgElem.textContent = '⚠️ m and n must be between 10 and 10000';
        msgElem.style.color = '#dc2626';
        return;
    }

    msgElem.textContent = 'Running simulation...';
    msgElem.style.color = 'var(--color-text-muted)';

    setTimeout(() => {
        // Get distribution parameters
        let params = {};
        if (distribution === 'normal') {
            params = { mu: 5.0, sigma: 1.5 };
        } else if (distribution === 'uniform') {
            params = { a: 2.0, b: 8.0 };
        } else if (distribution === 'triangular') {
            params = { a: 0, b: 10, c: 5 };
        }

        const results = analyzeSamplingStatistics(m, n, distribution, params);

        // Display results
        document.getElementById('theoretical-mean').textContent = results.theoreticalMean.toFixed(6);
        document.getElementById('theoretical-variance').textContent = results.theoreticalVariance.toFixed(6);
        document.getElementById('avg-sampling-mean').textContent = results.avgSamplingMean.toFixed(6);
        document.getElementById('avg-sampling-variance').textContent = results.avgSamplingVariance.toFixed(6);
        document.getElementById('std-sampling-means').textContent = results.stdSamplingMeans.toFixed(6);
        document.getElementById('std-sampling-variances').textContent = results.stdSamplingVariances.toFixed(6);

        const meanError = Math.abs(results.avgSamplingMean - results.theoreticalMean);
        const varError = Math.abs(results.avgSamplingVariance - results.theoreticalVariance);

        document.getElementById('mean-error-value').textContent = meanError.toFixed(6);
        document.getElementById('variance-error-value').textContent = varError.toFixed(6);

        document.getElementById('sampling-results').style.display = 'block';
        document.getElementById('sampling-charts').style.display = 'block';

        // Draw histograms
        const theoreticalMeanCurve = generateTheoreticalNormal(
            results.theoreticalMean,
            Math.sqrt(results.theoreticalVariance / n)
        );
        drawHistogram(
            document.getElementById('sampling-means-chart'),
            results.samplingMeans,
            theoreticalMeanCurve,
            'Distribution of Sampling Means'
        );

        drawHistogram(
            document.getElementById('sampling-variances-chart'),
            results.samplingVariances,
            null,
            'Distribution of Sampling Variances'
        );

        msgElem.textContent = '✓ Simulation complete';
        msgElem.style.color = '#10b981';
    }, 50);
}

function runConvergenceStudy() {
    const m = parseInt(document.getElementById('convergence-m').value);
    const nValuesStr = document.getElementById('convergence-n-values').value;
    const distribution = document.getElementById('convergence-distribution').value;
    const msgElem = document.getElementById('convergence-msg');

    const nValues = nValuesStr.split(',').map(s => parseInt(s.trim())).filter(n => n >= 10);

    if (nValues.length === 0) {
        msgElem.textContent = '⚠️ Please provide valid n values';
        msgElem.style.color = '#dc2626';
        return;
    }

    msgElem.textContent = 'Running convergence study...';
    msgElem.style.color = 'var(--color-text-muted)';

    setTimeout(() => {
        // Get distribution parameters
        let params = {};
        if (distribution === 'normal') {
            params = { mu: 5.0, sigma: 1.5 };
        } else if (distribution === 'uniform') {
            params = { a: 2.0, b: 8.0 };
        } else if (distribution === 'triangular') {
            params = { a: 0, b: 10, c: 5 };
        }

        const results = [];
        for (const n of nValues) {
            const result = analyzeSamplingStatistics(m, n, distribution, params);
            results.push(result);
        }

        document.getElementById('convergence-charts').style.display = 'block';

        // Draw convergence plot
        drawConvergencePlot(
            document.getElementById('convergence-plot'),
            results
        );

        msgElem.textContent = '✓ Convergence study complete';
        msgElem.style.color = '#10b981';
    }, 50);
}

// ============ Event Listeners ============

document.addEventListener('DOMContentLoaded', () => {
    const welfordBtn = document.getElementById('welford-test-btn');
    if (welfordBtn) {
        welfordBtn.addEventListener('click', runWelfordTest);
    }

    const samplingBtn = document.getElementById('sampling-run-btn');
    if (samplingBtn) {
        samplingBtn.addEventListener('click', runSamplingAnalysis);
    }

    const convergenceBtn = document.getElementById('convergence-run-btn');
    if (convergenceBtn) {
        convergenceBtn.addEventListener('click', runConvergenceStudy);
    }
});
