// --- STATE MANAGEMENT ---
let state = {
    password: '',
    explanation: '',
    error: null,
    options: {
        length: 16,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: true,
    }
};

// --- DOM ELEMENT SELECTORS ---
const dom = {
    passwordText: document.getElementById('password-text'),
    copyBtn: document.getElementById('copy-btn'),
    copyIcon: document.getElementById('copy-icon'),
    checkIcon: document.getElementById('check-icon'),
    makeReadableBtn: document.getElementById('make-readable-btn'),
    strengthLabel: document.getElementById('strength-label'),
    strengthBar: document.getElementById('strength-bar'),
    lengthSlider: document.getElementById('length-slider'),
    lengthLabel: document.getElementById('length-label'),
    uppercaseCheckbox: document.getElementById('uppercase-checkbox'),
    numbersCheckbox: document.getElementById('numbers-checkbox'),
    symbolsCheckbox: document.getElementById('symbols-checkbox'),
    generateBtn: document.getElementById('generate-btn'),
    errorBox: document.getElementById('error-box'),
    explanationBox: document.getElementById('explanation-box'),
    securityTips: document.getElementById('security-tips'),
};

// --- LOCAL PASSWORD GENERATION ---
const CHARSETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

const WORDLIST = [
    'River', 'Mountain', 'Sunshine', 'Galaxy', 'Ocean', 'Castle', 'Dragon', 'Melody', 'Wizard', 'Secret', 
    'Journey', 'Harvest', 'Silver', 'Forest', 'Shadow', 'Phoenix', 'Crystal', 'Magic', 'Dream', 'Star'
];

function secureRandom(max) {
    return window.crypto.getRandomValues(new Uint32Array(1))[0] % max;
}

function generatePassword(options) {
    let charset = CHARSETS.lowercase;
    let requiredChars = [];
    
    if (options.includeUppercase) {
        charset += CHARSETS.uppercase;
        requiredChars.push(CHARSETS.uppercase[secureRandom(CHARSETS.uppercase.length)]);
    }
    if (options.includeNumbers) {
        charset += CHARSETS.numbers;
        requiredChars.push(CHARSETS.numbers[secureRandom(CHARSETS.numbers.length)]);
    }
    if (options.includeSymbols) {
        charset += CHARSETS.symbols;
        requiredChars.push(CHARSETS.symbols[secureRandom(CHARSETS.symbols.length)]);
    }

    if (requiredChars.length > options.length) {
        throw new Error("Password length is too short to include all required character types.");
    }

    let password = requiredChars.slice();
    const remainingLength = options.length - requiredChars.length;
    
    for (let i = 0; i < remainingLength; i++) {
        password.push(charset[secureRandom(charset.length)]);
    }
    
    // Shuffle the array to ensure randomness
    for (let i = password.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
}

function generatePassphrase() {
    const words = [];
    for (let i = 0; i < 3; i++) {
        words.push(WORDLIST[secureRandom(WORDLIST.length)]);
    }
    const number = secureRandom(100);
    const symbol = CHARSETS.symbols[secureRandom(CHARSETS.symbols.length)];
    
    return {
        password: `${words[0]}-${number}-${words[1]}${symbol}${words[2]}`,
        explanation: `This passphrase is strong because it combines multiple random words, making it very long and hard to guess. The mix of capitalization, numbers, and symbols adds layers of complexity, significantly increasing the time it would take for a computer to crack it compared to a simple password. It's security through memorable length and variety.`
    };
}

function generateExplanation(options) {
    let explanation = `This password's strength comes from several key factors:\n\n`;
    explanation += `• Length (${options.length} characters): Longer passwords are exponentially harder to crack. Each extra character makes a huge difference.\n`;
    if (options.includeUppercase && options.includeNumbers && options.includeSymbols) {
        explanation += `• Character Variety: By using a mix of uppercase letters, numbers, and symbols, the total number of possible characters for each position is much larger, making it resistant to brute-force attacks.\n`;
    } else {
        if (options.includeUppercase) explanation += `• Uppercase Letters: Including both lowercase and uppercase letters doubles the possible characters, increasing complexity.\n`;
        if (options.includeNumbers) explanation += `• Numbers: Adding digits further expands the character set.\n`;
        if (options.includeSymbols) explanation += `• Symbols: Special characters are a powerful way to make the password much harder to guess.\n`;
    }
    explanation += `\nThis combination of length and complexity creates a password that is highly resistant to modern password-cracking tools.`;
    return explanation;
}


// --- UI LOGIC AND RENDERING ---

function calculateStrength(options) {
    let score = 0;
    if (options.length >= 12) score += 25;
    else if (options.length >= 8) score += 10;
    if (options.includeUppercase) score += 25;
    if (options.includeNumbers) score += 25;
    if (options.includeSymbols) score += 25;

    if (score === 100) return { label: 'Very Strong', color: 'bg-green-500', score: 100 };
    if (score >= 75) return { label: 'Strong', color: 'bg-yellow-400', score };
    if (score >= 50) return { label: 'Medium', color: 'bg-orange-500', score };
    return { label: 'Weak', color: 'bg-red-500', score };
}

function renderStrength() {
    const strength = calculateStrength(state.options);
    dom.strengthLabel.textContent = strength.label;
    dom.strengthLabel.className = `text-sm font-bold ${strength.color.replace('bg-', 'text-')}`;
    dom.strengthBar.className = `h-2.5 rounded-full transition-all duration-500 ${strength.color}`;
    dom.strengthBar.style.width = `${strength.score}%`;
}

function renderPassword() {
    if (state.password) {
        dom.passwordText.textContent = state.password;
        dom.passwordText.classList.remove('text-zinc-500');
        dom.copyBtn.disabled = false;
        dom.makeReadableBtn.style.display = 'flex';
    } else {
        dom.passwordText.textContent = 'Click Generate to start';
        dom.passwordText.classList.add('text-zinc-500');
        dom.copyBtn.disabled = true;
        dom.makeReadableBtn.style.display = 'none';
    }
}

function renderExplanation() {
     if (state.explanation) {
        dom.explanationBox.innerHTML = `
            <div class="w-full p-6 bg-zinc-900 border border-red-500/20 rounded-lg">
                <div class="flex items-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-red-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 class="text-xl font-bold text-red-300">Why is this strong?</h3>
                </div>
                <p class="text-zinc-300 leading-relaxed whitespace-pre-wrap">${state.explanation}</p>
            </div>`;
    } else {
        dom.explanationBox.innerHTML = '';
    }
}

function setAppBusy(isBusy) {
    dom.generateBtn.disabled = isBusy;
    dom.makeReadableBtn.disabled = isBusy || !state.password;
    dom.securityTips.style.display = state.password && !isBusy ? 'block' : 'none';
}

function showError(message) {
    state.error = message;
    dom.errorBox.textContent = message;
    dom.errorBox.style.display = message ? 'block' : 'none';
}


// --- EVENT HANDLERS ---
function handleGeneratePassword() {
    setAppBusy(true);
    showError(null);
    try {
        state.password = generatePassword(state.options);
        state.explanation = generateExplanation(state.options);
        renderPassword();
        renderExplanation();
    } catch (err) {
        showError(err.message);
        state.password = '';
        state.explanation = '';
        renderPassword();
        renderExplanation();
    } finally {
        setAppBusy(false);
    }
}

function handleMakeReadable() {
    if (!state.password) return;
    setAppBusy(true);
    showError(null);
    try {
        const result = generatePassphrase();
        state.password = result.password;
        state.explanation = result.explanation;
        renderPassword();
        renderExplanation();
    } catch (err) {
        showError('Failed to make password readable. Please try again.');
    } finally {
        setAppBusy(false);
    }
}

function handleCopy() {
    if (!state.password) return;
    navigator.clipboard.writeText(state.password);
    dom.copyIcon.style.display = 'none';
    dom.checkIcon.style.display = 'block';
    setTimeout(() => {
        dom.copyIcon.style.display = 'block';
        dom.checkIcon.style.display = 'none';
    }, 2000);
}

function handleOptionsChange() {
    state.options = {
        length: parseInt(dom.lengthSlider.value, 10),
        includeUppercase: dom.uppercaseCheckbox.checked,
        includeNumbers: dom.numbersCheckbox.checked,
        includeSymbols: dom.symbolsCheckbox.checked,
    };
    dom.lengthLabel.textContent = state.options.length.toString();
    renderStrength();
}

// --- INITIALIZATION ---
function init() {
    dom.generateBtn.addEventListener('click', handleGeneratePassword);
    dom.makeReadableBtn.addEventListener('click', handleMakeReadable);
    dom.copyBtn.addEventListener('click', handleCopy);

    dom.lengthSlider.addEventListener('input', handleOptionsChange);
    dom.uppercaseCheckbox.addEventListener('change', handleOptionsChange);
    dom.numbersCheckbox.addEventListener('change', handleOptionsChange);
    dom.symbolsCheckbox.addEventListener('change', handleOptionsChange);
    
    // Initial render based on default state
    handleOptionsChange();
    renderPassword();
}

init();
