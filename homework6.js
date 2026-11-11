// Homework 6: Riemann and Lebesgue Integration & Normal CDF Computation
// Exercise 1: Numerical integration using Riemann and Lebesgue approaches
// Exercise 2: Normal CDF computation using various numerical methods

// ============ Exercise 1: Riemann and Lebesgue Integration ============

/**
 * Function definitions and their exact integrals
 */
const functions = {
    sin: {
        f: x => Math.sin(x),
        domain: [0, Math.PI],
        exact: 2.0,
        name: 'sin(x)',
        range: [0, 1]
    },
    x2: {
        f: x => x * x,
        domain: [0, 1],
        exact: 1/3,
        name: 'x²',
        range: [0, 1]
    },
    sinc: {
        f: x => x === 0 ? 1 : Math.sin(x) / x,
        domain: [0, Math.PI],
        exact: 1.851937051982466, // Si(π)
        name: 'sin(x)/x',
        range: [0, 1]
    },
    step: {
        f: x => x < 0.5 ? 1 : 3,
        domain: [0, 1],
        exact: 2.0,
        name: 'step function',
        range: [1, 3]
    },
    indicator: {
        f: x => x < 0.5 ? 1 : 0,
        domain: [0, 1],
        exact: 0.5,
        name: 'indicator function',
        range: [0, 1]
    },
    abs: {
        f: x => Math.abs(x - 0.5),
        domain: [0, 1],
        exact: 0.25,
        name: '|x - 0.5|',
        range: [0, 0.5]
    },
    invsqrt: {
        f: x => x === 0 ? 0 : 1 / Math.sqrt(x),
        domain: [0.001, 1], // Avoid singularity at 0
        exact: 2.0 - 2*Math.sqrt(0.001), // Adjusted for domain starting at 0.001
        name: '1/√x',
        range: [1, 31.62]
    },
    dirichlet: {
        f: x => {
            // Approximate: check if x is "close" to a simple rational
            // This is a numerical approximation of the Dirichlet function
            const tolerance = 1e-9;
            for (let q = 1; q <= 1000; q++) {
                for (let p = 0; p <= q; p++) {
                    if (Math.abs(x - p/q) < tolerance) return 1;
                }
            }
            return 0;
        },
        domain: [0, 1],
        exact: 0, // Lebesgue integral is 0
        name: 'Dirichlet function',
        range: [0, 1]
    },
    thomae: {
        f: x => {
            // Thomae's function: 1/q if x = p/q in lowest terms, 0 otherwise
            const tolerance = 1e-9;
            for (let q = 1; q <= 1000; q++) {
                for (let p = 0; p <= q; p++) {
                    if (gcd(p, q) === 1 && Math.abs(x - p/q) < tolerance) {
                        return 1/q;
                    }
                }
            }
            return 0;
        },
        domain: [0, 1],
        exact: 0, // Riemann integral is 0
        name: "Thomae's function",
        range: [0, 1]
    }
};

/**
 * Greatest common divisor (for Thomae's function)
 */
function gcd(a, b) {
    while (b !== 0) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
}

/**
 * Riemann integration using midpoint rule
 * Partition domain [a,b] into n subintervals
 *
 * @param {function} f - Function to integrate
 * @param {number} a - Lower bound
 * @param {number} b - Upper bound
 * @param {number} n - Number of partitions
 * @returns {number} Approximate integral
 */
function riemannIntegral(f, a, b, n) {
    const dx = (b - a) / n;
    let sum = 0;

    for (let i = 0; i < n; i++) {
        const x_mid = a + (i + 0.5) * dx; // Midpoint of subinterval
        sum += f(x_mid) * dx;
    }

    return sum;
}

/**
 * Lebesgue integration approach
 * Partition range [ymin, ymax] into m levels
 * For each level, measure the domain where f falls in that range
 *
 * @param {function} f - Function to integrate
 * @param {number} a - Lower domain bound
 * @param {number} b - Upper domain bound
 * @param {number} n - Domain sampling points
 * @param {number} m - Range partitions
 * @returns {number} Approximate integral
 */
function lebesgueIntegral(f, a, b, n, m = 100) {
    // Sample function to determine range
    const samples = [];
    const dx = (b - a) / n;

    for (let i = 0; i < n; i++) {
        const x = a + (i + 0.5) * dx;
        samples.push(f(x));
    }

    const ymin = Math.min(...samples);
    const ymax = Math.max(...samples);

    // Partition range
    const dy = (ymax - ymin) / m;
    let integral = 0;

    // For each range level, measure preimage
    for (let j = 0; j < m; j++) {
        const y_lower = ymin + j * dy;
        const y_upper = ymin + (j + 1) * dy;
        const y_mid = (y_lower + y_upper) / 2;

        // Measure of preimage: length of domain where f ∈ [y_lower, y_upper)
        let measure = 0;
        for (let i = 0; i < n; i++) {
            const x = a + (i + 0.5) * dx;
            const fx = f(x);
            if (fx >= y_lower && fx < y_upper) {
                measure += dx;
            }
        }

        integral += y_mid * measure;
    }

    return integral;
}

/**
 * Convergence study: compute integrals for increasing n values
 *
 * @param {string} funcKey - Function key from functions object
 * @param {number[]} nValues - Array of partition sizes to test
 * @returns {Object} Results for both methods
 */
function convergenceStudy(funcKey, nValues) {
    const func = functions[funcKey];
    const [a, b] = func.domain;
    const exact = func.exact;

    const riemannErrors = [];
    const lebesgueErrors = [];

    for (const n of nValues) {
        const riemann = riemannIntegral(func.f, a, b, n);
        const lebesgue = lebesgueIntegral(func.f, a, b, n);

        riemannErrors.push(Math.abs(riemann - exact));
        lebesgueErrors.push(Math.abs(lebesgue - exact));
    }

    return {
        nValues,
        riemannErrors,
        lebesgueErrors,
        exact,
        funcName: func.name
    };
}

// ============ Exercise 2: Normal CDF Computation ============

/**
 * Standard normal PDF
 * φ(x) = (1/√(2π)) exp(-x²/2)
 */
function normalPDF(x) {
    return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
}

/**
 * Normal CDF using Simpson's rule for numerical integration
 * Φ(x) = ∫_{-∞}^x φ(t) dt
 *
 * @param {number} x - Point to evaluate CDF
 * @param {number} n - Number of intervals (must be even)
 * @returns {number} Φ(x)
 */
function normalCDF_Simpson(x, n = 100) {
    // Integrate from -8 to x (beyond -8, contribution is negligible)
    const a = -8;
    const b = x;

    // Ensure n is even
    n = Math.floor(n / 2) * 2;
    const h = (b - a) / n;

    let sum = normalPDF(a) + normalPDF(b);

    for (let i = 1; i < n; i++) {
        const t = a + i * h;
        sum += normalPDF(t) * (i % 2 === 0 ? 2 : 4);
    }

    return sum * h / 3;
}

/**
 * Normal CDF using trapezoidal rule
 *
 * @param {number} x - Point to evaluate CDF
 * @param {number} n - Number of intervals
 * @returns {number} Φ(x)
 */
function normalCDF_Trapezoidal(x, n = 100) {
    const a = -8;
    const b = x;
    const h = (b - a) / n;

    let sum = (normalPDF(a) + normalPDF(b)) / 2;

    for (let i = 1; i < n; i++) {
        const t = a + i * h;
        sum += normalPDF(t);
    }

    return sum * h;
}

/**
 * Error function using Taylor series expansion
 * erf(x) = (2/√π) Σ_{n=0}^∞ (-1)^n x^{2n+1} / (n! (2n+1))
 *
 * @param {number} x - Point to evaluate
 * @param {number} terms - Number of terms in series
 * @returns {number} erf(x)
 */
function erf_Series(x, terms = 50) {
    let sum = 0;
    let factorial = 1;

    for (let n = 0; n < terms; n++) {
        if (n > 0) factorial *= n;

        const numerator = Math.pow(-1, n) * Math.pow(x, 2*n + 1);
        const denominator = factorial * (2*n + 1);

        sum += numerator / denominator;
    }

    return (2 / Math.sqrt(Math.PI)) * sum;
}

/**
 * Normal CDF using error function relationship
 * Φ(x) = (1/2)[1 + erf(x/√2)]
 *
 * @param {number} x - Point to evaluate CDF
 * @param {number} terms - Number of series terms
 * @returns {number} Φ(x)
 */
function normalCDF_Series(x, terms = 50) {
    return 0.5 * (1 + erf_Series(x / Math.sqrt(2), terms));
}

/**
 * Normal CDF using rational approximation (Abramowitz & Stegun)
 * Very fast and accurate
 *
 * @param {number} x - Point to evaluate CDF
 * @returns {number} Φ(x)
 */
function normalCDF_Rational(x) {
    // Constants for approximation
    const p = 0.2316419;
    const b1 = 0.319381530;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;

    if (x >= 0) {
        const t = 1 / (1 + p * x);
        const poly = b1*t + b2*t*t + b3*Math.pow(t,3) + b4*Math.pow(t,4) + b5*Math.pow(t,5);
        return 1 - normalPDF(x) * poly;
    } else {
        return 1 - normalCDF_Rational(-x);
    }
}

/**
 * Reference implementation using built-in erf if available
 * Otherwise use rational approximation
 */
function normalCDF_Reference(x) {
    // Use rational approximation as reference (very accurate)
    return normalCDF_Rational(x);
}

/**
 * Compare all CDF methods at given x values
 *
 * @param {number[]} xValues - Points to evaluate
 * @param {number} n - Precision parameter
 * @returns {Object} Comparison results
 */
function compareCDFMethods(xValues, n = 100) {
    const results = {
        xValues,
        reference: [],
        simpson: [],
        trapezoidal: [],
        series: [],
        rational: [],
        simpsonErrors: [],
        trapezoidalErrors: [],
        seriesErrors: [],
        rationalErrors: [],
        simpsonTimes: [],
        trapezoidalTimes: [],
        seriesTimes: [],
        rationalTimes: []
    };

    for (const x of xValues) {
        const ref = normalCDF_Reference(x);
        results.reference.push(ref);

        // Simpson
        let t0 = performance.now();
        const simpson = normalCDF_Simpson(x, n);
        results.simpsonTimes.push(performance.now() - t0);
        results.simpson.push(simpson);
        results.simpsonErrors.push(Math.abs(simpson - ref));

        // Trapezoidal
        t0 = performance.now();
        const trapezoidal = normalCDF_Trapezoidal(x, n);
        results.trapezoidalTimes.push(performance.now() - t0);
        results.trapezoidal.push(trapezoidal);
        results.trapezoidalErrors.push(Math.abs(trapezoidal - ref));

        // Series
        t0 = performance.now();
        const series = normalCDF_Series(x, n);
        results.seriesTimes.push(performance.now() - t0);
        results.series.push(series);
        results.seriesErrors.push(Math.abs(series - ref));

        // Rational
        t0 = performance.now();
        const rational = normalCDF_Rational(x);
        results.rationalTimes.push(performance.now() - t0);
        results.rational.push(rational);
        results.rationalErrors.push(Math.abs(rational - ref));
    }

    return results;
}

// ============ UI Event Handlers ============

document.addEventListener('DOMContentLoaded', () => {

    // Exercise 1: Single integration computation
    document.getElementById('int-compute-btn')?.addEventListener('click', () => {
        const funcKey = document.getElementById('int-function').value;
        const n = parseInt(document.getElementById('int-n').value);
        const msgEl = document.getElementById('int-msg');
        const resultsEl = document.getElementById('int-results');

        msgEl.textContent = 'Computing...';
        resultsEl.style.display = 'none';

        setTimeout(() => {
            const func = functions[funcKey];
            const [a, b] = func.domain;

            // Riemann integration
            const t0_riemann = performance.now();
            const riemann = riemannIntegral(func.f, a, b, n);
            const time_riemann = performance.now() - t0_riemann;

            // Lebesgue integration
            const t0_lebesgue = performance.now();
            const lebesgue = lebesgueIntegral(func.f, a, b, n);
            const time_lebesgue = performance.now() - t0_lebesgue;

            const exact = func.exact;
            const riemann_err = Math.abs(riemann - exact);
            const lebesgue_err = Math.abs(lebesgue - exact);

            // Display results
            document.getElementById('int-exact').textContent = exact.toFixed(8);
            document.getElementById('int-riemann').textContent = riemann.toFixed(8);
            document.getElementById('int-riemann-err').textContent = riemann_err.toExponential(4);
            document.getElementById('int-riemann-time').textContent = time_riemann.toFixed(3);
            document.getElementById('int-lebesgue').textContent = lebesgue.toFixed(8);
            document.getElementById('int-lebesgue-err').textContent = lebesgue_err.toExponential(4);
            document.getElementById('int-lebesgue-time').textContent = time_lebesgue.toFixed(3);

            const accuracyRatio = riemann_err === 0 ? 'Perfect' :
                                  (lebesgue_err / riemann_err).toFixed(2) + '× (Lebesgue/Riemann)';
            const perfRatio = (time_riemann / time_lebesgue).toFixed(2) + '× faster';

            document.getElementById('int-accuracy').textContent = accuracyRatio;
            document.getElementById('int-performance').textContent = perfRatio;

            resultsEl.style.display = 'block';
            msgEl.textContent = `✓ Integration complete for ${func.name}`;

            // Show charts
            plotFunction(funcKey, n);
        }, 10);
    });

    // Convergence study
    document.getElementById('conv-run-btn')?.addEventListener('click', () => {
        const funcKey = document.getElementById('conv-function').value;
        const nValuesStr = document.getElementById('conv-n-values').value;
        const msgEl = document.getElementById('conv-msg');
        const chartsEl = document.getElementById('conv-charts');

        msgEl.textContent = 'Running convergence study...';
        chartsEl.style.display = 'none';

        setTimeout(() => {
            const nValues = nValuesStr.split(',').map(s => parseInt(s.trim()));
            const results = convergenceStudy(funcKey, nValues);

            plotConvergence(results);

            chartsEl.style.display = 'block';
            msgEl.textContent = `✓ Convergence study complete for ${results.funcName}`;
        }, 10);
    });

    // Exercise 2: Single CDF computation
    document.getElementById('cdf-compute-btn')?.addEventListener('click', () => {
        const x = parseFloat(document.getElementById('cdf-x').value);
        const method = document.getElementById('cdf-method').value;
        const n = parseInt(document.getElementById('cdf-n').value);
        const msgEl = document.getElementById('cdf-msg');
        const resultsEl = document.getElementById('cdf-results');

        msgEl.textContent = 'Computing...';
        resultsEl.style.display = 'none';

        setTimeout(() => {
            const reference = normalCDF_Reference(x);

            let computed, time;
            const t0 = performance.now();

            switch (method) {
                case 'simpson':
                    computed = normalCDF_Simpson(x, n);
                    break;
                case 'trapezoidal':
                    computed = normalCDF_Trapezoidal(x, n);
                    break;
                case 'series':
                    computed = normalCDF_Series(x, n);
                    break;
                case 'rational':
                    computed = normalCDF_Rational(x);
                    break;
            }

            time = performance.now() - t0;
            const error = Math.abs(computed - reference);

            document.getElementById('cdf-computed').textContent = computed.toFixed(10);
            document.getElementById('cdf-reference').textContent = reference.toFixed(10);
            document.getElementById('cdf-error').textContent = error.toExponential(6);
            document.getElementById('cdf-time').textContent = time.toFixed(4);

            resultsEl.style.display = 'block';
            msgEl.textContent = `✓ Φ(${x}) computed using ${method} method`;
        }, 10);
    });

    // CDF methods comparison
    document.getElementById('cdf-comp-btn')?.addEventListener('click', () => {
        const rangeStr = document.getElementById('cdf-comp-range').value;
        const n = parseInt(document.getElementById('cdf-comp-n').value);
        const msgEl = document.getElementById('cdf-comp-msg');
        const chartsEl = document.getElementById('cdf-comp-charts');

        msgEl.textContent = 'Comparing methods...';
        chartsEl.style.display = 'none';

        setTimeout(() => {
            const xValues = rangeStr.split(',').map(s => parseFloat(s.trim()));
            const results = compareCDFMethods(xValues, n);

            plotCDFComparison(results);

            chartsEl.style.display = 'block';
            msgEl.textContent = '✓ Method comparison complete';
        }, 10);
    });
});

// ============ Plotting Functions ============

function plotFunction(funcKey, n) {
    const canvas = document.getElementById('function-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const func = functions[funcKey];
    const [a, b] = func.domain;

    // Sample function
    const nPlot = 500;
    const dx = (b - a) / nPlot;
    const points = [];
    let ymin = Infinity, ymax = -Infinity;

    for (let i = 0; i <= nPlot; i++) {
        const x = a + i * dx;
        const y = func.f(x);
        points.push([x, y]);
        if (isFinite(y)) {
            ymin = Math.min(ymin, y);
            ymax = Math.max(ymax, y);
        }
    }

    // Add margin
    const margin = (ymax - ymin) * 0.1;
    ymin -= margin;
    ymax += margin;

    // Transform coordinates
    const toCanvasX = x => ((x - a) / (b - a)) * (width - 60) + 30;
    const toCanvasY = y => height - 30 - ((y - ymin) / (ymax - ymin)) * (height - 60);

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, toCanvasY(0));
    ctx.lineTo(width - 30, toCanvasY(0));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toCanvasX(a), 30);
    ctx.lineTo(toCanvasX(a), height - 30);
    ctx.stroke();

    // Draw function
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
        const [x, y] = points[i];
        if (!isFinite(y)) continue;
        const cx = toCanvasX(x);
        const cy = toCanvasY(y);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Draw partition lines
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    const partDx = (b - a) / Math.min(n, 20); // Show max 20 partitions
    for (let i = 0; i <= Math.min(n, 20); i++) {
        const x = a + i * partDx;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x), 30);
        ctx.lineTo(toCanvasX(x), height - 30);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Labels
    ctx.fillStyle = '#000';
    ctx.font = '12px monospace';
    ctx.fillText(func.name, 40, 50);
}

function plotConvergence(results) {
    const canvas = document.getElementById('conv-plot');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const { nValues, riemannErrors, lebesgueErrors } = results;

    // Log-log plot
    const logN = nValues.map(n => Math.log10(n));
    const logRiemann = riemannErrors.map(e => Math.log10(Math.max(e, 1e-15)));
    const logLebesgue = lebesgueErrors.map(e => Math.log10(Math.max(e, 1e-15)));

    const xmin = Math.min(...logN);
    const xmax = Math.max(...logN);
    const ymin = Math.min(...logRiemann, ...logLebesgue);
    const ymax = Math.max(...logRiemann, ...logLebesgue);

    const toCanvasX = x => ((x - xmin) / (xmax - xmin)) * (width - 100) + 60;
    const toCanvasY = y => height - 60 - ((y - ymin) / (ymax - ymin)) * (height - 100);

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 40);
    ctx.lineTo(60, height - 60);
    ctx.lineTo(width - 40, height - 60);
    ctx.stroke();

    // Draw grid
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = ymin + (ymax - ymin) * i / 5;
        const cy = toCanvasY(y);
        ctx.beginPath();
        ctx.moveTo(60, cy);
        ctx.lineTo(width - 40, cy);
        ctx.stroke();

        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText('10^' + y.toFixed(1), 5, cy + 3);
    }

    // Plot Riemann errors
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < logN.length; i++) {
        const cx = toCanvasX(logN[i]);
        const cy = toCanvasY(logRiemann[i]);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Plot Lebesgue errors
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < logN.length; i++) {
        const cx = toCanvasX(logN[i]);
        const cy = toCanvasY(logLebesgue[i]);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Legend
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(width - 150, 50, 20, 3);
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.fillText('Riemann', width - 125, 55);

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(width - 150, 70, 20, 3);
    ctx.fillStyle = '#000';
    ctx.fillText('Lebesgue', width - 125, 75);

    // Axis labels
    ctx.fillStyle = '#000';
    ctx.font = '14px sans-serif';
    ctx.fillText('log₁₀(n)', width / 2 - 30, height - 20);
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('log₁₀(error)', -40, 0);
    ctx.restore();
}

function plotCDFComparison(results) {
    // Plot accuracy comparison
    const canvas1 = document.getElementById('cdf-accuracy-chart');
    if (canvas1) {
        const ctx = canvas1.getContext('2d');
        const width = canvas1.width;
        const height = canvas1.height;

        ctx.clearRect(0, 0, width, height);

        const { xValues, simpsonErrors, trapezoidalErrors, seriesErrors, rationalErrors } = results;

        const ymax = Math.max(...simpsonErrors, ...trapezoidalErrors, ...seriesErrors, ...rationalErrors);

        const barWidth = (width - 100) / (xValues.length * 4 + xValues.length);
        const spacing = barWidth;

        const toCanvasY = y => height - 60 - (y / ymax) * (height - 100);

        // Draw axes
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, 40);
        ctx.lineTo(60, height - 60);
        ctx.lineTo(width - 40, height - 60);
        ctx.stroke();

        // Draw bars
        for (let i = 0; i < xValues.length; i++) {
            const x0 = 60 + i * (4 * barWidth + spacing);

            ctx.fillStyle = '#2563eb';
            ctx.fillRect(x0, toCanvasY(simpsonErrors[i]), barWidth, height - 60 - toCanvasY(simpsonErrors[i]));

            ctx.fillStyle = '#7c3aed';
            ctx.fillRect(x0 + barWidth, toCanvasY(trapezoidalErrors[i]), barWidth, height - 60 - toCanvasY(trapezoidalErrors[i]));

            ctx.fillStyle = '#db2777';
            ctx.fillRect(x0 + 2*barWidth, toCanvasY(seriesErrors[i]), barWidth, height - 60 - toCanvasY(seriesErrors[i]));

            ctx.fillStyle = '#059669';
            ctx.fillRect(x0 + 3*barWidth, toCanvasY(rationalErrors[i]), barWidth, height - 60 - toCanvasY(rationalErrors[i]));

            // x label
            ctx.fillStyle = '#000';
            ctx.font = '10px sans-serif';
            ctx.fillText(xValues[i].toString(), x0 + 1.5*barWidth, height - 45);
        }

        // Legend
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(width - 150, 50, 15, 10);
        ctx.fillStyle = '#000';
        ctx.font = '11px sans-serif';
        ctx.fillText('Simpson', width - 130, 58);

        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(width - 150, 65, 15, 10);
        ctx.fillStyle = '#000';
        ctx.fillText('Trapezoidal', width - 130, 73);

        ctx.fillStyle = '#db2777';
        ctx.fillRect(width - 150, 80, 15, 10);
        ctx.fillStyle = '#000';
        ctx.fillText('Series', width - 130, 88);

        ctx.fillStyle = '#059669';
        ctx.fillRect(width - 150, 95, 15, 10);
        ctx.fillStyle = '#000';
        ctx.fillText('Rational', width - 130, 103);
    }

    // Plot efficiency comparison (time vs accuracy)
    const canvas2 = document.getElementById('cdf-efficiency-chart');
    if (canvas2) {
        const ctx = canvas2.getContext('2d');
        const width = canvas2.width;
        const height = canvas2.height;

        ctx.clearRect(0, 0, width, height);

        const { simpsonErrors, trapezoidalErrors, seriesErrors, rationalErrors,
                simpsonTimes, trapezoidalTimes, seriesTimes, rationalTimes } = results;

        // Average errors and times
        const avgSimpsonErr = simpsonErrors.reduce((a,b) => a+b, 0) / simpsonErrors.length;
        const avgTrapErr = trapezoidalErrors.reduce((a,b) => a+b, 0) / trapezoidalErrors.length;
        const avgSeriesErr = seriesErrors.reduce((a,b) => a+b, 0) / seriesErrors.length;
        const avgRatErr = rationalErrors.reduce((a,b) => a+b, 0) / rationalErrors.length;

        const avgSimpsonTime = simpsonTimes.reduce((a,b) => a+b, 0) / simpsonTimes.length;
        const avgTrapTime = trapezoidalTimes.reduce((a,b) => a+b, 0) / trapezoidalTimes.length;
        const avgSeriesTime = seriesTimes.reduce((a,b) => a+b, 0) / seriesTimes.length;
        const avgRatTime = rationalTimes.reduce((a,b) => a+b, 0) / rationalTimes.length;

        const points = [
            { x: avgSimpsonTime, y: avgSimpsonErr, label: 'Simpson', color: '#2563eb' },
            { x: avgTrapTime, y: avgTrapErr, label: 'Trapezoidal', color: '#7c3aed' },
            { x: avgSeriesTime, y: avgSeriesErr, label: 'Series', color: '#db2777' },
            { x: avgRatTime, y: avgRatErr, label: 'Rational', color: '#059669' }
        ];

        const xmax = Math.max(...points.map(p => p.x));
        const ymax = Math.max(...points.map(p => p.y));

        const toCanvasX = x => 60 + (x / xmax) * (width - 120);
        const toCanvasY = y => height - 60 - (y / ymax) * (height - 100);

        // Draw axes
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, 40);
        ctx.lineTo(60, height - 60);
        ctx.lineTo(width - 40, height - 60);
        ctx.stroke();

        // Draw points
        for (const point of points) {
            ctx.fillStyle = point.color;
            ctx.beginPath();
            ctx.arc(toCanvasX(point.x), toCanvasY(point.y), 6, 0, 2*Math.PI);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.font = '11px sans-serif';
            ctx.fillText(point.label, toCanvasX(point.x) + 10, toCanvasY(point.y) + 4);
        }

        // Axis labels
        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        ctx.fillText('Time (ms)', width / 2 - 30, height - 20);
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Average Error', -40, 0);
        ctx.restore();
    }
}
