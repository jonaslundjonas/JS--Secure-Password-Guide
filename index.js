import { GoogleGenAI, Type } from "@google/genai";

// --- STATE MANAGEMENT ---
let state = {
    password: '',
    explanation: '',
    isLoading: false,
    isMakingReadable: false,
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
    readableBtnText: document.getElementById('readable-btn-text'),
    readableSpinner: document.getElementById('readable-spinner'),
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

// --- GEMINI API SERVICE ---
if (!process.env.API_KEY) {
  showError("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const responseSchema = {
    type: Type.OBJECT,
    properties: {
        password: { type: Type.STRING, description: "The generated secure password or passphrase." },
        explanation: { type: Type.STRING, description: "A pedagogical explanation of why the generated password/passphrase is secure." }
    },
    required: ["password", "explanation"]
};

async function generateSecurePasswordAndExplanation(options) {
    const prompt = `
Generate a secure, random password based on these criteria:
- Length: ${options.length} characters
- Include Uppercase Letters (A-Z): ${options.includeUppercase}
- Include Numbers (0-9): ${options.includeNumbers}
- Include Special Symbols (!@#$%^&*): ${options.includeSymbols}
Also, provide a brief, educational explanation for a non-technical user about why a password with these specific characteristics is considered strong.`;
    
    return callGemini(prompt, 1.0);
}

async function makePasswordReadable(currentPassword) {
    const prompt = `
Take the following secure but random password: "${currentPassword}"
Transform it into a more readable and memorable passphrase of similar or greater cryptographic strength.
After creating the passphrase, provide a brief, educational explanation for why this passphrase is secure, focusing on its length and the concept of entropy in word combinations.`;

    return callGemini(prompt, 0.7);
}

async function callGemini(prompt, temperature) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: temperature,
            },
        });
        const result = JSON.parse(response.text.trim());
        if (result && typeof result.password === 'string' && typeof result.explanation === 'string') {
            return result;
        } else {
            throw new Error("Invalid JSON structure received from API.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with Gemini API.");
    }
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
    if (state.isLoading || state.isMakingReadable) {
        dom.explanationBox.innerHTML = `
            <div class="w-full p-6 bg-zinc-900/50 border border-red-500/20 rounded-lg animate-pulse">
                <div class="flex items-center mb-4"><div class="w-8 h-8 rounded-full bg-zinc-700 mr-3"></div><div class="w-1/3 h-6 bg-zinc-700 rounded"></div></div>
                <div class="space-y-3"><div class="h-4 bg-zinc-700 rounded"></div><div class="h-4 bg-zinc-700 rounded w-5/6"></div><div class="h-4 bg-zinc-700 rounded w-3/4"></div></div>
            </div>`;
    } else if (state.explanation) {
        dom.explanationBox.innerHTML = `
            <div class="w-full p-6 bg-zinc-900 border border-red-500/20 rounded-lg">
                <div class="flex items-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-red-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 class="text-xl font-bold text-red-300">Why is this a strong password?</h3>
                </div>
                <p class="text-zinc-300 leading-relaxed whitespace-pre-wrap">${state.explanation}</p>
            </div>`;
    } else {
        dom.explanationBox.innerHTML = '';
    }
}

function setLoadingState(isLoading, isMakingReadable = false) {
    state.isLoading = isLoading;
    state.isMakingReadable = isMakingReadable;
    const anyLoading = isLoading || isMakingReadable;

    dom.generateBtn.disabled = anyLoading;
    dom.makeReadableBtn.disabled = anyLoading || !state.password;
    
    if(isLoading) dom.generateBtn.textContent = 'Generating...';
    else dom.generateBtn.textContent = 'Generate Secure Password';
    
    dom.readableSpinner.style.display = isMakingReadable ? 'flex' : 'none';
    dom.readableBtnText.style.display = isMakingReadable ? 'none' : 'block';

    renderExplanation();

    dom.securityTips.style.display = state.password && !anyLoading ? 'block' : 'none';
}

function showError(message) {
    state.error = message;
    dom.errorBox.textContent = message;
    dom.errorBox.style.display = message ? 'block' : 'none';
}


// --- EVENT HANDLERS ---
async function handleGeneratePassword() {
    setLoadingState(true);
    showError(null);
    try {
        const result = await generateSecurePasswordAndExplanation(state.options);
        state.password = result.password;
        state.explanation = result.explanation;
        renderPassword();
    } catch (err) {
        showError(err.message);
        state.password = '';
        state.explanation = '';
        renderPassword();
    } finally {
        setLoadingState(false);
    }
}

async function handleMakeReadable() {
    if (!state.password) return;
    setLoadingState(true, true);
    showError(null);
    try {
        const result = await makePasswordReadable(state.password);
        state.password = result.password;
        state.explanation = result.explanation;
        renderPassword();
    } catch (err) {
        showError('Failed to make password readable. Please try again.');
    } finally {
        setLoadingState(false);
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
