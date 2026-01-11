import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventPopup } from './EventPopup';
import { RoadAnomalyEvent } from '../types';

// Mock event data for testing
const mockEvent: RoadAnomalyEvent = {
  id: 'test-event-1',
  createdAt: new Date('2024-01-15T10:30:00Z'),
  latitude: 40.7128,
  longitude: -74.0060,
  gpsAccuracyM: 5.2,
  speedKmh: 45.5,
  headingDeg: 180,
  peakAccelMs2: 12.5,
  impulseDurationMs: 250,
  severity: 3 as const,
  confidence: 0.85,
  deviceModel: 'Samsung Galaxy S21',
  androidVersion: '12',
  sessionId: 'session-123'
};

describe('EventPopup', () => {
  it('renders popup when visible with event data', () => {
    const onClose = vi.fn();
    
    render(
      <EventPopup
        event={mockEvent}
        position={{ lat: 40.7128, lng: -74.0060 }}
        onClose={onClose}
        isVisible={true}
      />
    );

    // Check if popup title is rendered
    expect(screen.getByText('Road Anomaly Event')).toBeInTheDocument();
    
    // Check if severity is displayed
    expect(screen.getByText('Severity 3/5')).toBeInTheDocument();
    
    // Check if confidence is displayed with proper formatting
    expect(screen.getByText('85.0%')).toBeInTheDocument();
    
    // Check if coordinates are displayed
    expect(screen.getByText('40.712800°, -74.006000°')).toBeInTheDocument();
    
    // Check if device information is displayed
    expect(screen.getByText('Samsung Galaxy S21')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('session-123')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    const onClose = vi.fn();
    
    render(
      <EventPopup
        event={mockEvent}
        position={{ lat: 40.7128, lng: -74.0060 }}
        onClose={onClose}
        isVisible={false}
      />
    );

    // Popup should not be in the document
    expect(screen.queryByText('Road Anomaly Event')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    
    render(
      <EventPopup
        event={mockEvent}
        position={{ lat: 40.7128, lng: -74.0060 }}
        onClose={onClose}
        isVisible={true}
      />
    );

    // Click the close button
    const closeButton = screen.getByLabelText('Close popup');
    fireEvent.click(closeButton);

    // Verify onClose was called
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when escape key is pressed', () => {
    const onClose = vi.fn();
    
    render(
      <EventPopup
        event={mockEvent}
        position={{ lat: 40.7128, lng: -74.0060 }}
        onClose={onClose}
        isVisible={true}
      />
    );

    // Press escape key
    fireEvent.keyDown(document, { key: 'Escape' });

    // Verify onClose was called
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('formats sensor data correctly', () => {
    const onClose = vi.fn();
    
    render(
      <EventPopup
        event={mockEvent}
        position={{ lat: 40.7128, lng: -74.0060 }}
        onClose={onClose}
        isVisible={true}
      />
    );

    // Check acceleration formatting (includes g-force)
    expect(screen.getByText('12.50 m/s² (1.27g)')).toBeInTheDocument();
    
    // Check duration formatting
    expect(screen.getByText('250ms')).toBeInTheDocument();
    
    // Check speed formatting (includes mph)
    expect(screen.getByText('45.5 km/h (28.3 mph)')).toBeInTheDocument();
    
    // Check heading formatting (includes direction)
    expect(screen.getByText('180.0° (S)')).toBeInTheDocument();
  });
});