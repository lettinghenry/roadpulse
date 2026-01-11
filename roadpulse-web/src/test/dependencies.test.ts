import { describe, it, expect } from 'vitest';

describe('Dependencies', () => {
  it('should be able to import leaflet', async () => {
    const leaflet = await import('leaflet');
    expect(leaflet).toBeDefined();
    expect(leaflet.map).toBeDefined();
  });

  it('should be able to import react-leaflet', async () => {
    const reactLeaflet = await import('react-leaflet');
    expect(reactLeaflet).toBeDefined();
    expect(reactLeaflet.MapContainer).toBeDefined();
  });

  it('should be able to import supercluster', async () => {
    const SuperCluster = await import('supercluster');
    expect(SuperCluster).toBeDefined();
    expect(SuperCluster.default).toBeDefined();
    
    // Test that we can create a SuperCluster instance
    const cluster = new SuperCluster.default({
      radius: 40,
      maxZoom: 16,
      minZoom: 0,
      minPoints: 2,
    });
    expect(cluster).toBeDefined();
    expect(typeof cluster.load).toBe('function');
  });

  it('should be able to import fast-check for property-based testing', async () => {
    const fc = await import('fast-check');
    expect(fc).toBeDefined();
    expect(fc.integer).toBeDefined();
  });
});