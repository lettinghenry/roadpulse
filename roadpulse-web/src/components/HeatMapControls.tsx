import React, { useState, useCallback } from 'react';
import './HeatMapRenderer.css';

interface HeatMapControlsProps {
  visible: boolean;
  onToggle: (visible: boolean) => void;
  intensity?: number;
  onIntensityChange?: (intensity: number) => void;
  radius?: number;
  onRadiusChange?: (radius: number) => void;
  className?: string;
  disabled?: boolean;
}

const HeatMapControls: React.FC<HeatMapControlsProps> = ({
  visible,
  onToggle,
  intensity = 1.0,
  onIntensityChange,
  radius = 25,
  onRadiusChange,
  className = '',
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(event.target.checked);
  }, [onToggle]);

  const handleIntensityChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newIntensity = parseFloat(event.target.value);
    onIntensityChange?.(newIntensity);
  }, [onIntensityChange]);

  const handleRadiusChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseInt(event.target.value, 10);
    onRadiusChange?.(newRadius);
  }, [onRadiusChange]);

  return (
    <div className={`heat-map-controls ${className}`}>
      <div className="heat-map-toggle">
        <input
          type="checkbox"
          id="heat-map-toggle"
          checked={visible}
          onChange={handleToggle}
          disabled={disabled}
        />
        <label htmlFor="heat-map-toggle">Heat Map View</label>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled || !visible}
          style={{
            background: 'none',
            border: 'none',
            cursor: disabled || !visible ? 'default' : 'pointer',
            fontSize: '12px',
            color: '#6b7280',
            marginLeft: 'auto'
          }}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && visible && (
        <div className="heat-map-advanced-controls">
          <div className="heat-map-intensity-control">
            <label htmlFor="heat-map-intensity">
              Intensity: {intensity.toFixed(1)}
            </label>
            <input
              type="range"
              id="heat-map-intensity"
              min="0.1"
              max="2.0"
              step="0.1"
              value={intensity}
              onChange={handleIntensityChange}
              disabled={disabled}
            />
          </div>

          <div className="heat-map-intensity-control">
            <label htmlFor="heat-map-radius">
              Radius: {radius}px
            </label>
            <input
              type="range"
              id="heat-map-radius"
              min="10"
              max="50"
              step="5"
              value={radius}
              onChange={handleRadiusChange}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatMapControls;