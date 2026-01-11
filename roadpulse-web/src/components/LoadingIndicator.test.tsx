import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingIndicator from './LoadingIndicator';
import { LoadingState } from '../utils/performanceMonitor';

describe('LoadingIndicator', () => {
  const mockLoadingState: LoadingState = {
    isLoading: true,
    operation: 'Loading data',
    startTime: Date.now(),
    showIndicator: true
  };

  it('should render nothing when no operations are provided', () => {
    const { container } = render(<LoadingIndicator operations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render loading indicator for single operation', () => {
    render(<LoadingIndicator operations={[mockLoadingState]} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should render loading indicator for multiple operations', () => {
    const operations: LoadingState[] = [
      mockLoadingState,
      {
        isLoading: true,
        operation: 'Processing clusters',
        startTime: Date.now(),
        showIndicator: true
      }
    ];

    render(<LoadingIndicator operations={operations} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading (2 operations)...')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingIndicator operations={[mockLoadingState]} />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-live', 'polite');
    
    const spinner = document.querySelector('.loading-spinner[aria-hidden="true"]');
    expect(spinner).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<LoadingIndicator operations={[mockLoadingState]} className="custom-class" />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('loading-indicator', 'custom-class');
  });

  it('should display spinner animation', () => {
    render(<LoadingIndicator operations={[mockLoadingState]} />);
    
    const spinner = document.querySelector('.spinner-ring');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('spinner-ring');
  });
});