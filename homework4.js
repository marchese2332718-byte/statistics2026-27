// Homework 4: Stochastic Penetration Models
// Bernoulli and Rademacher processes, LLN and CLT demonstrations

// ============ Utility Functions ============

// Generate random Bernoulli variable (0 or 1)
function randomBernoulli(p) {
    return Math.random() < p ? 1 : 0;
}

// Generate random Rademacher variable (-1 or +1)
function randomRademacher() {
    return Math.random() < 0.5 ? -1 : 1;
}

// Calculate mean of array
function mean(arr) {
    return arr.reduce((sum, x) => sum + x, 0) / arr.length;
}

// Calculate variance of array
function variance(arr) {
    const m = mean(arr);
    return arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / arr.length;
}

// Calculate standard deviation
function stdDev(arr) {
    return Math.sqrt(variance(arr));
}

// Normal PDF for plotting
function normalPDF(x, mu, sigma) {
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
           Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
}

// Create histogram bins
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

// ============ Simulation Functions ============

// Simulate one trajectory: returns {total, avg, normalized, standardized}
function simulateBernoulliTrajectory(n, p) {
    let total = 0;
    for (let i = 0; i < n; i++) {
        total += randomBernoulli(p);
    }

    const avg = total / n;
    const normalized = total / Math.sqrt(n);
    const standardized = (total - n * p) / Math.sqrt(n * p * (1 - p));

    return { total, avg, normalized, standardized };
}

function simulateRademacherTrajectory(n) {
    let total = 0;
    for (let i = 0; i < n; i++) {
        total += randomRademacher();
    }

    const avg = total / n;
    const normalized = total / Math.sqrt(n);
    const standardized = normalized; // Since mean=0, var=1

    return { total, avg, normalized, standardized };
}

// Run multiple trajectories
function runBernoulliSimulation(n, p, numTrajectories) {
    const totals = [];
    const avgs = [];
    const normalized = [];
    const standardized = [];

    for (let i = 0; i < numTrajectories; i++) {
        const traj = simulateBernoulliTrajectory(n, p);
        totals.push(traj.total);
        avgs.push(traj.avg);
        normalized.push(traj.normalized);
        standardized.push(traj.standardized);
    }

    return { totals, avgs, normalized, standardized };
}

function runRademacherSimulation(n, numTrajectories) {
    const totals = [];
    const avgs = [];
    const normalized = [];
    const standardized = [];

    for (let i = 0; i < numTrajectories; i++) {
        const traj = simulateRademacherTrajectory(n);
        totals.push(traj.total);
        avgs.push(traj.avg);
        normalized.push(traj.normalized);
        standardized.push(traj.standardized);
    }

    return { totals, avgs, normalized, standardized };
}

// ============ Visualization Functions ============

function drawHistogram(canvas, data, theoretical = null) {
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

    // Labels
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    // X-axis labels
    const min = Math.min(...data);
    const max = Math.max(...data);
    ctx.fillText(min.toFixed(2), padding, height - padding + 20);
    ctx.fillText(max.toFixed(2), width - padding, height - padding + 20);
    ctx.fillText(((min + max) / 2).toFixed(2), width / 2, height - padding + 20);

    // Stats
    ctx.textAlign = 'left';
    ctx.fillText(`Mean: ${mean(data).toFixed(4)}`, padding + 5, padding + 15);
    ctx.fillText(`SD: ${stdDev(data).toFixed(4)}`, padding + 5, padding + 30);
}

function generateTheoreticalNormal(mu, sigma, numPoints = 200) {
    const x = [];
    const values = [];
    const range = 4 * sigma; // ±4σ

    for (let i = 0; i < numPoints; i++) {
        const xi = mu - range + (2 * range * i) / numPoints;
        x.push(xi);
        values.push(normalPDF(xi, mu, sigma));
    }

    return { x, values };
}

// ============ Bernoulli Simulation ============

function runBernoulliSim() {
    const n = parseInt(document.getElementById('bernoulli-n').value);
    const p = parseFloat(document.getElementById('bernoulli-p').value);
    const numTrajectories = parseInt(document.getElementById('bernoulli-trajectories').value);
    const msgElem = document.getElementById('bernoulli-msg');

    if (n < 10 || n > 10000) {
        msgElem.textContent = '⚠️ n must be between 10 and 10000';
        msgElem.style.color = '#dc2626';
        return;
    }

    if (p <= 0 || p >= 1) {
        msgElem.textContent = '⚠️ p must be between 0 and 1';
        msgElem.style.color = '#dc2626';
        return;
    }

    msgElem.textContent = 'Running simulation...';
    msgElem.style.color = 'var(--color-text-muted)';

    // Run simulation
    setTimeout(() => {
        const results = runBernoulliSimulation(n, p, numTrajectories);

        // Calculate theoretical values
        const expectedTotal = n * p;
        const expectedAvg = p;
        const varAvg = (p * (1 - p)) / n;

        // Display results
        document.getElementById('bernoulli-expected-total').textContent = expectedTotal.toFixed(2);
        document.getElementById('bernoulli-mean-total').textContent = mean(results.totals).toFixed(2);
        document.getElementById('bernoulli-expected-avg').textContent = expectedAvg.toFixed(4);
        document.getElementById('bernoulli-mean-avg').textContent = mean(results.avgs).toFixed(4);
        document.getElementById('bernoulli-var-avg').textContent = variance(results.avgs).toFixed(6);

        document.getElementById('bernoulli-results').style.display = 'block';
        document.getElementById('bernoulli-charts').style.display = 'block';

        // Draw charts
        const totalTheory = generateTheoreticalNormal(
            n * p,
            Math.sqrt(n * p * (1 - p))
        );
        drawHistogram(
            document.getElementById('bernoulli-total-chart'),
            results.totals,
            totalTheory
        );

        const avgTheory = generateTheoreticalNormal(p, Math.sqrt(p * (1 - p) / n));
        drawHistogram(
            document.getElementById('bernoulli-avg-chart'),
            results.avgs,
            avgTheory
        );

        const normTheory = generateTheoreticalNormal(
            p * Math.sqrt(n),
            Math.sqrt(p * (1 - p))
        );
        drawHistogram(
            document.getElementById('bernoulli-norm-chart'),
            results.normalized,
            normTheory
        );

        const stdTheory = generateTheoreticalNormal(0, 1);
        drawHistogram(
            document.getElementById('bernoulli-std-chart'),
            results.standardized,
            stdTheory
        );

        msgElem.textContent = '✓ Simulation complete';
        msgElem.style.color = '#10b981';
    }, 50);
}

// ============ Rademacher Simulation ============

function runRademacherSim() {
    const n = parseInt(document.getElementById('rademacher-n').value);
    const numTrajectories = parseInt(document.getElementById('rademacher-trajectories').value);
    const msgElem = document.getElementById('rademacher-msg');

    if (n < 10 || n > 10000) {
        msgElem.textContent = '⚠️ n must be between 10 and 10000';
        msgElem.style.color = '#dc2626';
        return;
    }

    msgElem.textContent = 'Running simulation...';
    msgElem.style.color = 'var(--color-text-muted)';

    setTimeout(() => {
        const results = runRademacherSimulation(n, numTrajectories);

        // Calculate theoretical values
        const expectedVarAvg = 1 / n;

        // Display results
        document.getElementById('rademacher-mean-total').textContent = mean(results.totals).toFixed(2);
        document.getElementById('rademacher-mean-avg').textContent = mean(results.avgs).toFixed(6);
        document.getElementById('rademacher-var-avg').textContent = variance(results.avgs).toFixed(6);
        document.getElementById('rademacher-expected-var').textContent = expectedVarAvg.toFixed(6);

        document.getElementById('rademacher-results').style.display = 'block';
        document.getElementById('rademacher-charts').style.display = 'block';

        // Draw charts
        const totalTheory = generateTheoreticalNormal(0, Math.sqrt(n));
        drawHistogram(
            document.getElementById('rademacher-total-chart'),
            results.totals,
            totalTheory
        );

        const avgTheory = generateTheoreticalNormal(0, Math.sqrt(1 / n));
        drawHistogram(
            document.getElementById('rademacher-avg-chart'),
            results.avgs,
            avgTheory
        );

        const normTheory = generateTheoreticalNormal(0, 1);
        drawHistogram(
            document.getElementById('rademacher-norm-chart'),
            results.normalized,
            normTheory
        );

        drawHistogram(
            document.getElementById('rademacher-comparison-chart'),
            results.normalized,
            normTheory
        );

        msgElem.textContent = '✓ Simulation complete';
        msgElem.style.color = '#10b981';
    }, 50);
}

// ============ Convergence Study ============

function runConvergenceStudy() {
    const model = document.getElementById('convergence-model').value;
    const p = parseFloat(document.getElementById('convergence-p').value);
    const nValuesStr = document.getElementById('convergence-n-values').value;
    const numTrajectories = parseInt(document.getElementById('convergence-trajectories').value);
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
        const variances = [];
        const allNormalized = [];

        for (const n of nValues) {
            let results;
            if (model === 'bernoulli') {
                results = runBernoulliSimulation(n, p, numTrajectories);
            } else {
                results = runRademacherSimulation(n, numTrajectories);
            }

            variances.push({
                n,
                variance: variance(results.avgs),
                theoretical: model === 'bernoulli' ? (p * (1 - p) / n) : (1 / n)
            });

            allNormalized.push({
                n,
                data: results.normalized
            });
        }

        document.getElementById('convergence-charts').style.display = 'block';

        // Draw variance chart
        drawVarianceConvergence(
            document.getElementById('convergence-variance-chart'),
            variances
        );

        // Draw overlaid distributions
        drawOverlaidDistributions(
            document.getElementById('convergence-dist-chart'),
            allNormalized
        );

        msgElem.textContent = '✓ Convergence study complete';
        msgElem.style.color = '#10b981';
    }, 50);
}

function drawVarianceConvergence(canvas, variances) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const padding = 50;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Get ranges
    const nValues = variances.map(v => v.n);
    const maxN = Math.max(...nValues);
    const maxVar = Math.max(...variances.map(v => Math.max(v.variance, v.theoretical)));

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
    ctx.fillText('n', width / 2, height - 10);
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Var(Sₙ/n)', 0, 0);
    ctx.restore();

    // Plot theoretical curve (1/n)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 100; i++) {
        const n = (maxN / 100) * (i + 1);
        const x = padding + (n / maxN) * chartWidth;
        const y = height - padding - (variances[0].theoretical * variances[0].n / n) / maxVar * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Plot simulated points
    ctx.fillStyle = '#3b82f6';
    for (const v of variances) {
        const x = padding + (v.n / maxN) * chartWidth;
        const y = height - padding - (v.variance / maxVar) * chartHeight;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Legend
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(width - padding - 100, padding + 10, 20, 3);
    ctx.fillStyle = '#000';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Theoretical', width - padding - 75, padding + 15);

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(width - padding - 90, padding + 30, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillText('Simulated', width - padding - 75, padding + 35);
}

function drawOverlaidDistributions(canvas, allNormalized) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Find global range
    let globalMin = Infinity;
    let globalMax = -Infinity;
    for (const item of allNormalized) {
        globalMin = Math.min(globalMin, ...item.data);
        globalMax = Math.max(globalMax, ...item.data);
    }

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Colors for different n
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    // Draw histograms with transparency
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < allNormalized.length; i++) {
        const item = allNormalized[i];
        const hist = createHistogram(item.data, 20);
        const barWidth = chartWidth / 20;
        ctx.fillStyle = colors[i % colors.length];

        const maxDensity = Math.max(...hist.bins);

        for (let j = 0; j < hist.bins.length; j++) {
            const barHeight = (hist.bins[j] / (maxDensity * 2)) * chartHeight;
            const x = padding + j * barWidth;
            const y = height - padding - barHeight;
            ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
    }

    // Legend
    ctx.globalAlpha = 1;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    for (let i = 0; i < allNormalized.length; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(width - padding - 60, padding + 10 + i * 15, 15, 10);
        ctx.fillStyle = '#000';
        ctx.fillText(`n=${allNormalized[i].n}`, width - padding - 40, padding + 18 + i * 15);
    }
}

// ============ Event Listeners ============

document.addEventListener('DOMContentLoaded', () => {
    // Bernoulli
    const bernoulliBtn = document.getElementById('bernoulli-simulate-btn');
    if (bernoulliBtn) {
        bernoulliBtn.addEventListener('click', runBernoulliSim);
    }

    // Rademacher
    const rademacherBtn = document.getElementById('rademacher-simulate-btn');
    if (rademacherBtn) {
        rademacherBtn.addEventListener('click', runRademacherSim);
    }

    // Convergence
    const convergenceBtn = document.getElementById('convergence-run-btn');
    if (convergenceBtn) {
        convergenceBtn.addEventListener('click', runConvergenceStudy);
    }

    // Model selector: show/hide p input
    const modelSelect = document.getElementById('convergence-model');
    const pInput = document.getElementById('convergence-p');
    if (modelSelect && pInput) {
        modelSelect.addEventListener('change', (e) => {
            pInput.parentElement.style.display =
                e.target.value === 'bernoulli' ? 'block' : 'none';
        });
    }
});
