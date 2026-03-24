import { usePasswordStrength, getPasswordStrengthColor, getPasswordStrengthText } from '../hooks/use-password-strength';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';

interface PasswordStrengthMeterProps {
    password: string;
    showFeedback?: boolean;
}

export default function PasswordStrengthMeter({ password, showFeedback = true }: PasswordStrengthMeterProps) {
    const strength = usePasswordStrength(password);

    if (!password) {
        return null;
    }

    return (
        <div className="mt-2 space-y-2">
            {/* Progress bar */}
            <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                            className={`h-full transition-all ${getPasswordStrengthColor(strength.strength)}`}
                            style={{ width: `${strength.score}%` }}
                        />
                    </div>
                </div>
                <span className={`text-sm font-medium ${strength.strength === 'strong' ? 'text-green-600' :
                    strength.strength === 'medium' ? 'text-yellow-600' :
                        'text-red-600'
                    }`}>
                    {getPasswordStrengthText(strength.strength)}
                </span>
            </div>

            {/* Feedback */}
            {showFeedback && strength.feedback.length > 0 && (
                <div className="space-y-1">
                    {strength.feedback.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Success message */}
            {strength.valid && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Password meets requirements</span>
                </div>
            )}
        </div>
    );
}
