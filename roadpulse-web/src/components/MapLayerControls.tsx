import React, { useState, useCallback } from 'react';
import { MapStyle } from '../types';
import './MapLayerControls.css';

interface MapLayerControlsProps {
  currentLayer: MapStyle;
  onLayerChange: (layer: MapStyle) => void;
  className?: string;
  disabled?: boolean;
  touchOptimized?: boolean;
}

export const MapLayerControls: React.FC<MapLayerControlsProps> = ({
  currentLayer,
  onLayerChange,
  className = '',
  disabled = false,
  touchOptimized = false
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLayerChange = useCallback(async (newLayer: MapStyle) => {
    if (disabled || isTransitioning || newLayer === currentLayer) {
      return;
    }

    setIsTransitioning(true);
    
    try {
      // Start transition timer to ensure it completes within 2 seconds
      const transitionStart = performance.now();
      
      // Call the layer change handler
      onLayerChange(newLayer);
      
      // Simulate transition time and ensure it doesn't exceed 2 seconds
      const transitionTime = performance.now() - transitionStart;
      
      if (transitionTime > 2000) {
        console.warn(`Layer transition took ${transitionTime.toFixed(2)}ms, exceeding 2 second target`);
      }
      
      // Minimum transition time for visual feedback
      const minTransitionTime = 300;
      const remainingTime = Math.max(0, minTransitionTime - transitionTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
    } catch (error) {
      console.error('Error during layer transition:', error);
    } finally {
      setIsTransitioning(false);
    }
  }, [currentLayer, onLayerChange, disabled, isTransitioning]);

  const layers: Array<{ key: MapStyle; label: string; description: string }> = [
    {
      key: 'street',
      label: 'Street Map',
      description: 'Standard street map with road networks'
    },
    {
      key: 'satellite',
      label: 'Satellite',
      description: 'Satellite imagery view'
    }
  ];

  return (
    <div 
      className={`map-layer-controls ${className} ${touchOptimized ? 'touch-optimized' : ''} ${isTransitioning ? 'transitioning' : ''}`}
      role="group"
      aria-label="Map layer selection"
    >
      <div className="layer-controls-header">
        <span className="layer-controls-title">Map Layers</span>
        {isTransitioning && (
          <div className="transition-indicator" aria-label="Switching map layer">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      
      <div className="layer-options">
        {layers.map((layer) => (
          <button
            key={layer.key}
            type="button"
            className={`layer-option ${currentLayer === layer.key ? 'active' : ''} ${touchOptimized ? 'touch-target' : ''}`}
            onClick={() => handleLayerChange(layer.key)}
            disabled={disabled || isTransitioning}
            aria-pressed={currentLayer === layer.key}
            aria-describedby={`layer-${layer.key}-description`}
            title={layer.description}
          >
            <div className="layer-icon">
              {layer.key === 'street' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h18m-9-9v18" />
                  <path d="M8 8l4-4 4 4" />
                  <path d="M16 16l-4 4-4-4" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              )}
            </div>
            <span className="layer-label">{layer.label}</span>
            {currentLayer === layer.key && (
              <div className="active-indicator" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Hidden descriptions for screen readers */}
      {layers.map((layer) => (
        <div
          key={`${layer.key}-description`}
          id={`layer-${layer.key}-description`}
          className="sr-only"
        >
          {layer.description}
        </div>
      ))}
    </div>
  );
};

export default MapLayerControls;