import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilterControls from './FilterControls';
import { FilterCriteria } from '../types';

describe('FilterControls', () => {
  const mockOnFiltersChange = vi.fn();
  
  const defaultProps = {
    onFiltersChange: mockOnFiltersChange,
  };

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  it('should render filter controls with default state', () => {
    render(<FilterControls {...defaultProps} />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Severity Levels')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Confidence Threshold')).toBeInTheDocument();
  });

  it('should expand and collapse filter controls', async () => {
    render(<FilterControls {...defaultProps} />);
    
    const toggleButton = screen.getByRole('button', { name: /filters/i });
    const content = screen.getByText('Severity Levels').closest('.filter-controls-content');
    
    // Initially collapsed (no expanded class)
    expect(content).not.toHaveClass('expanded');
    
    // Expand
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(content).toHaveClass('expanded');
    });
    
    // Collapse
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(content).not.toHaveClass('expanded');
    });
  });

  it('should handle severity level changes', async () => {
    render(<FilterControls {...defaultProps} />);
    
    // Expand controls
    const toggleButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Severity Levels')).toBeVisible();
    });
    
    // Uncheck severity level 1
    const severityCheckbox = screen.getByRole('checkbox', { name: /severity level 1/i });
    fireEvent.click(severityCheckbox);
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          severityLevels: [2, 3, 4, 5]
        })
      );
    });
  });

  it('should handle confidence threshold changes', async () => {
    render(<FilterControls {...defaultProps} />);
    
    // Expand controls
    const toggleButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Confidence Threshold')).toBeVisible();
    });
    
    // Change confidence threshold
    const confidenceSlider = screen.getByRole('slider');
    fireEvent.change(confidenceSlider, { target: { value: '0.5' } });
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          confidenceThreshold: 0.5
        })
      );
    });
  });

  it('should handle date range changes', async () => {
    render(<FilterControls {...defaultProps} />);
    
    // Expand controls
    const toggleButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Date Range')).toBeVisible();
    });
    
    // Change start date
    const startDateInput = screen.getByLabelText(/from:/i);
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.objectContaining({
            start: new Date('2024-01-01')
          })
        })
      );
    });
  });

  it('should show clear button when filters are not default', async () => {
    const initialFilters: Partial<FilterCriteria> = {
      severityLevels: [4, 5],
      confidenceThreshold: 0.8
    };
    
    render(<FilterControls {...defaultProps} initialFilters={initialFilters} />);
    
    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
  });

  it('should clear filters when clear button is clicked', async () => {
    const initialFilters: Partial<FilterCriteria> = {
      severityLevels: [4, 5],
      confidenceThreshold: 0.8
    };
    
    render(<FilterControls {...defaultProps} initialFilters={initialFilters} />);
    
    const clearButton = await screen.findByText('Clear');
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          severityLevels: [1, 2, 3, 4, 5],
          confidenceThreshold: 0.0
        })
      );
    });
  });

  it('should be disabled when disabled prop is true', () => {
    render(<FilterControls {...defaultProps} disabled={true} />);
    
    const toggleButton = screen.getByRole('button', { name: /filters/i });
    expect(toggleButton).toBeDisabled();
  });
});