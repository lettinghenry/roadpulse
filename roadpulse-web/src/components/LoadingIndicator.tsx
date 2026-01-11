import React from 'react';
import { LoadingState } from '../utils/performanceMonitor';
import './LoadingIndicator.css';

interface LoadingIndicatorProps {
  operations: LoadingState[];
  className?: string;
}

/**
 * Loading indicator component that displays active loading operations
 * Shows indicators for operations taking longer than 500ms (Requirement 5.4)
 * Includes specific handling for heat map processing (Requirement 8.6)
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  operations,
  className = ''
}) => {
  if (operations.length === 0) {
    return null;
  }

  // Get operation display names
  const getOperationDisplayName = (operation: string): string => {
    switch (operation) {
      case 'heat-map-processing':
        return 'Generating heat map';
      case 'filtering':
        return 'Applying filters';
      case 'clustering':
        return 'Clustering markers';
      case 'data-loading':
        return 'Loading data';
      default:
        return operation.replace(/-/g, ' ');
    }
  };

  // Check if heat map processing is active
  const heatMapProcessing = operations.find(op => op.operation === 'heat-map-processing');
  const isHeatMapProcessing = !!heatMapProcessing;

  return (
    <div 
      className={`loading-indicator ${className} ${isHeatMapProcessing ? 'heat-map-processing' : ''}`} 
      role="status" 
      aria-live="polite"
    >
      <div className="loading-content">
        <div className="loading-spinner" aria-hidden="true">
          <div className={`spinner-ring ${isHeatMapProcessing ? 'heat-map-spinner' : ''}`}></div>
        </div>
        <div className="loading-text">
          {operations.length === 1 ? (
            <span>{getOperationDisplayName(operations[0].operation)}...</span>
          ) : (
            <span>Loading ({operations.length} operations)...</span>
          )}
        </div>
        {isHeatMapProcessing && (
          <div className="heat-map-processing-details">
            <span>Calculating density patterns</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingIndicator;