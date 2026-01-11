import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />);
    const heading = screen.getByText('RoadPulse Map Visualization');
    expect(heading).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<App />);
    const description = screen.getByText('Interactive map for road surface anomaly visualization');
    expect(description).toBeInTheDocument();
  });
});