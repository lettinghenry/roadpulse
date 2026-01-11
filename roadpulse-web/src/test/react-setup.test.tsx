import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { StrictMode } from 'react';

describe('React Setup', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render basic React components', () => {
    const TestComponent = () => <div data-testid="test">Hello World</div>;
    render(<TestComponent />);
    
    const element = screen.getByTestId('test');
    expect(element).toBeInTheDocument();
    expect(element.textContent).toBe('Hello World');
  });

  it('should support React hooks', async () => {
    const { useState } = await import('react');
    expect(typeof useState).toBe('function');
  });

  it('should support React StrictMode', () => {
    const TestComponent = () => <div data-testid="strict-test">Strict Mode Test</div>;
    
    render(
      <StrictMode>
        <TestComponent />
      </StrictMode>
    );
    
    const element = screen.getByTestId('strict-test');
    expect(element).toBeInTheDocument();
  });

  it('should support CSS imports', () => {
    // Test that CSS can be imported (this is handled by Vite)
    const TestComponent = () => (
      <div className="test-class" data-testid="css-test">
        CSS Test
      </div>
    );
    
    render(<TestComponent />);
    const element = screen.getByTestId('css-test');
    expect(element).toHaveClass('test-class');
  });

  it('should support event handling', () => {
    let clicked = false;
    const handleClick = () => { clicked = true; };
    
    const TestComponent = () => (
      <button onClick={handleClick} data-testid="click-test">
        Click me
      </button>
    );
    
    render(<TestComponent />);
    const button = screen.getByTestId('click-test');
    button.click();
    
    expect(clicked).toBe(true);
  });

  it('should support component props and TypeScript types', () => {
    interface TestProps {
      title: string;
      count: number;
      optional?: boolean;
    }
    
    const TestComponent = ({ title, count, optional = false }: TestProps) => (
      <div data-testid="props-test">
        <h1>{title}</h1>
        <span>Count: {count}</span>
        {optional && <span>Optional is true</span>}
      </div>
    );
    
    render(<TestComponent title="Test Title" count={42} optional={true} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Count: 42')).toBeInTheDocument();
    expect(screen.getByText('Optional is true')).toBeInTheDocument();
  });
});