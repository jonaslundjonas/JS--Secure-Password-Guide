
import React, { useState, useCallback, useMemo } from 'react';
import { generateSecurePasswordAndExplanation } from './services/geminiService';
import type { PasswordOptions, PasswordStrength } from './types';

// --- Helper Functions ---
const calculateStrength = (options: PasswordOptions): PasswordStrength => {
  let score = 0;
  let checks = 0;

  if (options.length >= 12) {
    score += 25;
  } else if (options.length >= 8) {
    score += 10;
  }
  checks++;

  if (options.includeUppercase) {
    score += 25;
  }
  checks++;

  if (options.includeNumbers) {
    score += 25;
  }
  checks++;

  if (options.includeSymbols) {
    score += 25;
  }
  checks++;

  if (score === 100) return { label: 'Very Strong', color: 'bg-green-500', score: 100 };
  if (score >= 75) return { label: 'Strong', color: 'bg-yellow-400', score };
  if (score >= 50) return { label: 'Medium', color: 'bg-orange-500', score };
  return { label: 'Weak', color: 'bg-red-500', score };
};

// --- SVG Icons ---
const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
);


// --- UI Components (Defined outside main component to prevent re-creation on re-render) ---

interface PasswordDisplayProps {
  password: string;
}
const PasswordDisplay: React.FC<PasswordDisplayProps> = ({ password }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        if (password) {
            navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [password]);

    return (
        <div className="relative w-full p-4 bg-gray-800 border-2 border-cyan-500/30 rounded-lg shadow-lg shadow-cyan-500/10 flex items-center justify-between font-mono text-lg md:text-xl text-cyan-300">
            <span className={password ? 'tracking-wider' : 'text-gray-500'}>
                {password || 'Click Generate to start'}
            </span>
            <button
                onClick={handleCopy}
                disabled={!password}
                className="p-2 text-gray-400 hover:text-cyan-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Copy password"
            >
                {copied ? <CheckIcon className="w-6 h-6 text-green-400" /> : <CopyIcon className="w-6 h-6" />}
            </button>
        </div>
    );
};

interface StrengthIndicatorProps {
    strength: PasswordStrength;
}
const StrengthIndicator: React.FC<StrengthIndicatorProps> = ({ strength }) => {
    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-400">Password Strength:</span>
                <span className={`text-sm font-bold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className={`${strength.color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${strength.score}%` }}></div>
            </div>
        </div>
    );
};

interface OptionsPanelProps {
    options: PasswordOptions;
    setOptions: React.Dispatch<React.SetStateAction<PasswordOptions>>;
}
const OptionsPanel: React.FC<OptionsPanelProps> = ({ options, setOptions }) => {
    const handleCheckboxChange = (key: keyof PasswordOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOptions(prev => ({ ...prev, length: parseInt(e.target.value, 10) }));
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col">
                <label htmlFor="length" className="mb-2 text-gray-300">Password Length: <span className="font-bold text-cyan-400">{options.length}</span></label>
                <input
                    id="length"
                    type="range"
                    min="8"
                    max="32"
                    value={options.length}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(options) as Array<keyof PasswordOptions>).filter(k => k !== 'length').map(key => (
                     <label key={key} className="flex items-center p-3 bg-gray-800 rounded-md cursor-pointer hover:bg-gray-700 transition-colors">
                        <input
                            type="checkbox"
                            checked={options[key as keyof Omit<PasswordOptions, 'length'>]}
                            onChange={() => handleCheckboxChange(key)}
                            className="w-5 h-5 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-600 ring-offset-gray-800 focus:ring-2"
                        />
                        <span className="ml-3 text-gray-300">
                            {
                                {
                                    includeUppercase: 'Include Uppercase (A-Z)',
                                    includeNumbers: 'Include Numbers (0-9)',
                                    includeSymbols: 'Include Symbols (!@#$%)'
                                }[key]
                            }
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
};

interface ExplanationBoxProps {
    explanation: string;
    isLoading: boolean;
}
const ExplanationBox: React.FC<ExplanationBoxProps> = ({ explanation, isLoading }) => {
    if (isLoading) {
        return (
            <div className="w-full p-6 bg-gray-800/50 border border-cyan-500/20 rounded-lg animate-pulse">
                <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-gray-700 mr-3"></div>
                    <div className="w-1/3 h-6 bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                </div>
            </div>
        );
    }
    
    if (!explanation) return null;

    return (
        <div className="w-full p-6 bg-gray-800 border border-cyan-500/20 rounded-lg">
            <div className="flex items-center mb-3">
                <InfoIcon className="w-7 h-7 text-cyan-400 mr-3 flex-shrink-0" />
                <h3 className="text-xl font-bold text-cyan-300">Why is this a strong password?</h3>
            </div>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{explanation}</p>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });

  const [password, setPassword] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => calculateStrength(options), [options]);

  const handleGeneratePassword = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateSecurePasswordAndExplanation(options);
      setPassword(result.password);
      setExplanation(result.explanation);
    } catch (err) {
      console.error(err);
      setError('Failed to generate password. Please check your API key and try again.');
      setPassword('');
      setExplanation('');
    } finally {
      setIsLoading(false);
    }
  }, [options]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <main className="w-full max-w-2xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Secure Password Guide
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Understand and generate truly secure passwords with AI.
          </p>
        </header>

        <div className="p-6 md:p-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl shadow-black/30 space-y-6">
            <PasswordDisplay password={password} />
            <StrengthIndicator strength={strength} />
            <OptionsPanel options={options} setOptions={setOptions} />
            <button
                onClick={handleGeneratePassword}
                disabled={isLoading}
                className="w-full py-3 px-6 text-lg font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 ease-in-out disabled:bg-gray-600 disabled:cursor-wait transform hover:scale-105 disabled:scale-100"
            >
                {isLoading ? 'Generating...' : 'Generate Secure Password'}
            </button>
        </div>

        {error && (
            <div className="w-full p-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg text-center">
                {error}
            </div>
        )}

        <ExplanationBox explanation={explanation} isLoading={isLoading} />
      </main>

      <footer className="w-full text-center text-gray-600 mt-12 pb-4">
        Created by Jonas Lund 2025
      </footer>
    </div>
  );
}
