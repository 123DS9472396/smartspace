import { useState, useEffect } from 'react';

export interface PasswordStrength {
    score: number; // 0-100
    strength: 'weak' | 'medium' | 'strong';
    feedback: string[];
    valid: boolean;
}

export function usePasswordStrength(password: string): PasswordStrength {
    const [strength, setStrength] = useState<PasswordStrength>({
        score: 0,
        strength: 'weak',
        feedback: [],
        valid: false,
    });

    useEffect(() => {
        if (!password) {
            setStrength({
                score: 0,
                strength: 'weak',
                feedback: [],
                valid: false,
            });
            return;
        }

        const feedback: string[] = [];
        let score = 0;

        // Length check (35 points max)
        if (password.length >= 12) {
            score += 35;
        } else if (password.length >= 8) {
            score += 25;
            feedback.push('Consider using a longer password (12+ characters)');
        } else {
            score += 10;
            feedback.push('Password must be at least 8 characters');
        }

        // Uppercase check (15 points)
        if (/[A-Z]/.test(password)) {
            score += 15;
        } else {
            feedback.push('Add uppercase letters');
        }

        // Lowercase check (15 points)
        if (/[a-z]/.test(password)) {
            score += 15;
        } else {
            feedback.push('Add lowercase letters');
        }

        // Number check (15 points)
        if (/[0-9]/.test(password)) {
            score += 15;
        } else {
            feedback.push('Add numbers');
        }

        // Special character check (20 points)
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            score += 20;
        } else {
            feedback.push('Add special characters (!@#$%^&*)');
        }

        // Determine strength level
        let strengthLevel: 'weak' | 'medium' | 'strong' = 'weak';
        if (score >= 80) {
            strengthLevel = 'strong';
        } else if (score >= 50) {
            strengthLevel = 'medium';
        }

        // Check if password meets minimum requirements
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const isLongEnough = password.length >= 8;
        const valid = hasUppercase && hasLowercase && hasNumber && isLongEnough;

        setStrength({
            score,
            strength: strengthLevel,
            feedback,
            valid,
        });
    }, [password]);

    return strength;
}

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
    switch (strength) {
        case 'weak':
            return 'bg-red-500';
        case 'medium':
            return 'bg-yellow-500';
        case 'strong':
            return 'bg-green-500';
        default:
            return 'bg-gray-300';
    }
}

export function getPasswordStrengthText(strength: 'weak' | 'medium' | 'strong'): string {
    switch (strength) {
        case 'weak':
            return 'Weak';
        case 'medium':
            return 'Medium';
        case 'strong':
            return 'Strong';
        default:
            return '';
    }
}
