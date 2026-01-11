import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Icon, LatLng as LeafletLatLng } from 'leaflet';
import { RoadAnomalyEvent, SEVERITY_COLORS, SEVERITY_ICONS } from '../types';
import './AnomalyMarker.css';

interface AnomalyMarkerProps {
  event: RoadAnomalyEvent;
  onClick?: (event: RoadAnomalyEvent) => void;
  disableAnimations?: boolean;
}

// Create custom icons for different severity levels
const createSeverityIcon = (severity: 1 | 2 | 3 | 4 | 5): Icon => {
  const color = SEVERITY_COLORS[severity];
  const iconType = SEVERITY_ICONS[severity];
  
  // Create SVG icon with appropriate color and shape
  const svgIcon = createSVGIcon(color, iconType, severity);
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    className: `anomaly-marker severity-${severity}`
  });
};

// Create SVG icon based on severity level and accessibility requirements
const createSVGIcon = (color: string, iconType: string, severity: number): string => {
  const size = 24;
  const center = size / 2;
  
  let shape = '';
  
  switch (iconType) {
    case 'circle-small':
      shape = `<circle cx="${center}" cy="${center}" r="6" fill="${color}" stroke="#fff" stroke-width="2"/>`;
      break;
    case 'circle-medium':
      shape = `<circle cx="${center}" cy="${center}" r="8" fill="${color}" stroke="#fff" stroke-width="2"/>`;
      break;
    case 'triangle':
      shape = `<polygon points="${center},4 ${center-8},16 ${center+8},16" fill="${color}" stroke="#fff" stroke-width="2"/>`;
      break;
    case 'diamond':
      shape = `<polygon points="${center},4 ${center+8},${center} ${center},20 ${center-8},${center}" fill="${color}" stroke="#fff" stroke-width="2"/>`;
      break;
    case 'hexagon':
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        const x = center + 8 * Math.cos(angle);
        const y = center + 8 * Math.sin(angle);
        hexPoints.push(`${x},${y}`);
      }
      shape = `<polygon points="${hexPoints.join(' ')}" fill="${color}" stroke="#fff" stroke-width="2"/>`;
      break;
    default:
      shape = `<circle cx="${center}" cy="${center}" r="8" fill="${color}" stroke="#fff" stroke-width="2"/>`;
  }
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${shape}
      <text x="${center}" y="${center + 3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#fff">${severity}</text>
    </svg>
  `;
};

export const AnomalyMarker: React.FC<AnomalyMarkerProps> = ({ event, onClick, disableAnimations = false }) => {
  const position: LeafletLatLng = new LeafletLatLng(event.latitude, event.longitude);
  const icon = createSeverityIcon(event.severity);

  const handleClick = () => {
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: handleClick
      }}
      title={`Severity ${event.severity} anomaly detected at ${event.createdAt.toLocaleString()}`}
      // Disable marker animations when performance is poor
      riseOnHover={!disableAnimations}
    >
      <Popup>
        <div className="anomaly-popup">
          <h3>Road Anomaly Event</h3>
          <div className="event-details">
            <p><strong>Severity:</strong> {event.severity}/5</p>
            <p><strong>Confidence:</strong> {(event.confidence * 100).toFixed(1)}%</p>
            <p><strong>Detected:</strong> {event.createdAt.toLocaleString()}</p>
            <p><strong>Location:</strong> {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}</p>
            <p><strong>GPS Accuracy:</strong> ±{event.gpsAccuracyM}m</p>
            <p><strong>Speed:</strong> {event.speedKmh} km/h</p>
            <p><strong>Peak Acceleration:</strong> {event.peakAccelMs2.toFixed(2)} m/s²</p>
            <p><strong>Duration:</strong> {event.impulseDurationMs}ms</p>
            <p><strong>Device:</strong> {event.deviceModel}</p>
            <p><strong>Android Version:</strong> {event.androidVersion}</p>
            <p><strong>Session ID:</strong> {event.sessionId}</p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default AnomalyMarker;