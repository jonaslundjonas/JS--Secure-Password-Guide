
export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export interface PasswordStrength {
  label: 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  color: string;
  score: number;
}
