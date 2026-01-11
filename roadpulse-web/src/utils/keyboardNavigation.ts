/**
 * Keyboard Navigation Utility
 * Provides keyboard navigation support for map components
 */

import React from 'react';

export interface KeyboardNavigationOptions {
  onArrowKey?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onEnterKey?: () => void;
  onEscapeKey?: () => void;
  onSpaceKey?: () => void;
  onTabKey?: (shiftPressed: boolean) => void;
  onHomeKey?: () => void;
  onEndKey?: () => void;
  onPageUpKey?: () => void;
  onPageDownKey?: () => void;
}

export class KeyboardNavigationManager {
  private focusableElements: HTMLElement[] = [];

  constructor(private container: HTMLElement) {
    this.updateFocusableElements();
  }

  /**
   * Update the list of focusable elements within the container
   */
  updateFocusableElements(): void {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '.leaflet-marker-icon',
      '.cluster-marker',
      '.map-control-button'
    ].join(', ');

    this.focusableElements = Array.from(
      this.container.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];

    // Add custom focusable elements (markers, clusters)
    const markers = this.container.querySelectorAll('.leaflet-marker-icon');
    const clusters = this.container.querySelectorAll('.cluster-marker');
    
    markers.forEach(marker => {
      if (!marker.hasAttribute('tabindex')) {
        marker.setAttribute('tabindex', '0');
        marker.setAttribute('role', 'button');
        marker.setAttribute('aria-label', this.getMarkerAriaLabel(marker as HTMLElement));
      }
    });

    clusters.forEach(cluster => {
      if (!cluster.hasAttribute('tabindex')) {
        cluster.setAttribute('tabindex', '0');
        cluster.setAttribute('role', 'button');
        cluster.setAttribute('aria-label', this.getClusterAriaLabel(cluster as HTMLElement));
      }
    });
  }

  /**
   * Set up keyboard event listeners
   */
  setupKeyboardListeners(options: KeyboardNavigationOptions = {}): () => void {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, shiftKey, ctrlKey, altKey } = event;

      // Don't handle if modifier keys are pressed (except shift for tab)
      if ((ctrlKey || altKey) && key !== 'Tab') {
        return;
      }

      switch (key) {
        case 'ArrowUp':
          event.preventDefault();
          options.onArrowKey?.('up');
          this.handleArrowNavigation('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          options.onArrowKey?.('down');
          this.handleArrowNavigation('down');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          options.onArrowKey?.('left');
          this.handleArrowNavigation('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          options.onArrowKey?.('right');
          this.handleArrowNavigation('right');
          break;
        case 'Enter':
          event.preventDefault();
          options.onEnterKey?.();
          this.handleEnterKey();
          break;
        case 'Escape':
          event.preventDefault();
          options.onEscapeKey?.();
          break;
        case ' ':
          event.preventDefault();
          options.onSpaceKey?.();
          this.handleSpaceKey();
          break;
        case 'Tab':
          options.onTabKey?.(shiftKey);
          this.handleTabNavigation(shiftKey);
          break;
        case 'Home':
          event.preventDefault();
          options.onHomeKey?.();
          this.focusFirst();
          break;
        case 'End':
          event.preventDefault();
          options.onEndKey?.();
          this.focusLast();
          break;
        case 'PageUp':
          event.preventDefault();
          options.onPageUpKey?.();
          break;
        case 'PageDown':
          event.preventDefault();
          options.onPageDownKey?.();
          break;
      }
    };

    this.container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      this.container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Handle arrow key navigation for spatial movement
   */
  private handleArrowNavigation(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.focusableElements.length === 0) {
      this.updateFocusableElements();
    }

    const currentElement = document.activeElement as HTMLElement;
    
    if (!currentElement || !this.focusableElements.includes(currentElement)) {
      // No current focus, focus first element
      this.focusFirst();
      return;
    }

    // For map markers, use spatial navigation
    if (currentElement.classList.contains('leaflet-marker-icon') || 
        currentElement.classList.contains('cluster-marker')) {
      this.handleSpatialNavigation(currentElement, direction);
    } else {
      // For other elements, use sequential navigation
      this.handleSequentialNavigation(direction === 'up' || direction === 'left' ? -1 : 1);
    }
  }

  /**
   * Handle spatial navigation for map markers
   */
  private handleSpatialNavigation(currentElement: HTMLElement, direction: 'up' | 'down' | 'left' | 'right'): void {
    const currentRect = currentElement.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2
    };

    const markers = this.focusableElements.filter(el => 
      el.classList.contains('leaflet-marker-icon') || 
      el.classList.contains('cluster-marker')
    );

    let bestCandidate: HTMLElement | null = null;
    let bestDistance = Infinity;

    markers.forEach(marker => {
      if (marker === currentElement) return;

      const rect = marker.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      // Check if marker is in the correct direction
      let isInDirection = false;
      switch (direction) {
        case 'up':
          isInDirection = center.y < currentCenter.y;
          break;
        case 'down':
          isInDirection = center.y > currentCenter.y;
          break;
        case 'left':
          isInDirection = center.x < currentCenter.x;
          break;
        case 'right':
          isInDirection = center.x > currentCenter.x;
          break;
      }

      if (isInDirection) {
        const distance = Math.sqrt(
          Math.pow(center.x - currentCenter.x, 2) + 
          Math.pow(center.y - currentCenter.y, 2)
        );

        if (distance < bestDistance) {
          bestDistance = distance;
          bestCandidate = marker;
        }
      }
    });

    if (bestCandidate && 'focus' in bestCandidate) {
      (bestCandidate as HTMLElement).focus();
    }
  }

  /**
   * Handle sequential navigation (tab-like behavior)
   */
  private handleSequentialNavigation(direction: number): void {
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = this.focusableElements.indexOf(currentElement);
    
    if (currentIndex === -1) {
      this.focusFirst();
      return;
    }

    const nextIndex = currentIndex + direction;
    
    if (nextIndex >= 0 && nextIndex < this.focusableElements.length) {
      this.focusableElements[nextIndex].focus();
    } else if (direction > 0) {
      this.focusFirst();
    } else {
      this.focusLast();
    }
  }

  /**
   * Handle Enter key activation
   */
  private handleEnterKey(): void {
    const currentElement = document.activeElement as HTMLElement;
    
    if (currentElement) {
      // Trigger click event for interactive elements
      if (currentElement.tagName === 'BUTTON' || 
          currentElement.classList.contains('leaflet-marker-icon') ||
          currentElement.classList.contains('cluster-marker')) {
        currentElement.click();
      }
    }
  }

  /**
   * Handle Space key activation (same as Enter for most elements)
   */
  private handleSpaceKey(): void {
    this.handleEnterKey();
  }

  /**
   * Handle Tab navigation
   */
  private handleTabNavigation(_shiftPressed: boolean): void {
    // Let browser handle default tab behavior, but update our tracking
    setTimeout(() => {
      this.updateCurrentIndex();
    }, 0);
  }

  /**
   * Focus the first focusable element
   */
  focusFirst(): void {
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }

  /**
   * Focus the last focusable element
   */
  focusLast(): void {
    if (this.focusableElements.length > 0) {
      const lastIndex = this.focusableElements.length - 1;
      this.focusableElements[lastIndex].focus();
    }
  }

  /**
   * Update current index based on focused element
   */
  private updateCurrentIndex(): void {
    const currentElement = document.activeElement as HTMLElement;
    this.focusableElements.indexOf(currentElement);
  }

  /**
   * Get ARIA label for marker elements
   */
  private getMarkerAriaLabel(marker: HTMLElement): string {
    // Try to extract severity and other info from marker classes or data attributes
    const severityMatch = marker.className.match(/severity-(\d)/);
    const severity = severityMatch ? severityMatch[1] : 'unknown';
    
    return `Road anomaly marker, severity level ${severity}. Press Enter to view details.`;
  }

  /**
   * Get ARIA label for cluster elements
   */
  private getClusterAriaLabel(cluster: HTMLElement): string {
    // Try to extract count from cluster text content
    const countText = cluster.textContent?.trim() || '';
    const count = countText.match(/\d+/)?.[0] || 'multiple';
    
    return `Cluster of ${count} road anomalies. Press Enter to expand cluster.`;
  }

  /**
   * Set focus trap for modal dialogs
   */
  setFocusTrap(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabTrap = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    element.addEventListener('keydown', handleTabTrap);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabTrap);
    };
  }
}

/**
 * Hook for using keyboard navigation in React components
 */
export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) => {
  const [manager, setManager] = React.useState<KeyboardNavigationManager | null>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      const navigationManager = new KeyboardNavigationManager(containerRef.current);
      setManager(navigationManager);

      const cleanup = navigationManager.setupKeyboardListeners(options);

      return () => {
        cleanup();
        setManager(null);
      };
    }
  }, [containerRef.current, options]);

  React.useEffect(() => {
    if (manager) {
      // Update focusable elements when markers change
      const updateInterval = setInterval(() => {
        manager.updateFocusableElements();
      }, 1000);

      return () => clearInterval(updateInterval);
    }
  }, [manager]);

  return manager;
};