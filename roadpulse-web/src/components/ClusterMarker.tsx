import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Icon, LatLng as LeafletLatLng } from 'leaflet';
import { ClusterData, RoadAnomalyEvent, SEVERITY_COLORS } from '../types';
import './AnomalyMarker.css';

interface ClusterMarkerProps {
  cluster: ClusterData;
  onClick?: (cluster: ClusterData) => void;
  disableAnimations?: boolean;
}

// Create custom cluster icon with event count and severity indication
const createClusterIcon = (eventCount: number, maxSeverity: number, disableAnimations: boolean = false): Icon => {
  const color = SEVERITY_COLORS[maxSeverity as keyof typeof SEVERITY_COLORS];
  const size = getClusterSize(eventCount);
  
  const svgIcon = createClusterSVG(eventCount, color, size, disableAnimations);
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [size + 6, size + 6], // Account for severity ring
    iconAnchor: [(size + 6) / 2, (size + 6) / 2],
    popupAnchor: [0, -(size + 6) / 2],
    className: `cluster-marker severity-${maxSeverity}`
  });
};

// Determine cluster marker size based on event count
const getClusterSize = (eventCount: number): number => {
  if (eventCount < 10) return 30;
  if (eventCount < 50) return 40;
  if (eventCount < 100) return 50;
  if (eventCount < 500) return 60;
  return 70;
};

// Create SVG for cluster marker with enhanced severity display
const createClusterSVG = (eventCount: number, color: string, size: number, disableAnimations: boolean = false): string => {
  const radius = size / 2 - 2;
  const center = size / 2;
  
  // Format event count for display
  const displayCount = eventCount < 1000 ? eventCount.toString() : `${Math.floor(eventCount / 100) / 10}k`;
  const fontSize = size < 40 ? 10 : size < 60 ? 12 : 14;
  
  // Create severity indicator ring
  const severityRingRadius = radius + 3;
  
  // Animation elements - only include if animations are enabled
  const animationElements = disableAnimations ? '' : `
    <!-- Severity pulse effect -->
    <circle cx="${center + 3}" cy="${center + 3}" r="${radius - 2}" 
            fill="${color}" opacity="0.3">
      <animate attributeName="r" values="${radius - 2};${radius + 2};${radius - 2}" 
               dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.3;0.1;0.3" 
               dur="2s" repeatCount="indefinite"/>
    </circle>
  `;
  
  return `
    <svg width="${size + 6}" height="${size + 6}" viewBox="0 0 ${size + 6} ${size + 6}" xmlns="http://www.w3.org/2000/svg">
      <!-- Severity indicator ring -->
      <circle cx="${center + 3}" cy="${center + 3}" r="${severityRingRadius}" 
              fill="none" stroke="${color}" stroke-width="3" opacity="0.8"/>
      <!-- Outer ring for visibility -->
      <circle cx="${center + 3}" cy="${center + 3}" r="${radius + 1}" fill="#fff" opacity="0.9"/>
      <!-- Main cluster circle -->
      <circle cx="${center + 3}" cy="${center + 3}" r="${radius}" fill="${color}" stroke="#fff" stroke-width="2"/>
      <!-- Inner highlight for depth -->
      <circle cx="${center + 3}" cy="${center + 3}" r="${radius - 4}" 
              fill="none" stroke="#fff" stroke-width="1" opacity="0.4"/>
      ${animationElements}
      <!-- Event count text -->
      <text x="${center + 3}" y="${center + 3 + fontSize/3}" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#fff">
        ${displayCount}
      </text>
    </svg>
  `;
};

// Get severity breakdown for cluster popup
const getSeverityBreakdown = (events: RoadAnomalyEvent[]): Array<{ severity: number; count: number }> => {
  const severityCounts: { [key: number]: number } = {};
  
  events.forEach(event => {
    severityCounts[event.severity] = (severityCounts[event.severity] || 0) + 1;
  });
  
  return Object.entries(severityCounts)
    .map(([severity, count]) => ({ severity: parseInt(severity), count }))
    .sort((a, b) => b.severity - a.severity); // Sort by severity descending
};

export const ClusterMarker: React.FC<ClusterMarkerProps> = ({ cluster, onClick, disableAnimations = false }) => {
  const position: LeafletLatLng = new LeafletLatLng(cluster.latitude, cluster.longitude);
  const icon = createClusterIcon(cluster.eventCount, cluster.maxSeverity, disableAnimations);

  const handleClick = () => {
    if (onClick) {
      onClick(cluster);
    }
  };

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: handleClick
      }}
      title={`Cluster of ${cluster.eventCount} anomalies (max severity: ${cluster.maxSeverity}). Click to zoom in and view individual markers.`}
      // Disable marker animations when performance is poor
      riseOnHover={!disableAnimations}
    >
      <Popup>
        <div className="cluster-popup">
          <h3>Anomaly Cluster</h3>
          <div className="cluster-details">
            <p><strong>Event Count:</strong> {cluster.eventCount}</p>
            <p><strong>Highest Severity:</strong> 
              <span style={{ 
                color: SEVERITY_COLORS[cluster.maxSeverity as keyof typeof SEVERITY_COLORS],
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                {cluster.maxSeverity}/5
              </span>
            </p>
            <p><strong>Average Confidence:</strong> {(cluster.averageConfidence * 100).toFixed(1)}%</p>
            <p><strong>Location:</strong> {cluster.latitude.toFixed(6)}, {cluster.longitude.toFixed(6)}</p>
            
            {/* Severity breakdown */}
            <div style={{ marginTop: '12px' }}>
              <strong>Severity Distribution:</strong>
              <div style={{ marginTop: '4px' }}>
                {getSeverityBreakdown(cluster.events).map(({ severity, count }) => (
                  <div key={severity} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '2px',
                    fontSize: '12px'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS],
                      borderRadius: '50%',
                      marginRight: '6px'
                    }}></div>
                    Level {severity}: {count} events
                  </div>
                ))}
              </div>
            </div>
            
            <div className="cluster-actions" style={{ marginTop: '12px' }}>
              <button 
                onClick={handleClick}
                className="zoom-to-cluster-btn"
                style={{
                  padding: '8px 16px',
                  backgroundColor: SEVERITY_COLORS[cluster.maxSeverity as keyof typeof SEVERITY_COLORS],
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Zoom to View Details
              </button>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default ClusterMarker;