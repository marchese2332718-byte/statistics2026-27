// Homework 2: Ethereum Wallet Pipeline Demo
// Uses ethers.js library for BIP-39/32/44 and address derivation

document.addEventListener('DOMContentLoaded', () => {
    const deriveBtn = document.getElementById('derive-btn');
    if (deriveBtn) {
        deriveBtn.addEventListener('click', deriveAddress);
    }
});

async function deriveAddress() {
    const mnemonicInput = document.getElementById('mnemonic').value.trim();
    const passphrase = document.getElementById('passphrase').value;
    const path = document.getElementById('path').value.trim();
    const msg = document.getElementById('demo-msg');
    const output = document.getElementById('demo-output');

    // Clear previous results
    msg.textContent = '';
    output.style.display = 'none';

    // Validate mnemonic
    if (!mnemonicInput) {
        msg.textContent = '⚠️ Please enter a mnemonic phrase.';
        msg.style.color = '#dc2626';
        return;
    }

    try {
        // Validate mnemonic using ethers.js
        if (!ethers.utils.isValidMnemonic(mnemonicInput)) {
            msg.textContent = '⚠️ Invalid mnemonic phrase. Please check your input.';
            msg.style.color = '#dc2626';
            return;
        }

        msg.textContent = 'Deriving address from mnemonic...';
        msg.style.color = 'var(--color-text-muted)';

        // Step 1: Mnemonic to seed (BIP-39)
        // ethers.js handles PBKDF2 internally
        const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonicInput, passphrase);

        // Display seed (first 32 bytes for brevity)
        const seedHex = hdNode.mnemonic.entropy;
        document.getElementById('out-seed').textContent = seedHex;

        // Step 2: Derive child key using BIP-32/BIP-44 path
        const childNode = hdNode.derivePath(path);

        // Step 3: Get private key
        const privateKey = childNode.privateKey;
        document.getElementById('out-privkey').textContent = privateKey;

        // Step 4: Get public key (uncompressed)
        const publicKey = childNode.publicKey;
        // Ethers uses compressed public key by default, but we can show the concept
        document.getElementById('out-pubkey').textContent = publicKey + ' (compressed)';

        // Step 5: Derive Ethereum address (Keccak-256 of public key)
        const address = childNode.address;
        document.getElementById('out-address').textContent = address.toLowerCase();

        // Step 6: Apply EIP-55 checksum
        const checksummedAddress = ethers.utils.getAddress(address);
        document.getElementById('out-checksum').textContent = checksummedAddress;

        // Show results
        output.style.display = 'block';
        msg.textContent = '✓ Address derived successfully!';
        msg.style.color = '#10b981';

    } catch (error) {
        msg.textContent = `⚠️ Error: ${error.message}`;
        msg.style.color = '#dc2626';
        console.error('Derivation error:', error);
    }
}

// Optional: Add explanation tooltips or additional validation
function validateDerivationPath(path) {
    // BIP-44 format: m / purpose' / coin_type' / account' / change / address_index
    const bip44Regex = /^m(\/\d+'?)+$/;
    return bip44Regex.test(path);
}

// Helper: Explain the components
function explainPath(path) {
    const parts = path.split('/');
    const explanations = [
        'm = master key',
        '44\' = BIP-44 purpose (hardened)',
        '60\' = Ethereum coin type (hardened)',
        '0\' = Account #0 (hardened)',
        '0 = External chain (receiving addresses)',
        '0 = First address index'
    ];

    return parts.map((part, i) => `${part}: ${explanations[i] || 'custom'}`).join('\n');
}
