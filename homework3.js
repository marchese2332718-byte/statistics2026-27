// Homework 3: Cryptographic Schemes and Cryptanalysis
// Toy ECC encryption, Caesar cipher, and statistical attacks

// ============ Elliptic Curve Setup (from Homework 1) ============
const PRIME = 17;
const A = 0;
const B = 7;
const BASE_POINT = [1, 5]; // G

// Modular arithmetic
function mod(n, p) {
    return ((n % p) + p) % p;
}

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
            // Point doubling
            const numerator = mod(3 * x1 * x1 + A, PRIME);
            const denominator = mod(2 * y1, PRIME);
            slope = mod(numerator * modInverse(denominator, PRIME), PRIME);
        } else {
            // Points are inverse of each other
            return null; // Point at infinity
        }
    } else {
        // Point addition
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

// Point equality check
function pointsEqual(P, Q) {
    if (P === null && Q === null) return true;
    if (P === null || Q === null) return false;
    return P[0] === Q[0] && P[1] === Q[1];
}

// ============ Character/Point Mapping ============
// Map characters to numbers: A=0, B=1, ..., Z=25, space=26
function charToNum(char) {
    if (char === ' ') return 26;
    return char.toUpperCase().charCodeAt(0) - 65;
}

function numToChar(num) {
    if (num === 26) return ' ';
    return String.fromCharCode(65 + num);
}

// Find all points on curve and create mapping
function createPointMapping() {
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

const CURVE_POINTS = createPointMapping();

// Map number to point (use first available point for that number mod point count)
function numToPoint(num) {
    if (num >= CURVE_POINTS.length) {
        num = num % CURVE_POINTS.length;
    }
    return CURVE_POINTS[num];
}

// Map point to number (find index in point array)
function pointToNum(point) {
    for (let i = 0; i < CURVE_POINTS.length; i++) {
        if (pointsEqual(point, CURVE_POINTS[i])) {
            return i;
        }
    }
    return -1;
}

// ============ ECC Encryption/Decryption ============
let currentPublicKey = null;
let currentPrivateKey = null;
let currentCiphertext = null;

function eccEncrypt() {
    const message = document.getElementById('ecc-msg').value.toUpperCase();
    const k = parseInt(document.getElementById('ecc-k').value);
    const msgElem = document.getElementById('ecc-encrypt-msg');
    const pubkeyElem = document.getElementById('ecc-pubkey');
    const ciphertextElem = document.getElementById('ecc-ciphertext');

    if (!message || !/^[A-Z ]+$/.test(message)) {
        msgElem.textContent = '⚠️ Please enter a message with only letters A-Z and spaces';
        msgElem.style.color = '#dc2626';
        return;
    }

    if (k < 1 || k > 8) {
        msgElem.textContent = '⚠️ Private key must be between 1 and 8';
        msgElem.style.color = '#dc2626';
        return;
    }

    // Generate public key
    currentPrivateKey = k;
    currentPublicKey = scalarMultiply(k, BASE_POINT);
    pubkeyElem.textContent = `(${currentPublicKey[0]}, ${currentPublicKey[1]})`;

    // Encrypt each character
    const ciphertext = [];
    for (let i = 0; i < message.length; i++) {
        const char = message[i];
        const m = charToNum(char);
        const M = numToPoint(m);

        // Random ephemeral key (for demo, use deterministic but varying)
        const r = (i % 7) + 1; // 1-7 cycling

        // C1 = r*G
        const C1 = scalarMultiply(r, BASE_POINT);

        // C2 = M + r*Q
        const rQ = scalarMultiply(r, currentPublicKey);
        const C2 = pointAdd(M, rQ);

        ciphertext.push({ C1, C2, char });
    }

    currentCiphertext = ciphertext;

    // Display ciphertext
    const cipherStr = ciphertext.map((c, i) =>
        `${i}: C1=(${c.C1[0]},${c.C1[1]}), C2=(${c.C2[0]},${c.C2[1]})`
    ).join('\n');

    ciphertextElem.textContent = cipherStr;
    msgElem.textContent = '✓ Message encrypted successfully';
    msgElem.style.color = '#10b981';

    // Auto-populate attack fields
    document.getElementById('attack-pubkey').value = `(${currentPublicKey[0]}, ${currentPublicKey[1]})`;
    document.getElementById('attack-cipher').value = cipherStr;
}

function eccDecrypt() {
    const msgElem = document.getElementById('ecc-decrypt-msg');
    const decryptedElem = document.getElementById('ecc-decrypted');

    if (!currentCiphertext || !currentPrivateKey) {
        msgElem.textContent = '⚠️ Please encrypt a message first';
        msgElem.style.color = '#dc2626';
        return;
    }

    // Decrypt each character
    let plaintext = '';
    for (const cipher of currentCiphertext) {
        const { C1, C2 } = cipher;

        // M = C2 - k*C1
        const kC1 = scalarMultiply(currentPrivateKey, C1);
        const negKC1 = kC1 ? [kC1[0], mod(-kC1[1], PRIME)] : null;
        const M = pointAdd(C2, negKC1);

        // Map back to character
        const num = pointToNum(M);
        if (num >= 0 && num <= 26) {
            plaintext += numToChar(num);
        } else {
            plaintext += '?';
        }
    }

    decryptedElem.textContent = plaintext;
    msgElem.textContent = '✓ Message decrypted successfully';
    msgElem.style.color = '#10b981';
}

// ============ Caesar Cipher ============
function caesarEncrypt() {
    const message = document.getElementById('caesar-msg').value.toUpperCase();
    const k = parseInt(document.getElementById('caesar-k').value);
    const msgElem = document.getElementById('caesar-encrypt-msg');
    const ciphertextElem = document.getElementById('caesar-ciphertext');

    if (!message) {
        msgElem.textContent = '⚠️ Please enter a message';
        msgElem.style.color = '#dc2626';
        return;
    }

    let ciphertext = '';
    for (const char of message) {
        if (char >= 'A' && char <= 'Z') {
            const shifted = ((char.charCodeAt(0) - 65 + k) % 26);
            ciphertext += String.fromCharCode(65 + shifted);
        } else {
            ciphertext += char; // Keep non-letters as is
        }
    }

    ciphertextElem.textContent = ciphertext;
    msgElem.textContent = '✓ Message encrypted';
    msgElem.style.color = '#10b981';
}

function caesarDecrypt() {
    const ciphertext = document.getElementById('caesar-ciphertext').textContent;
    const k = parseInt(document.getElementById('caesar-k').value);
    const msgElem = document.getElementById('caesar-decrypt-msg');
    const decryptedElem = document.getElementById('caesar-decrypted');

    if (!ciphertext || ciphertext === '–') {
        msgElem.textContent = '⚠️ Please encrypt a message first';
        msgElem.style.color = '#dc2626';
        return;
    }

    let plaintext = '';
    for (const char of ciphertext) {
        if (char >= 'A' && char <= 'Z') {
            const shifted = ((char.charCodeAt(0) - 65 - k + 26) % 26);
            plaintext += String.fromCharCode(65 + shifted);
        } else {
            plaintext += char;
        }
    }

    decryptedElem.textContent = plaintext;
    msgElem.textContent = '✓ Message decrypted';
    msgElem.style.color = '#10b981';
}

// ============ Frequency Analysis Attack ============
// English letter frequencies (in percentage)
const ENGLISH_FREQ = {
    'A': 8.2, 'B': 1.5, 'C': 2.8, 'D': 4.3, 'E': 12.7, 'F': 2.2,
    'G': 2.0, 'H': 6.1, 'I': 7.0, 'J': 0.15, 'K': 0.77, 'L': 4.0,
    'M': 2.4, 'N': 6.7, 'O': 7.5, 'P': 1.9, 'Q': 0.095, 'R': 6.0,
    'S': 6.3, 'T': 9.1, 'U': 2.8, 'V': 0.98, 'W': 2.4, 'X': 0.15,
    'Y': 2.0, 'Z': 0.074
};

function calculateFrequencies(text) {
    const freq = {};
    let total = 0;

    for (const char of text.toUpperCase()) {
        if (char >= 'A' && char <= 'Z') {
            freq[char] = (freq[char] || 0) + 1;
            total++;
        }
    }

    // Convert to percentages
    for (const char in freq) {
        freq[char] = (freq[char] / total) * 100;
    }

    return freq;
}

function chiSquared(observedFreq) {
    let chi2 = 0;
    for (let i = 0; i < 26; i++) {
        const char = String.fromCharCode(65 + i);
        const observed = observedFreq[char] || 0;
        const expected = ENGLISH_FREQ[char];
        chi2 += Math.pow(observed - expected, 2) / expected;
    }
    return chi2;
}

function caesarDecryptWithShift(ciphertext, shift) {
    let plaintext = '';
    for (const char of ciphertext) {
        if (char >= 'A' && char <= 'Z') {
            const shifted = ((char.charCodeAt(0) - 65 - shift + 26) % 26);
            plaintext += String.fromCharCode(65 + shifted);
        } else {
            plaintext += char;
        }
    }
    return plaintext;
}

function frequencyAttack() {
    const ciphertext = document.getElementById('freq-cipher').value.toUpperCase();
    const msgElem = document.getElementById('freq-msg');
    const resultsElem = document.getElementById('freq-results');

    if (!ciphertext || ciphertext.length < 10) {
        msgElem.textContent = '⚠️ Please enter at least 10 characters of ciphertext';
        msgElem.style.color = '#dc2626';
        return;
    }

    msgElem.textContent = 'Analyzing frequencies and testing all shifts...';
    msgElem.style.color = 'var(--color-text-muted)';

    // Try all 26 shifts and find the one with lowest chi-squared
    let bestShift = 0;
    let bestChi2 = Infinity;
    let bestPlaintext = '';

    for (let shift = 0; shift < 26; shift++) {
        const plaintext = caesarDecryptWithShift(ciphertext, shift);
        const freq = calculateFrequencies(plaintext);
        const chi2 = chiSquared(freq);

        if (chi2 < bestChi2) {
            bestChi2 = chi2;
            bestShift = shift;
            bestPlaintext = plaintext;
        }
    }

    // Display results
    document.getElementById('freq-key').textContent = bestShift;
    document.getElementById('freq-plaintext').textContent = bestPlaintext;
    document.getElementById('freq-chi2').textContent = bestChi2.toFixed(2);

    // Draw frequency chart
    drawFrequencyChart(calculateFrequencies(ciphertext), calculateFrequencies(bestPlaintext));

    resultsElem.style.display = 'block';
    msgElem.textContent = '✓ Attack successful! Key recovered using chi-squared test';
    msgElem.style.color = '#10b981';
}

function drawFrequencyChart(cipherFreq, plainFreq) {
    const canvas = document.getElementById('freq-chart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw bars
    const barWidth = width / 26;
    const maxFreq = 15; // Max percentage for scale

    for (let i = 0; i < 26; i++) {
        const char = String.fromCharCode(65 + i);
        const x = i * barWidth;

        // Expected English frequency (orange)
        const expectedHeight = (ENGLISH_FREQ[char] / maxFreq) * (height - 40);
        ctx.fillStyle = '#fb923c';
        ctx.fillRect(x + 2, height - expectedHeight - 20, barWidth / 2 - 3, expectedHeight);

        // Decrypted text frequency (blue)
        const observedHeight = ((plainFreq[char] || 0) / maxFreq) * (height - 40);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x + barWidth / 2, height - observedHeight - 20, barWidth / 2 - 3, observedHeight);

        // Label
        ctx.fillStyle = '#000';
        ctx.font = '10px sans-serif';
        ctx.fillText(char, x + barWidth / 2 - 3, height - 5);
    }
}

// ============ ECC Brute-Force Attack ============
function attackECC() {
    const msgElem = document.getElementById('attack-msg');
    const resultsElem = document.getElementById('attack-results');

    if (!currentPublicKey || !currentCiphertext) {
        msgElem.textContent = '⚠️ Please encrypt a message in Part 1 first';
        msgElem.style.color = '#dc2626';
        return;
    }

    msgElem.textContent = 'Attempting brute-force attack on private key...';
    msgElem.style.color = 'var(--color-text-muted)';

    // Try all keys from 1 to 8
    let foundKey = null;
    for (let k = 1; k <= 8; k++) {
        const testPubkey = scalarMultiply(k, BASE_POINT);
        if (pointsEqual(testPubkey, currentPublicKey)) {
            foundKey = k;
            break;
        }
    }

    if (foundKey === null) {
        msgElem.textContent = '⚠️ Attack failed (this should not happen)';
        msgElem.style.color = '#dc2626';
        return;
    }

    // Decrypt using recovered key
    let plaintext = '';
    for (const cipher of currentCiphertext) {
        const { C1, C2 } = cipher;
        const kC1 = scalarMultiply(foundKey, C1);
        const negKC1 = kC1 ? [kC1[0], mod(-kC1[1], PRIME)] : null;
        const M = pointAdd(C2, negKC1);
        const num = pointToNum(M);
        if (num >= 0 && num <= 26) {
            plaintext += numToChar(num);
        } else {
            plaintext += '?';
        }
    }

    // Display results
    document.getElementById('attack-key').textContent = foundKey;
    document.getElementById('attack-plaintext').textContent = plaintext;
    document.getElementById('attack-tries').textContent = `${foundKey} (out of 8 possible)`;

    resultsElem.style.display = 'block';
    msgElem.textContent = '✓ Private key recovered! Message decrypted successfully';
    msgElem.style.color = '#10b981';
}

// ============ Event Listeners ============
document.addEventListener('DOMContentLoaded', () => {
    // ECC Encryption
    const eccEncryptBtn = document.getElementById('ecc-encrypt-btn');
    if (eccEncryptBtn) {
        eccEncryptBtn.addEventListener('click', eccEncrypt);
    }

    const eccDecryptBtn = document.getElementById('ecc-decrypt-btn');
    if (eccDecryptBtn) {
        eccDecryptBtn.addEventListener('click', eccDecrypt);
    }

    // Caesar Cipher
    const caesarEncryptBtn = document.getElementById('caesar-encrypt-btn');
    if (caesarEncryptBtn) {
        caesarEncryptBtn.addEventListener('click', caesarEncrypt);
    }

    const caesarDecryptBtn = document.getElementById('caesar-decrypt-btn');
    if (caesarDecryptBtn) {
        caesarDecryptBtn.addEventListener('click', caesarDecrypt);
    }

    // Frequency Attack
    const freqAttackBtn = document.getElementById('freq-attack-btn');
    if (freqAttackBtn) {
        freqAttackBtn.addEventListener('click', frequencyAttack);
    }

    // ECC Attack
    const attackBtn = document.getElementById('attack-btn');
    if (attackBtn) {
        attackBtn.addEventListener('click', attackECC);
    }
});
