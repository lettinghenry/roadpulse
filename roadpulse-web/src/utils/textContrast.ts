/**
 * Text Contrast and Readability Utility
 * Ensures WCAG 2.1 AA compliance for text contrast ratios
 */

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface ContrastResult {
  ratio: number;
  isCompliant: boolean;
  level: 'AA' | 'AAA' | 'fail';
  recommendation?: string;
}

export class TextContrastManager {
  // WCAG 2.1 contrast ratio requirements
  private static readonly AA_NORMAL = 4.5;
  private static readonly AA_LARGE = 3.0;
  private static readonly AAA_NORMAL = 7.0;
  private static readonly AAA_LARGE = 4.5;

  /**
   * Convert hex color to RGB
   */
  static hexToRgb(hex: string): ColorRGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Calculate relative luminance of a color
   */
  static getRelativeLuminance(color: ColorRGB): number {
    const { r, g, b } = color;
    
    // Convert to sRGB
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    // Apply gamma correction
    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    // Calculate relative luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: ColorRGB, color2: ColorRGB): number {
    const lum1 = this.getRelativeLuminance(color1);
    const lum2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG requirements
   */
  static checkContrast(
    foreground: string, 
    background: string, 
    isLargeText: boolean = false
  ): ContrastResult {
    const fgColor = TextContrastManager.hexToRgb(foreground);
    const bgColor = TextContrastManager.hexToRgb(background);

    if (!fgColor || !bgColor) {
      return {
        ratio: 0,
        isCompliant: false,
        level: 'fail',
        recommendation: 'Invalid color format provided'
      };
    }

    const ratio = TextContrastManager.getContrastRatio(fgColor, bgColor);
    const aaThreshold = isLargeText ? TextContrastManager.AA_LARGE : TextContrastManager.AA_NORMAL;
    const aaaThreshold = isLargeText ? TextContrastManager.AAA_LARGE : TextContrastManager.AAA_NORMAL;

    let level: 'AA' | 'AAA' | 'fail';
    let isCompliant: boolean;
    let recommendation: string | undefined;

    if (ratio >= aaaThreshold) {
      level = 'AAA';
      isCompliant = true;
    } else if (ratio >= aaThreshold) {
      level = 'AA';
      isCompliant = true;
    } else {
      level = 'fail';
      isCompliant = false;
      recommendation = TextContrastManager.getContrastRecommendation(ratio, aaThreshold, isLargeText);
    }

    return {
      ratio: Math.round(ratio * 100) / 100,
      isCompliant,
      level,
      recommendation
    };
  }

  /**
   * Get recommendation for improving contrast
   */
  private static getContrastRecommendation(
    currentRatio: number, 
    targetRatio: number, 
    isLargeText: boolean
  ): string {
    const textSize = isLargeText ? 'large text' : 'normal text';
    const needed = Math.round((targetRatio - currentRatio) * 100) / 100;
    
    return `Current ratio ${currentRatio.toFixed(2)} is below the ${targetRatio} requirement for ${textSize}. ` +
           `Increase contrast by ${needed.toFixed(2)} to meet WCAG AA standards.`;
  }

  /**
   * Generate accessible color palette
   */
  static generateAccessiblePalette(): Record<string, { color: string; background: string; usage: string }> {
    return {
      // High contrast combinations for critical text
      critical: {
        color: '#000000',
        background: '#ffffff',
        usage: 'Critical information, error messages'
      },
      
      // Primary text combinations
      primary: {
        color: '#1f2937', // Gray-800
        background: '#ffffff',
        usage: 'Primary body text, headings'
      },
      
      // Secondary text combinations
      secondary: {
        color: '#4b5563', // Gray-600
        background: '#ffffff',
        usage: 'Secondary text, descriptions'
      },
      
      // Interactive elements
      interactive: {
        color: '#1d4ed8', // Blue-700
        background: '#ffffff',
        usage: 'Links, interactive elements'
      },
      
      // Success states
      success: {
        color: '#166534', // Green-800
        background: '#f0fdf4', // Green-50
        usage: 'Success messages, positive states'
      },
      
      // Warning states
      warning: {
        color: '#92400e', // Amber-800
        background: '#fffbeb', // Amber-50
        usage: 'Warning messages, caution states'
      },
      
      // Error states
      error: {
        color: '#991b1b', // Red-800
        background: '#fef2f2', // Red-50
        usage: 'Error messages, critical alerts'
      },
      
      // Dark theme combinations
      darkPrimary: {
        color: '#f9fafb', // Gray-50
        background: '#111827', // Gray-900
        usage: 'Dark theme primary text'
      },
      
      darkSecondary: {
        color: '#d1d5db', // Gray-300
        background: '#111827', // Gray-900
        usage: 'Dark theme secondary text'
      }
    };
  }

  /**
   * Validate severity color accessibility
   */
  static validateSeverityColors(): Record<number, ContrastResult> {
    const severityColors = {
      1: '#166534', // Green-800 - accessible version
      2: '#92400e', // Amber-800 - accessible version
      3: '#c2410c', // Orange-700 - accessible version
      4: '#991b1b', // Red-800 - accessible version
      5: '#7f1d1d'  // Red-900 - accessible version
    };

    const results: Record<number, ContrastResult> = {};
    
    Object.entries(severityColors).forEach(([severity, color]) => {
      // Check against white background (most common)
      results[parseInt(severity)] = TextContrastManager.checkContrast(color, '#ffffff', false);
    });

    return results;
  }

  /**
   * Get font size recommendations for accessibility
   */
  static getFontSizeRecommendations(): Record<string, { size: string; lineHeight: string; usage: string }> {
    return {
      // Minimum readable sizes
      small: {
        size: '14px',
        lineHeight: '1.5',
        usage: 'Minimum size for body text, captions'
      },
      
      // Standard body text
      body: {
        size: '16px',
        lineHeight: '1.6',
        usage: 'Standard body text, paragraphs'
      },
      
      // Large text (better for accessibility)
      large: {
        size: '18px',
        lineHeight: '1.6',
        usage: 'Large body text, improved readability'
      },
      
      // Headings
      h3: {
        size: '20px',
        lineHeight: '1.4',
        usage: 'Section headings, subheadings'
      },
      
      h2: {
        size: '24px',
        lineHeight: '1.3',
        usage: 'Major headings, page sections'
      },
      
      h1: {
        size: '32px',
        lineHeight: '1.2',
        usage: 'Page titles, main headings'
      },
      
      // Interactive elements
      button: {
        size: '16px',
        lineHeight: '1.5',
        usage: 'Button text, interactive elements'
      },
      
      // Mobile optimized
      mobileBody: {
        size: '16px',
        lineHeight: '1.6',
        usage: 'Mobile body text (prevents zoom)'
      },
      
      mobileButton: {
        size: '18px',
        lineHeight: '1.4',
        usage: 'Mobile button text (better touch targets)'
      }
    };
  }

  /**
   * Check if element meets touch target size requirements
   */
  static checkTouchTargetSize(width: number, height: number): {
    isCompliant: boolean;
    recommendation?: string;
  } {
    const minSize = 44; // WCAG minimum touch target size in pixels
    
    if (width >= minSize && height >= minSize) {
      return { isCompliant: true };
    }
    
    return {
      isCompliant: false,
      recommendation: `Touch target should be at least ${minSize}x${minSize} pixels. Current size: ${width}x${height} pixels.`
    };
  }

  /**
   * Generate CSS custom properties for accessible colors
   */
  static generateAccessibleCSS(): string {
    const palette = this.generateAccessiblePalette();
    const fontSizes = this.getFontSizeRecommendations();
    
    let css = ':root {\n';
    
    // Color properties
    Object.entries(palette).forEach(([name, { color, background }]) => {
      css += `  --color-${name}: ${color};\n`;
      css += `  --bg-${name}: ${background};\n`;
    });
    
    // Font size properties
    Object.entries(fontSizes).forEach(([name, { size, lineHeight }]) => {
      css += `  --font-size-${name}: ${size};\n`;
      css += `  --line-height-${name}: ${lineHeight};\n`;
    });
    
    // Spacing properties for better readability
    css += `
  /* Spacing for readability */
  --spacing-text-xs: 0.25rem;
  --spacing-text-sm: 0.5rem;
  --spacing-text-md: 0.75rem;
  --spacing-text-lg: 1rem;
  --spacing-text-xl: 1.5rem;
  
  /* Focus outline properties */
  --focus-outline-width: 2px;
  --focus-outline-color: #3b82f6;
  --focus-outline-offset: 2px;
  
  /* Touch target minimum size */
  --touch-target-min: 44px;
`;
    
    css += '}\n';
    
    return css;
  }
}

// Export commonly used contrast checking function
export const checkTextContrast = TextContrastManager.checkContrast;
export const validateSeverityColors = TextContrastManager.validateSeverityColors;
export const generateAccessibleCSS = TextContrastManager.generateAccessibleCSS;