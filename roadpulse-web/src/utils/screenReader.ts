/**
 * Screen Reader Accessibility Utility
 * Provides utilities for screen reader support and ARIA management
 */

export interface AriaLiveRegionOptions {
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export class ScreenReaderManager {
  private liveRegions: Map<string, HTMLElement> = new Map();
  private announcements: string[] = [];
  private isAnnouncing = false;

  constructor() {
    this.createDefaultLiveRegions();
  }

  /**
   * Create default live regions for common announcements
   */
  private createDefaultLiveRegions(): void {
    // Polite announcements (non-urgent)
    this.createLiveRegion('polite', {
      politeness: 'polite',
      atomic: true
    });

    // Assertive announcements (urgent)
    this.createLiveRegion('assertive', {
      politeness: 'assertive',
      atomic: true
    });

    // Status announcements (for loading states, etc.)
    this.createLiveRegion('status', {
      politeness: 'polite',
      atomic: false,
      relevant: 'text'
    });
  }

  /**
   * Create a live region for screen reader announcements
   */
  createLiveRegion(id: string, options: AriaLiveRegionOptions = {}): HTMLElement {
    const existingRegion = this.liveRegions.get(id);
    if (existingRegion) {
      return existingRegion;
    }

    const region = document.createElement('div');
    region.id = `aria-live-${id}`;
    region.setAttribute('aria-live', options.politeness || 'polite');
    region.setAttribute('aria-atomic', String(options.atomic !== false));
    
    if (options.relevant) {
      region.setAttribute('aria-relevant', options.relevant);
    }

    // Hide visually but keep accessible to screen readers
    region.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;

    document.body.appendChild(region);
    this.liveRegions.set(id, region);

    return region;
  }

  /**
   * Announce text to screen readers
   */
  announce(text: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!text.trim()) return;

    const region = this.liveRegions.get(priority);
    if (region) {
      // Clear previous content and set new content
      region.textContent = '';
      setTimeout(() => {
        region.textContent = text;
      }, 100);
    }
  }

  /**
   * Announce status updates (loading, filtering, etc.)
   */
  announceStatus(status: string): void {
    const region = this.liveRegions.get('status');
    if (region) {
      region.textContent = status;
    }
  }

  /**
   * Queue multiple announcements to avoid overwhelming screen readers
   */
  queueAnnouncement(text: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.announcements.push(text);
    
    if (!this.isAnnouncing) {
      this.processAnnouncementQueue(priority);
    }
  }

  /**
   * Process queued announcements with delays
   */
  private async processAnnouncementQueue(priority: 'polite' | 'assertive'): Promise<void> {
    this.isAnnouncing = true;

    while (this.announcements.length > 0) {
      const announcement = this.announcements.shift();
      if (announcement) {
        this.announce(announcement, priority);
        // Wait between announcements to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    this.isAnnouncing = false;
  }

  /**
   * Clear all live regions
   */
  clearAnnouncements(): void {
    this.liveRegions.forEach(region => {
      region.textContent = '';
    });
    this.announcements = [];
  }

  /**
   * Generate descriptive text for map viewport
   */
  describeMapViewport(viewport: { center: { lat: number; lng: number }; zoom: number }): string {
    const { center, zoom } = viewport;
    const lat = center.lat.toFixed(4);
    const lng = center.lng.toFixed(4);
    
    let zoomDescription = '';
    if (zoom < 8) {
      zoomDescription = 'very zoomed out, showing large area';
    } else if (zoom < 12) {
      zoomDescription = 'moderately zoomed, showing city level';
    } else if (zoom < 15) {
      zoomDescription = 'zoomed in, showing neighborhood level';
    } else {
      zoomDescription = 'very zoomed in, showing street level';
    }

    return `Map centered at latitude ${lat}, longitude ${lng}, ${zoomDescription}`;
  }

  /**
   * Generate descriptive text for anomaly events
   */
  describeAnomalyEvents(events: Array<{ severity: number; createdAt: Date }>): string {
    if (events.length === 0) {
      return 'No road anomalies visible in current area';
    }

    const severityCounts = events.reduce((counts, event) => {
      counts[event.severity] = (counts[event.severity] || 0) + 1;
      return counts;
    }, {} as Record<number, number>);

    const descriptions = [];
    
    for (let severity = 5; severity >= 1; severity--) {
      const count = severityCounts[severity];
      if (count) {
        const severityName = this.getSeverityName(severity);
        descriptions.push(`${count} ${severityName} severity`);
      }
    }

    const total = events.length;
    const summary = descriptions.length > 1 
      ? `${total} road anomalies: ${descriptions.join(', ')}`
      : `${total} road ${total === 1 ? 'anomaly' : 'anomalies'} with ${descriptions[0]}`;

    return `${summary} visible in current map area`;
  }

  /**
   * Generate descriptive text for clusters
   */
  describeCluster(eventCount: number, maxSeverity: number): string {
    const severityName = this.getSeverityName(maxSeverity);
    return `Cluster containing ${eventCount} road anomalies, highest severity is ${severityName} level ${maxSeverity}`;
  }

  /**
   * Generate descriptive text for filters
   */
  describeActiveFilters(filters: {
    severityLevels: number[];
    dateRange: { start: Date; end: Date };
    confidenceThreshold: number;
  }): string {
    const descriptions = [];

    if (filters.severityLevels.length < 5) {
      const levels = filters.severityLevels.sort().join(', ');
      descriptions.push(`severity levels ${levels}`);
    }

    if (filters.confidenceThreshold > 0) {
      descriptions.push(`confidence above ${(filters.confidenceThreshold * 100).toFixed(0)}%`);
    }

    const daysDiff = Math.ceil(
      (filters.dateRange.end.getTime() - filters.dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff < 365) {
      descriptions.push(`last ${daysDiff} days`);
    }

    return descriptions.length > 0 
      ? `Filters active: ${descriptions.join(', ')}`
      : 'No filters active, showing all data';
  }

  /**
   * Get human-readable severity name
   */
  private getSeverityName(severity: number): string {
    const names = {
      1: 'minor',
      2: 'moderate',
      3: 'significant',
      4: 'major',
      5: 'severe'
    };
    return names[severity as keyof typeof names] || 'unknown';
  }

  /**
   * Generate ARIA label for interactive elements
   */
  generateAriaLabel(element: {
    type: 'marker' | 'cluster' | 'control' | 'filter';
    severity?: number;
    eventCount?: number;
    controlName?: string;
    filterType?: string;
    isActive?: boolean;
  }): string {
    switch (element.type) {
      case 'marker':
        const severityName = element.severity ? this.getSeverityName(element.severity) : 'unknown';
        return `Road anomaly marker, ${severityName} severity level ${element.severity}. Press Enter or Space to view details.`;
      
      case 'cluster':
        return `Cluster of ${element.eventCount} road anomalies. Press Enter or Space to expand and view individual markers.`;
      
      case 'control':
        return `${element.controlName} control. Press Enter or Space to activate.`;
      
      case 'filter':
        const status = element.isActive ? 'active' : 'inactive';
        return `${element.filterType} filter, currently ${status}. Press Enter or Space to toggle.`;
      
      default:
        return 'Interactive element. Press Enter or Space to activate.';
    }
  }

  /**
   * Cleanup live regions
   */
  cleanup(): void {
    this.liveRegions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
    this.liveRegions.clear();
    this.announcements = [];
  }
}

// Global instance
export const screenReaderManager = new ScreenReaderManager();

/**
 * React hook for screen reader announcements
 */
export const useScreenReader = () => {
  const announce = React.useCallback((text: string, priority: 'polite' | 'assertive' = 'polite') => {
    screenReaderManager.announce(text, priority);
  }, []);

  const announceStatus = React.useCallback((status: string) => {
    screenReaderManager.announceStatus(status);
  }, []);

  const queueAnnouncement = React.useCallback((text: string, priority: 'polite' | 'assertive' = 'polite') => {
    screenReaderManager.queueAnnouncement(text, priority);
  }, []);

  return {
    announce,
    announceStatus,
    queueAnnouncement,
    manager: screenReaderManager
  };
};

// Import React for the hook
import React from 'react';