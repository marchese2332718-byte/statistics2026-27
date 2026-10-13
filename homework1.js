// Toy elliptic curve: y² = x³ + 7 (mod 17)
const PRIME = 17;
const A = 0;
const B = 7;

// Modular inverse using Extended Euclidean Algorithm
function modInverse(a, m) {
    a = ((a % m) + m) % m;
    for (let x = 1; x < m; x++) {
        if ((a * x) % m === 1) {
            return x;
        }
    }
    return 1;
}

// Modular arithmetic
function mod(n, p) {
    return ((n % p) + p) % p;
}

// Check if point is on curve
function isOnCurve(x, y) {
    const leftSide = mod(y * y, PRIME);
    const rightSide = mod(x * x * x + A * x + B, PRIME);
    return leftSide === rightSide;
}

// Point addition on elliptic curve
function pointAdd(P, Q) {
    if (P === null) return Q;
    if (Q === null) return P;

    const [x1, y1] = P;
    const [x2, y2] = Q;

    let slope;

    if (x1 === x2) {
        if (y1 === y2) {
            // Point doubling: P = Q
            const numerator = mod(3 * x1 * x1 + A, PRIME);
            const denominator = mod(2 * y1, PRIME);
            slope = mod(numerator * modInverse(denominator, PRIME), PRIME);
        } else {
            // Points are inverse of each other
            return null; // Point at infinity
        }
    } else {
        // Point addition: P ≠ Q
        const numerator = mod(y2 - y1, PRIME);
        const denominator = mod(x2 - x1, PRIME);
        slope = mod(numerator * modInverse(denominator, PRIME), PRIME);
    }

    const x3 = mod(slope * slope - x1 - x2, PRIME);
    const y3 = mod(slope * (x1 - x3) - y1, PRIME);

    return [x3, y3];
}

// Scalar multiplication: compute k*G
function scalarMultiply(k, G) {
    let result = null;
    let addend = G;

    while (k > 0) {
        if (k & 1) {
            result = pointAdd(result, addend);
        }
        addend = pointAdd(addend, addend);
        k >>= 1;
    }

    return result;
}

// Calculate all intermediate points
function calculateAllPoints(k, G) {
    const points = [];
    let current = null;

    for (let i = 1; i <= k; i++) {
        current = pointAdd(current, G);
        points.push({ multiplier: i, point: current });
    }

    return points;
}

// Find all points on the curve
function findAllPointsOnCurve() {
    const points = [];
    for (let x = 0; x < PRIME; x++) {
        const rightSide = mod(x * x * x + A * x + B, PRIME);
        for (let y = 0; y < PRIME; y++) {
            const leftSide = mod(y * y, PRIME);
            if (leftSide === rightSide) {
                points.push([x, y]);
            }
        }
    }
    return points;
}

// ============ Task 1: Chip display ============
function task1Compute() {
    const gx = parseInt(document.getElementById('t1-gx').value);
    const gy = parseInt(document.getElementById('t1-gy').value);
    const k = parseInt(document.getElementById('t1-k').value);
    const msg = document.getElementById('t1-msg');
    const steps = document.getElementById('t1-steps');
    const pubkey = document.getElementById('t1-pubkey');

    const G = [gx, gy];

    if (!isOnCurve(gx, gy)) {
        msg.textContent = `⚠️ Point G = (${gx}, ${gy}) is not on the curve!`;
        msg.style.color = '#dc2626';
        steps.innerHTML = '';
        pubkey.textContent = '–';
        return;
    }

    msg.textContent = `Computing ${k}G step by step...`;
    msg.style.color = 'var(--color-text-muted)';

    const allPoints = calculateAllPoints(k, G);
    steps.innerHTML = '';

    allPoints.forEach(({ multiplier, point }) => {
        const li = document.createElement('li');
        if (point === null) {
            li.textContent = `${multiplier}G = ∞`;
        } else {
            li.textContent = `${multiplier}G = (${point[0]}, ${point[1]})`;
            if (isOnCurve(point[0], point[1])) {
                li.classList.add('valid');
            }
        }
        steps.appendChild(li);
    });

    const publicKey = allPoints[allPoints.length - 1].point;
    if (publicKey === null) {
        pubkey.textContent = '∞ (point at infinity)';
    } else {
        pubkey.textContent = `(${publicKey[0]}, ${publicKey[1]})`;
    }
}

// ============ Task 2: Visualization ============
function task2Visualize() {
    const gx = parseInt(document.getElementById('t2-gx').value);
    const gy = parseInt(document.getElementById('t2-gy').value);
    const k = parseInt(document.getElementById('t2-k').value);
    const msg = document.getElementById('t2-msg');
    const canvas = document.getElementById('t2-plot');
    const ctx = canvas.getContext('2d');

    const G = [gx, gy];

    if (!isOnCurve(gx, gy)) {
        msg.textContent = `⚠️ Point G = (${gx}, ${gy}) is not on the curve!`;
        msg.style.color = '#dc2626';
        return;
    }

    msg.textContent = `Visualizing scalar multiplication ${k}G on the curve...`;
    msg.style.color = 'var(--color-text-muted)';

    const width = canvas.width;
    const height = canvas.height;
    const scale = width / (PRIME + 2);
    const offset = scale;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= PRIME; i++) {
        const pos = offset + i * scale;
        ctx.beginPath();
        ctx.moveTo(pos, offset);
        ctx.lineTo(pos, height - offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(offset, pos);
        ctx.lineTo(width - offset, pos);
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(offset, offset);
    ctx.lineTo(offset, height - offset);
    ctx.lineTo(width - offset, height - offset);
    ctx.stroke();

    // Label axes
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    for (let i = 0; i <= PRIME; i++) {
        const pos = offset + i * scale;
        if (i % 2 === 0 || PRIME <= 20) {
            ctx.fillText(i.toString(), pos - 5, height - offset + 15);
            ctx.fillText(i.toString(), offset - 20, height - pos + 4);
        }
    }

    // Draw all points on curve
    const allCurvePoints = findAllPointsOnCurve();
    ctx.fillStyle = '#9ca3af';
    allCurvePoints.forEach(([x, y]) => {
        const px = offset + x * scale;
        const py = height - offset - y * scale;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Highlight the scalar multiplication sequence
    const calculatedPoints = calculateAllPoints(k, G);

    calculatedPoints.forEach(({ multiplier, point }, index) => {
        if (point !== null) {
            const px = offset + point[0] * scale;
            const py = height - offset - point[1] * scale;

            if (multiplier === k) {
                // Final public key - draw ring
                ctx.strokeStyle = '#2563eb';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(px, py, 8, 0, 2 * Math.PI);
                ctx.stroke();

                ctx.fillStyle = '#2563eb';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText(`${multiplier}G`, px + 12, py - 10);
            } else {
                // Intermediate points
                ctx.fillStyle = '#2563eb';
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, 2 * Math.PI);
                ctx.fill();

                if (multiplier <= 10 || multiplier % 5 === 0) {
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '10px sans-serif';
                    ctx.fillText(`${multiplier}G`, px + 8, py - 8);
                }
            }
        }
    });
}

// ============ Task 3: Console output ============
function task3ShowSteps() {
    const gx = parseInt(document.getElementById('t3-gx').value);
    const gy = parseInt(document.getElementById('t3-gy').value);
    const k = parseInt(document.getElementById('t3-k').value);
    const output = document.getElementById('t3-output');

    const G = [gx, gy];

    let text = `Curve: y² = x³ + ${B} (mod ${PRIME})\n`;
    text += `Base Point G = (${gx}, ${gy})\n`;
    text += `Private Key k = ${k}\n\n`;

    const leftSide = mod(gy * gy, PRIME);
    const rightSide = mod(gx * gx * gx + A * gx + B, PRIME);
    text += `Verification: ${gy}² mod ${PRIME} = ${leftSide}, ${gx}³ + ${B} mod ${PRIME} = ${rightSide}\n`;

    if (leftSide !== rightSide) {
        text += `⚠️ WARNING: Point G is NOT on the curve!\n`;
    } else {
        text += `✓ Point G is on the curve\n`;
    }

    text += `\n${'='.repeat(60)}\n`;
    text += `Computing k·G (scalar multiplication):\n`;
    text += `${'='.repeat(60)}\n\n`;

    const allPoints = calculateAllPoints(k, G);

    allPoints.forEach(({ multiplier, point }) => {
        if (point === null) {
            text += `${multiplier}G = ∞ (point at infinity)\n`;
        } else {
            const valid = isOnCurve(point[0], point[1]) ? '✓' : '✗';
            text += `${multiplier}G = (${point[0].toString().padStart(2)}, ${point[1].toString().padStart(2)}) ${valid}\n`;
        }
    });

    const publicKey = allPoints[allPoints.length - 1].point;

    text += `\n${'='.repeat(60)}\n`;
    if (publicKey === null) {
        text += `TOY PUBLIC KEY Q = ${k}G = ∞ (point at infinity)\n`;
    } else {
        text += `TOY PUBLIC KEY Q = ${k}G = (${publicKey[0]}, ${publicKey[1]})\n`;
    }
    text += `${'='.repeat(60)}\n`;

    output.textContent = text;
    output.style.display = 'block';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Task 1
    const t1btn = document.getElementById('t1-run');
    if (t1btn) {
        t1btn.addEventListener('click', task1Compute);
        task1Compute(); // Run on load
    }

    // Task 2
    const t2btn = document.getElementById('t2-run');
    if (t2btn) {
        t2btn.addEventListener('click', task2Visualize);
        task2Visualize(); // Run on load
    }

    // Task 3
    const t3btn = document.getElementById('t3-run');
    if (t3btn) {
        t3btn.addEventListener('click', task3ShowSteps);
        task3ShowSteps(); // Run on load
    }
});
