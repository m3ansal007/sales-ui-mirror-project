
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ColorContextType {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  updateColors: (colors: Partial<ColorScheme>) => void;
  resetColors: () => void;
}

interface ColorScheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const defaultColors: ColorScheme = {
  primaryColor: 'green',
  secondaryColor: 'slate',
  accentColor: 'blue'
};

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export const ColorProvider = ({ children }: { children: ReactNode }) => {
  const [colors, setColors] = useState<ColorScheme>(defaultColors);

  const updateColors = (newColors: Partial<ColorScheme>) => {
    setColors(prev => ({ ...prev, ...newColors }));
    
    // Apply colors to CSS custom properties
    const root = document.documentElement;
    if (newColors.primaryColor) {
      root.style.setProperty('--primary-color', newColors.primaryColor);
    }
    if (newColors.secondaryColor) {
      root.style.setProperty('--secondary-color', newColors.secondaryColor);
    }
    if (newColors.accentColor) {
      root.style.setProperty('--accent-color', newColors.accentColor);
    }
  };

  const resetColors = () => {
    setColors(defaultColors);
    const root = document.documentElement;
    root.style.setProperty('--primary-color', defaultColors.primaryColor);
    root.style.setProperty('--secondary-color', defaultColors.secondaryColor);
    root.style.setProperty('--accent-color', defaultColors.accentColor);
  };

  return (
    <ColorContext.Provider value={{
      ...colors,
      updateColors,
      resetColors
    }}>
      {children}
    </ColorContext.Provider>
  );
};

export const useColors = () => {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error('useColors must be used within a ColorProvider');
  }
  return context;
};
