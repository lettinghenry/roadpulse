/**
 * Responsive utilities for handling different screen sizes and device types
 */
import React from 'react';

export interface BreakpointConfig {
  mobile: string;
  tablet: string;
  desktop: string;
}

export interface ResponsiveConfig {
  mobile: {
    clusterRadius: number;
    popupMaxWidth: string;
    controlsPosition: 'bottom' | 'top-right';
    touchOptimized: boolean;
  };
  tablet: {
    clusterRadius: number;
    popupMaxWidth: string;
    controlsPosition: 'bottom' | 'top-right';
    touchOptimized: boolean;
  };
  desktop: {
    clusterRadius: number;
    popupMaxWidth: string;
    controlsPosition: 'bottom' | 'top-right';
    touchOptimized: boolean;
  };
}

// Breakpoint definitions
export const breakpoints: BreakpointConfig = {
  mobile: '0-767px',
  tablet: '768-1023px', 
  desktop: '1024px+'
};

// Responsive configuration for different screen sizes
export const responsiveConfig: ResponsiveConfig = {
  mobile: {
    clusterRadius: 40,
    popupMaxWidth: '90vw',
    controlsPosition: 'bottom',
    touchOptimized: true
  },
  tablet: {
    clusterRadius: 50,
    popupMaxWidth: '400px',
    controlsPosition: 'top-right',
    touchOptimized: true
  },
  desktop: {
    clusterRadius: 60,
    popupMaxWidth: '500px',
    controlsPosition: 'top-right',
    touchOptimized: false
  }
};

// Device type detection
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function getDeviceType(): DeviceType {
  const width = window.innerWidth;
  
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

// Touch device detection
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Mobile device detection (more comprehensive)
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
         window.innerWidth < 768 || 
         isTouchDevice();
}

// Get responsive configuration for current device
export function getCurrentResponsiveConfig() {
  const deviceType = getDeviceType();
  return responsiveConfig[deviceType];
}

// Media query helpers
export function createMediaQuery(minWidth?: number, maxWidth?: number): string {
  const conditions: string[] = [];
  
  if (minWidth) {
    conditions.push(`(min-width: ${minWidth}px)`);
  }
  
  if (maxWidth) {
    conditions.push(`(max-width: ${maxWidth}px)`);
  }
  
  return conditions.join(' and ');
}

// Hook for responsive behavior
export function useResponsive() {
  const [deviceType, setDeviceType] = React.useState<DeviceType>(getDeviceType());
  const [isTouchEnabled, setIsTouchEnabled] = React.useState(isTouchDevice());
  
  React.useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
      setIsTouchEnabled(isTouchDevice());
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  
  return {
    deviceType,
    isTouchEnabled,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    config: responsiveConfig[deviceType]
  };
}

// Viewport size utilities
export function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

// Safe area utilities for mobile devices with notches
export function getSafeAreaInsets() {
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10)
  };
}

// CSS custom properties for responsive design
export function setCSSCustomProperties() {
  const root = document.documentElement;
  const config = getCurrentResponsiveConfig();
  const viewport = getViewportSize();
  
  root.style.setProperty('--cluster-radius', `${config.clusterRadius}px`);
  root.style.setProperty('--popup-max-width', config.popupMaxWidth);
  root.style.setProperty('--viewport-width', `${viewport.width}px`);
  root.style.setProperty('--viewport-height', `${viewport.height}px`);
  root.style.setProperty('--is-touch-device', isTouchDevice() ? '1' : '0');
}

// Initialize responsive system
export function initializeResponsiveSystem() {
  setCSSCustomProperties();
  
  // Update on resize and orientation change
  const updateProperties = () => {
    setCSSCustomProperties();
  };
  
  window.addEventListener('resize', updateProperties);
  window.addEventListener('orientationchange', updateProperties);
  
  return () => {
    window.removeEventListener('resize', updateProperties);
    window.removeEventListener('orientationchange', updateProperties);
  };
}