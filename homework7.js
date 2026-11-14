// Homework 7: Statistical Independence
// Analyzing statistical independence using contingency tables, chi-square tests, and independence theory

// ============ Contingency Table Construction ============

/**
 * Construct a contingency table from bivariate data
 *
 * @param {Array<{x: any, y: any}>} data - Bivariate dataset
 * @returns {Object} Contingency table with frequencies and categories
 */
function constructContingencyTable(data) {
    // Extract unique categories for X and Y
    const xCategories = [...new Set(data.map(d => d.x))].sort();
    const yCategories = [...new Set(data.map(d => d.y))].sort();

    // Initialize contingency table
    const observed = {};
    xCategories.forEach(x => {
        observed[x] = {};
        yCategories.forEach(y => {
            observed[x][y] = 0;
        });
    });

    // Count frequencies
    data.forEach(({x, y}) => {
        observed[x][y]++;
    });

    return {
        observed,
        xCategories,
        yCategories,
        n: data.length
    };
}

/**
 * Calculate marginal frequencies from contingency table
 *
 * @param {Object} contingencyTable - Result from constructContingencyTable
 * @returns {Object} Marginal frequencies and probabilities
 */
function calculateMarginals(contingencyTable) {
    const { observed, xCategories, yCategories, n } = contingencyTable;

    // Row marginals (X marginals)
    const xMarginals = {};
    const xProbabilities = {};
    xCategories.forEach(x => {
        const sum = yCategories.reduce((acc, y) => acc + observed[x][y], 0);
        xMarginals[x] = sum;
        xProbabilities[x] = sum / n;
    });

    // Column marginals (Y marginals)
    const yMarginals = {};
    const yProbabilities = {};
    yCategories.forEach(y => {
        const sum = xCategories.reduce((acc, x) => acc + observed[x][y], 0);
        yMarginals[y] = sum;
        yProbabilities[y] = sum / n;
    });

    return {
        xMarginals,
        yMarginals,
        xProbabilities,
        yProbabilities
    };
}

/**
 * Calculate conditional probabilities P(Y|X) and P(X|Y)
 *
 * @param {Object} contingencyTable - Result from constructContingencyTable
 * @param {Object} marginals - Result from calculateMarginals
 * @returns {Object} Conditional probability tables
 */
function calculateConditionals(contingencyTable, marginals) {
    const { observed, xCategories, yCategories } = contingencyTable;
    const { xMarginals, yMarginals } = marginals;

    // P(Y | X)
    const pYgivenX = {};
    xCategories.forEach(x => {
        pYgivenX[x] = {};
        yCategories.forEach(y => {
            pYgivenX[x][y] = xMarginals[x] > 0 ? observed[x][y] / xMarginals[x] : 0;
        });
    });

    // P(X | Y)
    const pXgivenY = {};
    yCategories.forEach(y => {
        pXgivenY[y] = {};
        xCategories.forEach(x => {
            pXgivenY[y][x] = yMarginals[y] > 0 ? observed[x][y] / yMarginals[y] : 0;
        });
    });

    return {
        pYgivenX,
        pXgivenY
    };
}

// ============ Expected Frequencies Under Independence ============

/**
 * Calculate expected frequencies assuming independence
 * Under independence: E[n_ij] = n * P(X=i) * P(Y=j) = (row_total * col_total) / n
 *
 * @param {Object} contingencyTable - Result from constructContingencyTable
 * @param {Object} marginals - Result from calculateMarginals
 * @returns {Object} Expected frequencies under independence
 */
function calculateExpectedFrequencies(contingencyTable, marginals) {
    const { xCategories, yCategories, n } = contingencyTable;
    const { xMarginals, yMarginals } = marginals;

    const expected = {};
    xCategories.forEach(x => {
        expected[x] = {};
        yCategories.forEach(y => {
            expected[x][y] = (xMarginals[x] * yMarginals[y]) / n;
        });
    });

    return expected;
}

// ============ Chi-Square Test for Independence ============

/**
 * Calculate chi-square statistic and p-value
 * χ² = Σ[(O - E)² / E] where O = observed, E = expected
 *
 * @param {Object} contingencyTable - Result from constructContingencyTable
 * @param {Object} expected - Expected frequencies from calculateExpectedFrequencies
 * @returns {Object} Chi-square statistic, degrees of freedom, and p-value
 */
function chiSquareTest(contingencyTable, expected) {
    const { observed, xCategories, yCategories } = contingencyTable;

    let chiSquare = 0;
    xCategories.forEach(x => {
        yCategories.forEach(y => {
            const O = observed[x][y];
            const E = expected[x][y];
            if (E > 0) {
                chiSquare += Math.pow(O - E, 2) / E;
            }
        });
    });

    // Degrees of freedom = (rows - 1) * (cols - 1)
    const df = (xCategories.length - 1) * (yCategories.length - 1);

    // Calculate p-value using chi-square distribution
    const pValue = 1 - chiSquareCDF(chiSquare, df);

    return {
        chiSquare,
        degreesOfFreedom: df,
        pValue,
        significant: pValue < 0.05
    };
}

/**
 * Chi-square cumulative distribution function
 * Approximation using incomplete gamma function
 *
 * @param {number} x - Chi-square statistic
 * @param {number} k - Degrees of freedom
 * @returns {number} CDF value
 */
function chiSquareCDF(x, k) {
    if (x <= 0) return 0;
    if (k === 1) {
        // Special case: χ²(1) = N(0,1)²
        return 2 * normalCDF(Math.sqrt(x)) - 1;
    }

    // Use regularized incomplete gamma function
    // P(k/2, x/2) = γ(k/2, x/2) / Γ(k/2)
    return lowerIncompleteGamma(k/2, x/2) / gamma(k/2);
}

/**
 * Normal CDF (from homework 6)
 */
function normalCDF(x) {
    // Rational approximation (Abramowitz & Stegun)
    const p = 0.2316419;
    const b1 = 0.319381530;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;

    if (x >= 0) {
        const t = 1 / (1 + p * x);
        const poly = b1*t + b2*t*t + b3*Math.pow(t,3) + b4*Math.pow(t,4) + b5*Math.pow(t,5);
        return 1 - Math.exp(-x*x/2) / Math.sqrt(2*Math.PI) * poly;
    } else {
        return 1 - normalCDF(-x);
    }
}

/**
 * Gamma function using Lanczos approximation
 */
function gamma(z) {
    if (z < 0.5) {
        // Reflection formula
        return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    }

    z -= 1;
    const g = 7;
    const coef = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7
    ];

    let x = coef[0];
    for (let i = 1; i < g + 2; i++) {
        x += coef[i] / (z + i);
    }

    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * Lower incomplete gamma function using series expansion
 */
function lowerIncompleteGamma(s, x) {
    if (x <= 0) return 0;
    if (x > 100) return gamma(s); // Approximate for large x

    // Series: γ(s,x) = x^s * e^(-x) * Σ[Γ(s) / Γ(s+1+n) * x^n]
    let sum = 1.0 / s;
    let term = 1.0 / s;

    for (let n = 1; n <= 100; n++) {
        term *= x / (s + n);
        sum += term;
        if (Math.abs(term) < 1e-10) break;
    }

    return Math.pow(x, s) * Math.exp(-x) * sum;
}

// ============ Data Generators ============

/**
 * Generate independent bivariate data
 * X and Y are sampled independently from given distributions
 */
function generateIndependentData(n, xDist = 'categorical', yDist = 'categorical', params = {}) {
    const data = [];

    for (let i = 0; i < n; i++) {
        let x, y;

        // Generate X
        if (xDist === 'categorical') {
            const xCategories = params.xCategories || ['A', 'B', 'C'];
            const xProbs = params.xProbs || [0.3, 0.5, 0.2];
            x = sampleCategorical(xCategories, xProbs);
        } else if (xDist === 'binned-normal') {
            const val = randomNormal(params.xMu || 0, params.xSigma || 1);
            x = binValue(val, params.xBins || [-Infinity, -1, 0, 1, Infinity]);
        }

        // Generate Y independently
        if (yDist === 'categorical') {
            const yCategories = params.yCategories || ['Low', 'Medium', 'High'];
            const yProbs = params.yProbs || [0.25, 0.5, 0.25];
            y = sampleCategorical(yCategories, yProbs);
        } else if (yDist === 'binned-normal') {
            const val = randomNormal(params.yMu || 0, params.ySigma || 1);
            y = binValue(val, params.yBins || [-Infinity, -1, 0, 1, Infinity]);
        }

        data.push({x, y});
    }

    return data;
}

/**
 * Generate dependent bivariate data
 * Y depends on X through a conditional distribution
 */
function generateDependentData(n, dependencyType = 'conditional', params = {}) {
    const data = [];

    if (dependencyType === 'conditional') {
        // Y depends on X through conditional probabilities
        const xCategories = params.xCategories || ['Weak', 'Medium', 'Strong'];
        const xProbs = params.xProbs || [0.3, 0.5, 0.2];

        // Define P(Y | X) - different for each X
        const conditionalProbs = params.conditionalProbs || {
            'Weak': [0.7, 0.25, 0.05],      // P(Y=Fail|X=Weak), P(Y=Pass|X=Weak), P(Y=Excel|X=Weak)
            'Medium': [0.3, 0.5, 0.2],
            'Strong': [0.05, 0.3, 0.65]
        };
        const yCategories = params.yCategories || ['Fail', 'Pass', 'Excel'];

        for (let i = 0; i < n; i++) {
            const x = sampleCategorical(xCategories, xProbs);
            const y = sampleCategorical(yCategories, conditionalProbs[x]);
            data.push({x, y});
        }

    } else if (dependencyType === 'correlation') {
        // Bivariate normal with correlation, then bin
        const rho = params.rho || 0.7;
        const xBins = params.xBins || [-Infinity, -0.5, 0.5, Infinity];
        const yBins = params.yBins || [-Infinity, -0.5, 0.5, Infinity];
        const xLabels = params.xLabels || ['Low', 'Medium', 'High'];
        const yLabels = params.yLabels || ['Low', 'Medium', 'High'];

        for (let i = 0; i < n; i++) {
            const z1 = randomNormal(0, 1);
            const z2 = randomNormal(0, 1);

            const xVal = z1;
            const yVal = rho * z1 + Math.sqrt(1 - rho*rho) * z2;

            const xIndex = binValue(xVal, xBins);
            const yIndex = binValue(yVal, yBins);

            data.push({
                x: xLabels[xIndex],
                y: yLabels[yIndex]
            });
        }
    }

    return data;
}

/**
 * Sample from categorical distribution
 */
function sampleCategorical(categories, probabilities) {
    const u = Math.random();
    let cumsum = 0;
    for (let i = 0; i < categories.length; i++) {
        cumsum += probabilities[i];
        if (u < cumsum) return categories[i];
    }
    return categories[categories.length - 1];
}

/**
 * Bin a continuous value
 */
function binValue(value, bins) {
    for (let i = 0; i < bins.length - 1; i++) {
        if (value >= bins[i] && value < bins[i+1]) return i;
    }
    return bins.length - 2;
}

/**
 * Generate standard normal random variable (Box-Muller)
 */
function randomNormal(mu = 0, sigma = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mu + sigma * z;
}

// ============ Analysis and Interpretation ============

/**
 * Perform complete independence analysis
 */
function analyzeIndependence(data) {
    // Step 1: Construct contingency table
    const contingencyTable = constructContingencyTable(data);

    // Step 2: Calculate marginals
    const marginals = calculateMarginals(contingencyTable);

    // Step 3: Calculate conditionals
    const conditionals = calculateConditionals(contingencyTable, marginals);

    // Step 4: Calculate expected frequencies
    const expected = calculateExpectedFrequencies(contingencyTable, marginals);

    // Step 5: Chi-square test
    const chiSquareResult = chiSquareTest(contingencyTable, expected);

    // Step 6: Interpretation
    const interpretation = interpretResults(chiSquareResult, contingencyTable);

    return {
        contingencyTable,
        marginals,
        conditionals,
        expected,
        chiSquareResult,
        interpretation
    };
}

/**
 * Interpret chi-square test results
 */
function interpretResults(chiSquareResult, contingencyTable) {
    const { chiSquare, degreesOfFreedom, pValue, significant } = chiSquareResult;

    let conclusion = '';
    let relationship = '';
    let causality = '';

    if (significant) {
        conclusion = `With p-value = ${pValue.toFixed(6)} < 0.05, we reject the null hypothesis of independence. `;
        conclusion += `The variables show a statistically significant association (χ² = ${chiSquare.toFixed(3)}, df = ${degreesOfFreedom}).`;
        relationship = 'The variables are statistically dependent. Changes in one variable are associated with changes in the other.';
        causality = 'IMPORTANT: Statistical association does NOT imply causation. The dependence could be due to: (1) X causes Y, (2) Y causes X, (3) a common confounding variable causes both, or (4) pure correlation without causal mechanism.';
    } else {
        conclusion = `With p-value = ${pValue.toFixed(6)} ≥ 0.05, we fail to reject the null hypothesis of independence. `;
        conclusion += `There is insufficient evidence to conclude the variables are dependent (χ² = ${chiSquare.toFixed(3)}, df = ${degreesOfFreedom}).`;
        relationship = 'The variables appear to be statistically independent. Knowledge of one variable does not provide information about the other.';
        causality = 'The lack of statistical association suggests no relationship, but absence of evidence is not evidence of absence. A larger sample size might reveal weak dependencies.';
    }

    return {
        conclusion,
        relationship,
        causality
    };
}

// ============ UI Event Handlers ============

document.addEventListener('DOMContentLoaded', () => {

    // Generate independent data
    document.getElementById('generate-independent-btn')?.addEventListener('click', () => {
        const n = parseInt(document.getElementById('independent-n').value);
        const msgEl = document.getElementById('independent-msg');

        msgEl.textContent = 'Generating independent data...';

        setTimeout(() => {
            const data = generateIndependentData(n);
            const analysis = analyzeIndependence(data);

            displayAnalysis('independent', analysis);
            msgEl.textContent = `✓ Generated ${n} independent observations`;
        }, 10);
    });

    // Generate dependent data
    document.getElementById('generate-dependent-btn')?.addEventListener('click', () => {
        const n = parseInt(document.getElementById('dependent-n').value);
        const dependencyType = document.getElementById('dependency-type').value;
        const msgEl = document.getElementById('dependent-msg');

        msgEl.textContent = 'Generating dependent data...';

        setTimeout(() => {
            const data = generateDependentData(n, dependencyType);
            const analysis = analyzeIndependence(data);

            displayAnalysis('dependent', analysis);
            msgEl.textContent = `✓ Generated ${n} dependent observations`;
        }, 10);
    });

    // Custom data analysis
    document.getElementById('analyze-custom-btn')?.addEventListener('click', () => {
        const dataText = document.getElementById('custom-data').value;
        const msgEl = document.getElementById('custom-msg');

        try {
            // Parse CSV format: x,y (one pair per line)
            const lines = dataText.trim().split('\n');
            const data = [];

            for (let i = 1; i < lines.length; i++) { // Skip header
                const [x, y] = lines[i].split(',').map(s => s.trim());
                if (x && y) data.push({x, y});
            }

            if (data.length === 0) {
                msgEl.textContent = '⚠ No valid data found';
                return;
            }

            msgEl.textContent = 'Analyzing...';

            setTimeout(() => {
                const analysis = analyzeIndependence(data);
                displayAnalysis('custom', analysis);
                msgEl.textContent = `✓ Analyzed ${data.length} observations`;
            }, 10);

        } catch (e) {
            msgEl.textContent = `⚠ Error: ${e.message}`;
        }
    });
});

/**
 * Display analysis results in the UI
 */
function displayAnalysis(prefix, analysis) {
    const { contingencyTable, marginals, expected, chiSquareResult, interpretation } = analysis;
    const { observed, xCategories, yCategories, n } = contingencyTable;

    // Display contingency table
    const tableEl = document.getElementById(`${prefix}-contingency-table`);
    if (tableEl) {
        let html = '<table><thead><tr><th>X \\ Y</th>';
        yCategories.forEach(y => html += `<th>${y}</th>`);
        html += '<th>Total</th></tr></thead><tbody>';

        xCategories.forEach(x => {
            html += `<tr><td><strong>${x}</strong></td>`;
            yCategories.forEach(y => {
                html += `<td>${observed[x][y]}</td>`;
            });
            html += `<td>${marginals.xMarginals[x]}</td></tr>`;
        });

        html += '<tr><td><strong>Total</strong></td>';
        yCategories.forEach(y => {
            html += `<td>${marginals.yMarginals[y]}</td>`;
        });
        html += `<td>${n}</td></tr>`;
        html += '</tbody></table>';

        tableEl.innerHTML = html;
    }

    // Display expected frequencies
    const expectedEl = document.getElementById(`${prefix}-expected-table`);
    if (expectedEl) {
        let html = '<table><thead><tr><th>X \\ Y</th>';
        yCategories.forEach(y => html += `<th>${y}</th>`);
        html += '</tr></thead><tbody>';

        xCategories.forEach(x => {
            html += `<tr><td><strong>${x}</strong></td>`;
            yCategories.forEach(y => {
                html += `<td>${expected[x][y].toFixed(2)}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';

        expectedEl.innerHTML = html;
    }

    // Display chi-square results
    document.getElementById(`${prefix}-chi-square`)!.textContent = chiSquareResult.chiSquare.toFixed(4);
    document.getElementById(`${prefix}-df`)!.textContent = chiSquareResult.degreesOfFreedom;
    document.getElementById(`${prefix}-p-value`)!.textContent = chiSquareResult.pValue.toFixed(6);
    document.getElementById(`${prefix}-significant`)!.textContent = chiSquareResult.significant ? 'Yes (p < 0.05)' : 'No (p ≥ 0.05)';

    // Display interpretation
    document.getElementById(`${prefix}-conclusion`)!.textContent = interpretation.conclusion;
    document.getElementById(`${prefix}-relationship`)!.textContent = interpretation.relationship;
    document.getElementById(`${prefix}-causality`)!.textContent = interpretation.causality;

    // Show results
    document.getElementById(`${prefix}-results`)!.style.display = 'block';
}
