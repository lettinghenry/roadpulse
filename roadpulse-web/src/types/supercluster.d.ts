declare module 'supercluster' {
  interface ClusterOptions {
    radius?: number;
    maxZoom?: number;
    minZoom?: number;
    minPoints?: number;
    extent?: number;
    nodeSize?: number;
  }

  interface ClusterFeature {
    type: 'Feature';
    properties: {
      cluster: boolean;
      cluster_id?: number;
      point_count?: number;
      point_count_abbreviated?: string;
    };
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
  }

  interface PointFeature {
    type: 'Feature';
    properties: any;
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
  }

  class SuperCluster {
    constructor(options?: ClusterOptions);
    load(points: PointFeature[]): SuperCluster;
    getClusters(bbox: [number, number, number, number], zoom: number): (ClusterFeature | PointFeature)[];
    getChildren(clusterId: number): (ClusterFeature | PointFeature)[];
    getLeaves(clusterId: number, limit?: number, offset?: number): PointFeature[];
    getTile(z: number, x: number, y: number): (ClusterFeature | PointFeature)[];
  }

  export = SuperCluster;
}