import React, { ReactNode } from 'react';

interface ProfessionalCardProps {
  children: ReactNode;
  className?: string;
  glassEffect?: boolean;
  hover?: boolean;
  glow?: 'blue' | 'purple' | 'cyan' | null;
}

/**
 * A professionally styled card component with various effects
 */
const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  children,
  className = '',
  glassEffect = false,
  hover = false,
  glow = null,
}) => {
  // Build the class string based on props
  const baseClasses = 'rounded-lg p-6';
  
  // Glass effect or standard dark card
  const styleClasses = glassEffect 
    ? 'glass-card' 
    : 'bg-professional-dark shadow-professional';
  
  // Add hover effect if requested
  const hoverClasses = hover 
    ? glassEffect 
      ? 'glass-card-hover' 
      : 'hover-lift' 
    : '';
  
  // Add glow effect if requested
  const glowClasses = glow 
    ? `glow-${glow}` 
    : '';
  
  // Combine all classes
  const combinedClasses = `${baseClasses} ${styleClasses} ${hoverClasses} ${glowClasses} ${className}`;
  
  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
};

export default ProfessionalCard;
