import React, { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { RoadAnomalyEvent, ColorGradient } from '../types';

interface HeatMapRendererProps {
  events: RoadAnomalyEvent[];
  visible: boolean;
  intensity?: number;
  radius?: number;
  blur?: number;
  gradient?: ColorGradient;
  onProcessingStart?: () => void;
  onProcessingEnd?: () => void;
}

// Default blue-to-red gradient as specified in requirements
const DEFAULT_GRADIENT: ColorGradient = {
  0.0: '#313695',  // Blue - Low density
  0.2: '#4575b4',
  0.4: '#74add1',
  0.6: '#abd9e9',
  0.8: '#fee090',
  1.0: '#d73027'   // Red - High density
};

const HeatMapRenderer: React.FC<HeatMapRendererProps> = ({
  events,
  visible,
  intensity = 1.0,
  radius = 25,
  blur = 15,
  gradient = DEFAULT_GRADIENT,
  onProcessingStart,
  onProcessingEnd
}) => {
  const map = useMap();
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const processingTimeoutRef = useRef<number | null>(null);

  // Convert events to heat map data points
  const convertEventsToHeatData = useCallback((events: RoadAnomalyEvent[]): [number, number, number][] => {
    const startTime = performance.now();
    
    const heatData = events.map(event => [
      event.latitude,
      event.longitude,
      // Use severity as intensity weight (1-5 scale)
      event.severity / 5
    ] as [number, number, number]);
    
    const conversionTime = performance.now() - startTime;
    
    if (import.meta.env.DEV && conversionTime > 50) {
      console.log(`Heat map data conversion took ${conversionTime.toFixed(2)}ms for ${events.length} events`);
    }
    
    return heatData;
  }, []);

  // Create or update heat map layer
  const updateHeatMap = useCallback(() => {
    if (!map || !visible) {
      return;
    }

    // Start processing indicator
    onProcessingStart?.();

    // Clear existing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    // Performance optimization: Use requestAnimationFrame for smooth updates
    const processHeatMap = () => {
      try {
        // Remove existing heat layer
        if (heatLayerRef.current) {
          map.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
        }

        // Convert events to heat data
        const heatData = convertEventsToHeatData(events);

        if (heatData.length > 0) {
          // Performance optimization: Limit data points for large datasets
          const maxDataPoints = 5000; // Reasonable limit for performance
          const optimizedHeatData = heatData.length > maxDataPoints 
            ? heatData.slice(0, maxDataPoints)
            : heatData;

          // Create new heat layer with configuration
          heatLayerRef.current = L.heatLayer(optimizedHeatData, {
            radius,
            blur,
            maxZoom: 12, // Heat map works best at lower zoom levels
            gradient
          });

          // Add to map
          map.addLayer(heatLayerRef.current);

          if (import.meta.env.DEV && heatData.length > maxDataPoints) {
            console.log(`Heat map optimized: showing ${maxDataPoints} of ${heatData.length} data points`);
          }
        }
      } catch (error) {
        console.error('Error creating heat map:', error);
      } finally {
        // End processing indicator
        onProcessingEnd?.();
      }
    };

    // Use timeout to simulate processing time and show indicator for minimum duration
    const minProcessingTime = events.length > 1000 ? 200 : 100;
    processingTimeoutRef.current = window.setTimeout(processHeatMap, minProcessingTime);
  }, [map, events, visible, radius, blur, gradient, convertEventsToHeatData, onProcessingStart, onProcessingEnd]);

  // Remove heat map layer
  const removeHeatMap = useCallback(() => {
    if (heatLayerRef.current && map) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
  }, [map]);

  // Update heat map when events or visibility changes
  useEffect(() => {
    if (visible) {
      updateHeatMap();
    } else {
      removeHeatMap();
    }
  }, [visible, updateHeatMap, removeHeatMap]);

  // Update heat map when configuration changes
  useEffect(() => {
    if (visible && heatLayerRef.current) {
      updateHeatMap();
    }
  }, [intensity, radius, blur, gradient, updateHeatMap, visible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      removeHeatMap();
    };
  }, [removeHeatMap]);

  // This component doesn't render anything directly - it manages the Leaflet layer
  return null;
};

export default HeatMapRenderer;