import React from 'react';
import { useEffect } from 'react';

/**
 * This component enables professional dark mode by default
 * and adds our professional UI classes to the document
 */
const ProfessionalTheme: React.FC = () => {
  useEffect(() => {
    // Light mode for professional appearance
    document.documentElement.classList.remove('dark');
    
    // Apply professional background with gradient and subtle pattern to body
    document.body.classList.add('bg-professional-deep-blue');
    document.body.classList.add('bg-mesh-dark');
    
    // Add subtle grid pattern to the background
    const createBackgroundElements = () => {
      // Create the background pattern container
      const patternContainer = document.createElement('div');
      patternContainer.id = 'professional-bg-pattern';
      patternContainer.style.position = 'fixed';
      patternContainer.style.top = '0';
      patternContainer.style.left = '0';
      patternContainer.style.width = '100%';
      patternContainer.style.height = '100%';
      patternContainer.style.zIndex = '-1';
      patternContainer.style.pointerEvents = 'none';
      patternContainer.style.overflow = 'hidden';
      
      // Add subtle aurora effect
      const aurora = document.createElement('div');
      aurora.style.position = 'absolute';
      aurora.style.top = '0';
      aurora.style.left = '0';
      aurora.style.width = '100%';
      aurora.style.height = '100%';
      aurora.style.background = 'radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)';
      aurora.style.opacity = '0.6';
      patternContainer.appendChild(aurora);
      
      document.body.appendChild(patternContainer);
    };
    
    // Add additional professional styling
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.classList.add('text-slate-50');
      mainElement.classList.add('custom-scrollbar');
    }
    
    // Apply custom scrollbar to document
    document.documentElement.classList.add('custom-scrollbar');
    
    // Create background elements
    createBackgroundElements();
    
    // Clean up function
    return () => {
      // Keep light mode
      document.body.classList.remove('bg-professional-deep-blue');
      document.body.classList.remove('bg-mesh-dark');
      
      if (mainElement) {
        mainElement.classList.remove('text-slate-50');
        mainElement.classList.remove('custom-scrollbar');
      }
      
      document.documentElement.classList.remove('custom-scrollbar');
      
      // Remove background pattern
      const patternElement = document.getElementById('professional-bg-pattern');
      if (patternElement) {
        patternElement.remove();
      }
    };
  }, []);
  
  return null;
};

export default ProfessionalTheme;
