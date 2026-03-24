import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'professional';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setProfessionalTheme: () => void;
  isProfessional: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Force professional dark theme as default - always start with dark theme
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    // Only use saved theme if it's dark or professional, otherwise force professional
    if (savedTheme === 'dark' || savedTheme === 'professional') {
      return savedTheme;
    }
    // Always default to professional dark theme
    localStorage.setItem('theme', 'professional');
    return 'professional';
  });

  // Effect to update the HTML class when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    // Remove all theme classes first
    root.classList.remove('light', 'dark', 'professional');
    body.classList.remove(
      'bg-white',
      'bg-gray-950',
      'bg-professional-dark-gradient',
      'bg-professional-deep-blue',
      'bg-mesh-dark'
    );

    // Clear any inline styles that might be interfering
    body.style.backgroundColor = '';
    body.style.background = '';

    // Apply theme classes and backgrounds
    if (theme === 'professional') {
      root.classList.add('dark', 'professional');
      // Apply professional dark gradient background
      body.style.background = 'linear-gradient(135deg, #0c1222 0%, #153366 100%)';
      body.classList.add('bg-professional-deep-blue', 'bg-mesh-dark');

      // Add professional mesh pattern if not exists
      let patternDiv = document.getElementById('professional-bg-pattern');
      if (!patternDiv) {
        patternDiv = document.createElement('div');
        patternDiv.id = 'professional-bg-pattern';
        patternDiv.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          pointer-events: none;
          background-image: 
            radial-gradient(at 21% 33%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
            radial-gradient(at 79% 76%, rgba(139, 92, 246, 0.15) 0px, transparent 50%);
        `;
        body.appendChild(patternDiv);
      }
    } else if (theme === 'dark') {
      root.classList.add('dark');
      // Apply dark theme background
      body.style.background = 'linear-gradient(135deg, hsl(225, 32%, 7%) 0%, hsl(229, 35%, 10%) 100%)';
      body.classList.add('bg-gray-950');

      // Remove professional pattern if exists
      const patternDiv = document.getElementById('professional-bg-pattern');
      if (patternDiv) patternDiv.remove();
    } else {
      // Light theme
      root.classList.add('light');
      body.style.backgroundColor = 'hsl(0, 0%, 100%)';
      body.classList.add('bg-white');

      // Remove professional pattern if exists
      const patternDiv = document.getElementById('professional-bg-pattern');
      if (patternDiv) patternDiv.remove();
    }

    // Apply theme to the meta color-scheme for browser UI
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content',
        theme === 'light' ? '#ffffff' :
          theme === 'dark' ? '#1e293b' :
            '#0c1222'
      );
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = theme === 'light' ? '#ffffff' :
        theme === 'dark' ? '#1e293b' :
          '#0c1222';
      document.head.appendChild(meta);
    }

    // Apply theme to the color-scheme meta tag
    const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaColorScheme) {
      metaColorScheme.setAttribute('content', theme === 'light' ? 'light' : 'dark');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'color-scheme';
      meta.content = theme === 'light' ? 'light' : 'dark';
      document.head.appendChild(meta);
    }

    // Store theme in localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle through all three themes
  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'professional';
      return 'light';
    });
  };

  // Set professional theme
  const setProfessionalTheme = () => {
    setTheme('professional');
  };

  // Check if current theme is professional
  const isProfessional = theme === 'professional';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setProfessionalTheme, isProfessional }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for consuming the theme context
// Custom hook for consuming the theme context - SAFE VERSION
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return fallback context instead of throwing to prevent crashes
    return {
      theme: 'professional',
      toggleTheme: () => { },
      setProfessionalTheme: () => { },
      isProfessional: true
    };
  }
  return context;
};
