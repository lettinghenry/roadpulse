// Core data models for the map visualization system

export interface RoadAnomalyEvent {
  id: string;
  createdAt: Date;
  latitude: number;
  longitude: number;
  gpsAccuracyM: number;
  speedKmh: number;
  headingDeg?: number;
  peakAccelMs2: number;
  impulseDurationMs: number;
  severity: 1 | 2 | 3 | 4 | 5;
  confidence: number; // 0.0-1.0
  deviceModel: string;
  androidVersion: string;
  sessionId: string;
}

export interface ClusterData {
  id: string;
  latitude: number;
  longitude: number;
  eventCount: number;
  maxSeverity: number;
  averageConfidence: number;
  bounds: LatLngBounds;
  events: RoadAnomalyEvent[];
}

export interface FilterCriteria {
  severityLevels: number[];
  dateRange: {
    start: Date;
    end: Date;
  };
  confidenceThreshold: number;
  bounds?: LatLngBounds;
}

export interface ViewportState {
  center: LatLng;
  zoom: number;
  bounds: LatLngBounds;
  pixelBounds: PixelBounds;
}

// Leaflet-related types
export interface LatLng {
  lat: number;
  lng: number;
}

export interface LatLngBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface PixelBounds {
  min: { x: number; y: number };
  max: { x: number; y: number };
}

// UI-related types
export interface PopupContent {
  title: string;
  details: Array<{
    label: string;
    value: string;
  }>;
}

export type MapStyle = 'street' | 'satellite';
export type VisualizationMode = 'markers' | 'heatmap';

// Color gradient for heat maps
export interface ColorGradient {
  [key: number]: string;
}

// Heat map configuration
export interface HeatMapConfig {
  radius: number;
  blur: number;
  maxZoom: number;
  gradient: ColorGradient;
  intensity: number;
}

// Heat map layer interface
export interface HeatMapLayer {
  visible: boolean;
  config: HeatMapConfig;
}

// Severity color mapping
export const SEVERITY_COLORS = {
  1: '#22c55e', // Green - Minor
  2: '#eab308', // Yellow - Moderate  
  3: '#f97316', // Orange - Significant
  4: '#ef4444', // Red - Major
  5: '#991b1b'  // Dark Red - Severe
} as const;

// Severity icon mapping for accessibility
export const SEVERITY_ICONS = {
  1: 'circle-small',
  2: 'circle-medium',
  3: 'triangle',
  4: 'diamond',
  5: 'hexagon'
} as const;