import React, { useState, useCallback } from 'react';
import { RoadAnomalyEvent, ClusterData, ViewportState } from '../types';
import AnomalyMarker from './AnomalyMarker';
import ClusterMarker from './ClusterMarker';
import ClusteringManager from './ClusteringManager';

interface AnomalyMarkersProps {
  events: RoadAnomalyEvent[];
  viewport?: ViewportState;
  onMarkerClick?: (event: RoadAnomalyEvent) => void;
  onClusterClick?: (cluster: ClusterData) => void;
  enableClustering?: boolean;
  minClusterSize?: number;
  disableAnimations?: boolean;
  reduceClusterRadius?: boolean;
}

export const AnomalyMarkers: React.FC<AnomalyMarkersProps> = ({ 
  events, 
  viewport,
  onMarkerClick,
  onClusterClick,
  enableClustering = true,
  minClusterSize = 100,
  disableAnimations = false,
  reduceClusterRadius = false
}) => {
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [individualMarkers, setIndividualMarkers] = useState<RoadAnomalyEvent[]>(events);

  // Handle cluster and marker updates from ClusteringManager
  const handleClustersChange = useCallback((
    newClusters: ClusterData[], 
    newIndividualMarkers: RoadAnomalyEvent[]
  ) => {
    setClusters(newClusters);
    setIndividualMarkers(newIndividualMarkers);
  }, []);

  // Adjust cluster size based on performance optimizations
  const effectiveMinClusterSize = reduceClusterRadius ? Math.max(50, minClusterSize / 2) : minClusterSize;

  // If clustering is disabled or no viewport, show all individual markers
  if (!enableClustering || !viewport) {
    return (
      <>
        {events.map((event) => (
          <AnomalyMarker
            key={event.id}
            event={event}
            onClick={onMarkerClick}
            disableAnimations={disableAnimations}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {/* Clustering Manager - processes data but doesn't render */}
      <ClusteringManager
        events={events}
        viewport={viewport}
        onClustersChange={handleClustersChange}
        minClusterSize={effectiveMinClusterSize}
      />
      
      {/* Render cluster markers */}
      {clusters.map((cluster) => (
        <ClusterMarker
          key={cluster.id}
          cluster={cluster}
          onClick={onClusterClick}
          disableAnimations={disableAnimations}
        />
      ))}
      
      {/* Render individual markers */}
      {individualMarkers.map((event) => (
        <AnomalyMarker
          key={event.id}
          event={event}
          onClick={onMarkerClick}
          disableAnimations={disableAnimations}
        />
      ))}
    </>
  );
};

export default AnomalyMarkers;