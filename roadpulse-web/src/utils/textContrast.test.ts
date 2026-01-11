/**
 * Text Contrast Utility Tests
 * Validates WCAG 2.1 AA compliance for text contrast ratios
 */

import { describe, it, expect } from 'vitest';
import { TextContrastManager, checkTextContrast, validateSeverityColors } from './textContrast';

describe('TextContrastManager', () => {
  describe('hexToRgb', () => {
    it('should convert hex colors to RGB correctly', () => {
      expect(TextContrastManager.hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(TextContrastManager.hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(TextContrastManager.hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(TextContrastManager.hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should return null for invalid hex colors', () => {
      expect(TextContrastManager.hexToRgb('invalid')).toBeNull();
      expect(TextContrastManager.hexToRgb('#gggggg')).toBeNull();
      expect(TextContrastManager.hexToRgb('')).toBeNull();
    });
  });

  describe('getRelativeLuminance', () => {
    it('should calculate correct luminance for white', () => {
      const white = { r: 255, g: 255, b: 255 };
      expect(TextContrastManager.getRelativeLuminance(white)).toBeCloseTo(1, 2);
    });

    it('should calculate correct luminance for black', () => {
      const black = { r: 0, g: 0, b: 0 };
      expect(TextContrastManager.getRelativeLuminance(black)).toBeCloseTo(0, 2);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate maximum contrast ratio for black on white', () => {
      const black = { r: 0, g: 0, b: 0 };
      const white = { r: 255, g: 255, b: 255 };
      const ratio = TextContrastManager.getContrastRatio(black, white);
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate minimum contrast ratio for same colors', () => {
      const color = { r: 128, g: 128, b: 128 };
      const ratio = TextContrastManager.getContrastRatio(color, color);
      expect(ratio).toBeCloseTo(1, 2);
    });
  });

  describe('checkContrast', () => {
    it('should pass WCAG AA for high contrast combinations', () => {
      const result = checkTextContrast('#000000', '#ffffff');
      expect(result.isCompliant).toBe(true);
      expect(result.level).toBe('AAA');
      expect(result.ratio).toBeGreaterThan(7);
    });

    it('should fail WCAG AA for low contrast combinations', () => {
      const result = checkTextContrast('#888888', '#999999');
      expect(result.isCompliant).toBe(false);
      expect(result.level).toBe('fail');
      expect(result.recommendation).toBeDefined();
    });

    it('should handle large text requirements correctly', () => {
      // A combination that passes AA large (3:1) but not AA normal (4.5:1)
      const result = checkTextContrast('#8a8a8a', '#ffffff', true);
      expect(result.ratio).toBeGreaterThanOrEqual(3);
      expect(result.ratio).toBeLessThan(4.5);
      expect(result.isCompliant).toBe(true); // Should pass for large text
      
      // Same color should fail for normal text
      const normalResult = checkTextContrast('#8a8a8a', '#ffffff', false);
      expect(normalResult.isCompliant).toBe(false);
    });

    it('should handle invalid colors gracefully', () => {
      const result = checkTextContrast('invalid', '#ffffff');
      expect(result.isCompliant).toBe(false);
      expect(result.level).toBe('fail');
      expect(result.recommendation).toContain('Invalid color format');
    });
  });

  describe('validateSeverityColors', () => {
    it('should validate all severity colors meet WCAG AA standards', () => {
      const results = validateSeverityColors();
      
      // All severity colors should be compliant when used with white background
      Object.values(results).forEach(result => {
        expect(result.isCompliant).toBe(true);
        expect(result.ratio).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should have proper severity color progression', () => {
      const results = validateSeverityColors();
      
      // Ensure we have results for all 5 severity levels
      expect(Object.keys(results)).toHaveLength(5);
      expect(results[1]).toBeDefined();
      expect(results[2]).toBeDefined();
      expect(results[3]).toBeDefined();
      expect(results[4]).toBeDefined();
      expect(results[5]).toBeDefined();
    });
  });

  describe('generateAccessiblePalette', () => {
    it('should generate a complete accessible color palette', () => {
      const palette = TextContrastManager.generateAccessiblePalette();
      
      expect(palette.critical).toBeDefined();
      expect(palette.primary).toBeDefined();
      expect(palette.secondary).toBeDefined();
      expect(palette.interactive).toBeDefined();
      expect(palette.success).toBeDefined();
      expect(palette.warning).toBeDefined();
      expect(palette.error).toBeDefined();
      expect(palette.darkPrimary).toBeDefined();
      expect(palette.darkSecondary).toBeDefined();
    });

    it('should have proper structure for each palette entry', () => {
      const palette = TextContrastManager.generateAccessiblePalette();
      
      Object.values(palette).forEach(entry => {
        expect(entry.color).toBeDefined();
        expect(entry.background).toBeDefined();
        expect(entry.usage).toBeDefined();
        expect(typeof entry.color).toBe('string');
        expect(typeof entry.background).toBe('string');
        expect(typeof entry.usage).toBe('string');
      });
    });
  });

  describe('getFontSizeRecommendations', () => {
    it('should provide comprehensive font size recommendations', () => {
      const recommendations = TextContrastManager.getFontSizeRecommendations();
      
      expect(recommendations.small).toBeDefined();
      expect(recommendations.body).toBeDefined();
      expect(recommendations.large).toBeDefined();
      expect(recommendations.h1).toBeDefined();
      expect(recommendations.h2).toBeDefined();
      expect(recommendations.h3).toBeDefined();
      expect(recommendations.button).toBeDefined();
      expect(recommendations.mobileBody).toBeDefined();
      expect(recommendations.mobileButton).toBeDefined();
    });

    it('should have proper structure for font recommendations', () => {
      const recommendations = TextContrastManager.getFontSizeRecommendations();
      
      Object.values(recommendations).forEach(rec => {
        expect(rec.size).toBeDefined();
        expect(rec.lineHeight).toBeDefined();
        expect(rec.usage).toBeDefined();
        expect(rec.size).toMatch(/^\d+px$/);
        expect(parseFloat(rec.lineHeight)).toBeGreaterThan(1);
      });
    });
  });

  describe('checkTouchTargetSize', () => {
    it('should pass for WCAG compliant touch targets', () => {
      const result = TextContrastManager.checkTouchTargetSize(44, 44);
      expect(result.isCompliant).toBe(true);
      expect(result.recommendation).toBeUndefined();
    });

    it('should fail for too small touch targets', () => {
      const result = TextContrastManager.checkTouchTargetSize(30, 30);
      expect(result.isCompliant).toBe(false);
      expect(result.recommendation).toBeDefined();
      expect(result.recommendation).toContain('44x44 pixels');
    });

    it('should pass for rectangular targets that meet minimum size', () => {
      const result = TextContrastManager.checkTouchTargetSize(44, 50);
      expect(result.isCompliant).toBe(true);
    });
  });

  describe('generateAccessibleCSS', () => {
    it('should generate valid CSS custom properties', () => {
      const css = TextContrastManager.generateAccessibleCSS();
      
      expect(css).toContain(':root {');
      expect(css).toContain('--color-');
      expect(css).toContain('--bg-');
      expect(css).toContain('--font-size-');
      expect(css).toContain('--line-height-');
      expect(css).toContain('--focus-outline-');
      expect(css).toContain('--touch-target-min');
      expect(css).toContain('}');
    });

    it('should include all necessary CSS properties', () => {
      const css = TextContrastManager.generateAccessibleCSS();
      
      // Check for color properties
      expect(css).toContain('--color-critical');
      expect(css).toContain('--color-primary');
      expect(css).toContain('--color-interactive');
      
      // Check for font properties
      expect(css).toContain('--font-size-body');
      expect(css).toContain('--line-height-body');
      
      // Check for accessibility properties
      expect(css).toContain('--focus-outline-color');
      expect(css).toContain('--touch-target-min');
    });
  });
});

describe('Integration Tests', () => {
  it('should validate that all severity colors meet accessibility standards', () => {
    const severityColors = {
      1: '#166534', // Green-800
      2: '#92400e', // Amber-800
      3: '#c2410c', // Orange-700
      4: '#991b1b', // Red-800
      5: '#7f1d1d'  // Red-900
    };

    Object.entries(severityColors).forEach(([, color]) => {
      const result = checkTextContrast(color, '#ffffff');
      expect(result.isCompliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('should validate accessible palette colors meet WCAG standards', () => {
    const palette = TextContrastManager.generateAccessiblePalette();
    
    Object.entries(palette).forEach(([, { color, background }]) => {
      const result = checkTextContrast(color, background);
      expect(result.isCompliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('should ensure dark theme colors meet accessibility standards', () => {
    const darkCombinations = [
      { fg: '#f9fafb', bg: '#111827' }, // Gray-50 on Gray-900
      { fg: '#d1d5db', bg: '#111827' }, // Gray-300 on Gray-900
      { fg: '#9ca3af', bg: '#111827' }  // Gray-400 on Gray-900
    ];

    darkCombinations.forEach(({ fg, bg }) => {
      const result = checkTextContrast(fg, bg);
      expect(result.isCompliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});