import React, { useState, useCallback } from 'react';
import { FilterCriteria } from '../types';
import './FilterControls.css';

interface FilterControlsProps {
  onFiltersChange: (filters: FilterCriteria) => void;
  initialFilters?: Partial<FilterCriteria>;
  className?: string;
  disabled?: boolean;
}

interface FilterControlsState {
  severityLevels: number[];
  dateRange: {
    start: Date;
    end: Date;
  };
  confidenceThreshold: number;
}

const DEFAULT_FILTERS: FilterCriteria = {
  severityLevels: [1, 2, 3, 4, 5],
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    end: new Date()
  },
  confidenceThreshold: 0.0
};

const SEVERITY_LABELS = {
  1: 'Minor',
  2: 'Moderate', 
  3: 'Significant',
  4: 'Major',
  5: 'Severe'
};

const SEVERITY_COLORS = {
  1: '#22c55e', // Green
  2: '#eab308', // Yellow
  3: '#f97316', // Orange
  4: '#ef4444', // Red
  5: '#991b1b'  // Dark Red
};

export const FilterControls: React.FC<FilterControlsProps> = ({
  onFiltersChange,
  initialFilters = {},
  className = '',
  disabled = false
}) => {
  // Initialize state with default filters merged with initial filters
  const [filters, setFilters] = useState<FilterControlsState>(() => ({
    severityLevels: initialFilters.severityLevels || DEFAULT_FILTERS.severityLevels,
    dateRange: initialFilters.dateRange || DEFAULT_FILTERS.dateRange,
    confidenceThreshold: initialFilters.confidenceThreshold ?? DEFAULT_FILTERS.confidenceThreshold
  }));

  const [isExpanded, setIsExpanded] = useState(false);

  // Debounced filter change handler to meet 500ms response time requirement
  const debouncedFiltersChange = useCallback(
    debounce((newFilters: FilterCriteria) => {
      onFiltersChange(newFilters);
    }, 300), // 300ms debounce to ensure 500ms total response time
    [onFiltersChange]
  );

  // Update filters and notify parent
  const updateFilters = useCallback((newFilters: Partial<FilterControlsState>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Convert to FilterCriteria format and notify parent
      const filterCriteria: FilterCriteria = {
        severityLevels: updated.severityLevels,
        dateRange: updated.dateRange,
        confidenceThreshold: updated.confidenceThreshold
      };
      
      debouncedFiltersChange(filterCriteria);
      return updated;
    });
  }, [debouncedFiltersChange]);

  // Handle severity level toggle
  const handleSeverityToggle = useCallback((level: number) => {
    if (disabled) return;
    
    updateFilters({
      severityLevels: filters.severityLevels.includes(level)
        ? filters.severityLevels.filter(l => l !== level)
        : [...filters.severityLevels, level].sort()
    });
  }, [filters.severityLevels, updateFilters, disabled]);

  // Handle date range changes
  const handleStartDateChange = useCallback((date: string) => {
    if (disabled) return;
    
    const startDate = new Date(date);
    updateFilters({
      dateRange: {
        ...filters.dateRange,
        start: startDate
      }
    });
  }, [filters.dateRange, updateFilters, disabled]);

  const handleEndDateChange = useCallback((date: string) => {
    if (disabled) return;
    
    const endDate = new Date(date);
    updateFilters({
      dateRange: {
        ...filters.dateRange,
        end: endDate
      }
    });
  }, [filters.dateRange, updateFilters, disabled]);

  // Handle confidence threshold change
  const handleConfidenceChange = useCallback((value: string) => {
    if (disabled) return;
    
    const threshold = parseFloat(value);
    updateFilters({
      confidenceThreshold: threshold
    });
  }, [updateFilters, disabled]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    if (disabled) return;
    
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  }, [onFiltersChange, disabled]);

  // Format date for input
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Check if filters are at default values
  const isFiltersDefault = 
    JSON.stringify(filters.severityLevels.sort()) === JSON.stringify(DEFAULT_FILTERS.severityLevels.sort()) &&
    filters.dateRange.start.getTime() === DEFAULT_FILTERS.dateRange.start.getTime() &&
    filters.dateRange.end.getTime() === DEFAULT_FILTERS.dateRange.end.getTime() &&
    filters.confidenceThreshold === DEFAULT_FILTERS.confidenceThreshold;

  return (
    <div className={`filter-controls ${className} ${disabled ? 'disabled' : ''}`}>
      <div className="filter-controls-header">
        <button
          className="filter-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          aria-expanded={isExpanded}
          aria-controls="filter-controls-content"
        >
          <span className="filter-icon">🔍</span>
          <span className="filter-title">Filters</span>
          <span className={`filter-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </button>
        
        {!isFiltersDefault && (
          <button
            className="clear-filters-btn"
            onClick={handleClearFilters}
            disabled={disabled}
            title="Clear all filters"
          >
            Clear
          </button>
        )}
      </div>

      <div 
        id="filter-controls-content"
        className={`filter-controls-content ${isExpanded ? 'expanded' : ''}`}
      >
        {/* Severity Level Filter */}
        <div className="filter-group">
          <label className="filter-label">
            Severity Levels
            <span className="filter-description">Select severity levels to display</span>
          </label>
          <div className="severity-checkboxes" role="group" aria-label="Severity levels">
            {[1, 2, 3, 4, 5].map(level => (
              <label key={level} className="severity-checkbox">
                <input
                  type="checkbox"
                  checked={filters.severityLevels.includes(level)}
                  onChange={() => handleSeverityToggle(level)}
                  disabled={disabled}
                  aria-describedby={`severity-${level}-desc`}
                />
                <span 
                  className="severity-indicator"
                  style={{ backgroundColor: SEVERITY_COLORS[level as keyof typeof SEVERITY_COLORS] }}
                  aria-hidden="true"
                />
                <span className="severity-text">
                  {level} - {SEVERITY_LABELS[level as keyof typeof SEVERITY_LABELS]}
                </span>
                <span id={`severity-${level}-desc`} className="sr-only">
                  Severity level {level}: {SEVERITY_LABELS[level as keyof typeof SEVERITY_LABELS]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="filter-group">
          <label className="filter-label">
            Date Range
            <span className="filter-description">Filter events by detection date</span>
          </label>
          <div className="date-range-inputs">
            <div className="date-input-group">
              <label htmlFor="start-date" className="date-label">From:</label>
              <input
                id="start-date"
                type="date"
                value={formatDateForInput(filters.dateRange.start)}
                onChange={(e) => handleStartDateChange(e.target.value)}
                disabled={disabled}
                max={formatDateForInput(filters.dateRange.end)}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label htmlFor="end-date" className="date-label">To:</label>
              <input
                id="end-date"
                type="date"
                value={formatDateForInput(filters.dateRange.end)}
                onChange={(e) => handleEndDateChange(e.target.value)}
                disabled={disabled}
                min={formatDateForInput(filters.dateRange.start)}
                max={formatDateForInput(new Date())}
                className="date-input"
              />
            </div>
          </div>
        </div>

        {/* Confidence Threshold Filter */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="confidence-slider">
            Confidence Threshold
            <span className="filter-description">
              Minimum confidence score: {(filters.confidenceThreshold * 100).toFixed(0)}%
            </span>
          </label>
          <div className="confidence-slider-container">
            <input
              id="confidence-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={filters.confidenceThreshold}
              onChange={(e) => handleConfidenceChange(e.target.value)}
              disabled={disabled}
              className="confidence-slider"
              aria-describedby="confidence-value"
            />
            <div className="confidence-labels">
              <span>0%</span>
              <span id="confidence-value" className="confidence-value">
                {(filters.confidenceThreshold * 100).toFixed(0)}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="filter-summary">
          <span className="summary-text">
            Showing {filters.severityLevels.length} severity level{filters.severityLevels.length !== 1 ? 's' : ''}, 
            confidence ≥ {(filters.confidenceThreshold * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default FilterControls;