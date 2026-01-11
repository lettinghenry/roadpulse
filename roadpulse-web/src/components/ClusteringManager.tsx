import React, { useMemo, useCallback } from 'react';
import SuperCluster from 'supercluster';
import { RoadAnomalyEvent, ClusterData, ViewportState, LatLngBounds } from '../types';

interface ClusteringManagerProps {
  events: RoadAnomalyEvent[];
  viewport: ViewportState;
  onClustersChange: (clusters: ClusterData[], individualMarkers: RoadAnomalyEvent[]) => void;
  minClusterSize?: number;
  clusterRadius?: number;
  maxZoom?: number;
}

// Optimal SuperCluster configuration based on design document
const DEFAULT_CLUSTER_OPTIONS = {
  radius: 60,        // Cluster radius in pixels
  maxZoom: 15,       // Max zoom to cluster points
  minZoom: 0,        // Min zoom to cluster points
  minPoints: 2,      // Minimum points to form cluster
  extent: 512,       // Tile extent
  nodeSize: 64       // Size of KD-tree leaf node
};

export const ClusteringManager: React.FC<ClusteringManagerProps> = ({
  events,
  viewport,
  onClustersChange,
  minClusterSize = 100,
  clusterRadius = 60,
  maxZoom = 15
}) => {
  // Create SuperCluster instance with configuration
  const superCluster = useMemo(() => {
    const cluster = new SuperCluster({
      ...DEFAULT_CLUSTER_OPTIONS,
      radius: clusterRadius,
      maxZoom: maxZoom,
      minPoints: 2
    });

    // Convert RoadAnomalyEvent to GeoJSON PointFeature format
    const points = events.map(event => ({
      type: 'Feature' as const,
      properties: {
        ...event,
        // Store original event data in properties
        eventId: event.id,
        severity: event.severity,
        confidence: event.confidence,
        createdAt: event.createdAt.toISOString()
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [event.longitude, event.latitude] as [number, number]
      }
    }));

    // Load points into SuperCluster
    cluster.load(points);
    return cluster;
  }, [events, clusterRadius, maxZoom]);

  // Generate clusters and individual markers based on current viewport
  const generateClusters = useCallback(() => {
    if (!viewport || events.length === 0) {
      onClustersChange([], events);
      return;
    }

    const { bounds, zoom } = viewport;
    
    // Implement zoom-based marker visibility logic
    // Show individual markers when zoomed in sufficiently (zoom >= 12)
    // OR when dataset is small (< minClusterSize)
    const shouldShowIndividualMarkers = zoom >= 12 || events.length < minClusterSize;
    
    if (shouldShowIndividualMarkers) {
      // Show individual markers when zoomed in or dataset is small
      onClustersChange([], events);
      return;
    }

    // Get clusters from SuperCluster
    const bbox: [number, number, number, number] = [
      bounds.west,
      bounds.south,
      bounds.east,
      bounds.north
    ];

    const clusterFeatures = superCluster.getClusters(bbox, Math.floor(zoom));
    
    const clusters: ClusterData[] = [];
    const individualMarkers: RoadAnomalyEvent[] = [];

    clusterFeatures.forEach(feature => {
      if (feature.properties.cluster) {
        // This is a cluster
        const clusterId = feature.properties.cluster_id!;
        const eventCount = feature.properties.point_count!;
        const [lng, lat] = feature.geometry.coordinates;

        // Get all events in this cluster
        const clusterEvents = superCluster.getLeaves(clusterId, Infinity, 0)
          .map(leaf => {
            const props = leaf.properties;
            return {
              ...props,
              id: props.eventId,
              createdAt: new Date(props.createdAt),
              latitude: leaf.geometry.coordinates[1],
              longitude: leaf.geometry.coordinates[0]
            } as RoadAnomalyEvent;
          });

        // Calculate cluster statistics
        const maxSeverity = Math.max(...clusterEvents.map(e => e.severity));
        const averageConfidence = clusterEvents.reduce((sum, e) => sum + e.confidence, 0) / clusterEvents.length;

        // Calculate cluster bounds
        const lats = clusterEvents.map(e => e.latitude);
        const lngs = clusterEvents.map(e => e.longitude);
        const clusterBounds: LatLngBounds = {
          north: Math.max(...lats),
          south: Math.min(...lats),
          east: Math.max(...lngs),
          west: Math.min(...lngs)
        };

        clusters.push({
          id: `cluster-${clusterId}`,
          latitude: lat,
          longitude: lng,
          eventCount,
          maxSeverity,
          averageConfidence,
          bounds: clusterBounds,
          events: clusterEvents
        });
      } else {
        // This is an individual point - show it even in cluster mode
        // This happens when points are far enough apart at current zoom level
        const props = feature.properties;
        const event: RoadAnomalyEvent = {
          ...props,
          id: props.eventId,
          createdAt: new Date(props.createdAt),
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0]
        };
        individualMarkers.push(event);
      }
    });

    onClustersChange(clusters, individualMarkers);
  }, [superCluster, viewport, events, minClusterSize, onClustersChange]);

  // Trigger clustering when dependencies change
  React.useEffect(() => {
    generateClusters();
  }, [generateClusters]);

  // This component doesn't render anything - it's a data processing component
  return null;
};

export default ClusteringManager;