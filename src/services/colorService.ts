
export interface ColorChangeRequest {
  action: 'change_colors';
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

export const parseColorRequest = (message: string): ColorChangeRequest | null => {
  const colorKeywords = ['color', 'colors', 'theme', 'change', 'update'];
  const hasColorKeyword = colorKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );

  if (!hasColorKeyword) return null;

  // Extract color mentions
  const colorMap: { [key: string]: string } = {
    'red': 'red',
    'blue': 'blue',
    'green': 'green',
    'purple': 'purple',
    'yellow': 'yellow',
    'orange': 'orange',
    'pink': 'pink',
    'indigo': 'indigo',
    'teal': 'teal',
    'cyan': 'cyan',
    'lime': 'lime',
    'emerald': 'emerald',
    'violet': 'violet',
    'fuchsia': 'fuchsia',
    'rose': 'rose',
    'amber': 'amber'
  };

  const extractedColors: { [key: string]: string } = {};
  
  for (const [colorName, colorValue] of Object.entries(colorMap)) {
    if (message.toLowerCase().includes(colorName)) {
      if (message.toLowerCase().includes('primary')) {
        extractedColors.primary = colorValue;
      } else if (message.toLowerCase().includes('secondary')) {
        extractedColors.secondary = colorValue;
      } else if (message.toLowerCase().includes('accent')) {
        extractedColors.accent = colorValue;
      } else {
        // Default to primary if no specific type mentioned
        extractedColors.primary = colorValue;
      }
    }
  }

  if (Object.keys(extractedColors).length > 0) {
    return {
      action: 'change_colors',
      colors: extractedColors
    };
  }

  return null;
};

export const applyColorChange = (
  colorRequest: ColorChangeRequest,
  updateColors: (colors: any) => void
): string => {
  const { colors } = colorRequest;
  
  updateColors({
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent
  });

  const changedColors = Object.entries(colors)
    .map(([type, color]) => `${type} to ${color}`)
    .join(', ');

  return `I've updated the UI colors: ${changedColors}. The changes should be visible immediately!`;
};
