import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MapLayerControls from './MapLayerControls';
import { MapStyle } from '../types';

describe('MapLayerControls', () => {
  const defaultProps = {
    currentLayer: 'street' as MapStyle,
    onLayerChange: vi.fn()
  };

  it('should render layer control options', () => {
    render(<MapLayerControls {...defaultProps} />);
    
    expect(screen.getByText('Map Layers')).toBeInTheDocument();
    expect(screen.getByText('Street Map')).toBeInTheDocument();
    expect(screen.getByText('Satellite')).toBeInTheDocument();
  });

  it('should show current layer as active', () => {
    render(<MapLayerControls {...defaultProps} />);
    
    const streetButton = screen.getByRole('button', { name: /street map/i });
    expect(streetButton).toHaveAttribute('aria-pressed', 'true');
    expect(streetButton).toHaveClass('active');
  });

  it('should call onLayerChange when different layer is selected', async () => {
    const onLayerChange = vi.fn();
    render(<MapLayerControls {...defaultProps} onLayerChange={onLayerChange} />);
    
    const satelliteButton = screen.getByRole('button', { name: /satellite/i });
    fireEvent.click(satelliteButton);
    
    await waitFor(() => {
      expect(onLayerChange).toHaveBeenCalledWith('satellite');
    });
  });

  it('should not call onLayerChange when same layer is selected', () => {
    const onLayerChange = vi.fn();
    render(<MapLayerControls {...defaultProps} onLayerChange={onLayerChange} />);
    
    const streetButton = screen.getByRole('button', { name: /street map/i });
    fireEvent.click(streetButton);
    
    expect(onLayerChange).not.toHaveBeenCalled();
  });

  it('should disable buttons when disabled prop is true', () => {
    render(<MapLayerControls {...defaultProps} disabled={true} />);
    
    const streetButton = screen.getByRole('button', { name: /street map/i });
    const satelliteButton = screen.getByRole('button', { name: /satellite/i });
    
    expect(streetButton).toBeDisabled();
    expect(satelliteButton).toBeDisabled();
  });

  it('should show transition indicator during layer change', async () => {
    const onLayerChange = vi.fn();
    render(<MapLayerControls {...defaultProps} onLayerChange={onLayerChange} />);
    
    const satelliteButton = screen.getByRole('button', { name: /satellite/i });
    fireEvent.click(satelliteButton);
    
    // Should show transition indicator briefly
    expect(screen.getByLabelText('Switching map layer')).toBeInTheDocument();
  });

  it('should apply touch optimization class when touchOptimized is true', () => {
    render(<MapLayerControls {...defaultProps} touchOptimized={true} />);
    
    const container = screen.getByRole('group', { name: /map layer selection/i });
    expect(container).toHaveClass('touch-optimized');
  });

  it('should provide proper accessibility attributes', () => {
    render(<MapLayerControls {...defaultProps} />);
    
    const container = screen.getByRole('group', { name: /map layer selection/i });
    expect(container).toBeInTheDocument();
    
    const streetButton = screen.getByRole('button', { name: /street map/i });
    expect(streetButton).toHaveAttribute('aria-pressed', 'true');
    expect(streetButton).toHaveAttribute('aria-describedby');
    
    const satelliteButton = screen.getByRole('button', { name: /satellite/i });
    expect(satelliteButton).toHaveAttribute('aria-pressed', 'false');
    expect(satelliteButton).toHaveAttribute('aria-describedby');
  });
});