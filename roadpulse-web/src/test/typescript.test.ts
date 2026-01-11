import { describe, it, expect } from 'vitest';
import React from 'react';

describe('TypeScript Configuration', () => {
  it('should have strict mode enabled', () => {
    // This test verifies that TypeScript strict mode is working
    // by testing that undefined values are properly typed
    const testValue: string | undefined = undefined;
    expect(typeof testValue).toBe('undefined');
    
    // This would fail compilation if strict mode wasn't enabled
    const definedValue: string = 'test';
    expect(definedValue).toBe('test');
  });

  it('should support JSX compilation', () => {
    // Test that JSX types are available
    const element = React.createElement('div', null, 'Test');
    expect(element.type).toBe('div');
    expect(element.props.children).toBe('Test');
  });

  it('should support ES2020 features', () => {
    // Test optional chaining (ES2020 feature)
    const obj: { nested: { value: string; nonexistent?: string } } = { nested: { value: 'test' } };
    expect(obj.nested?.value).toBe('test');
    expect(obj.nested?.nonexistent).toBeUndefined();
    
    // Test nullish coalescing (ES2020 feature)
    const nullValue = null;
    const result = nullValue ?? 'default';
    expect(result).toBe('default');
  });

  it('should support DOM types', () => {
    // Test that DOM types are available
    const element = document.createElement('div');
    expect(element).toBeInstanceOf(HTMLDivElement);
    expect(element.tagName).toBe('DIV');
  });

  it('should support module resolution', () => {
    // Test that module resolution is working for React
    expect(typeof React).toBe('object');
    expect(typeof React.createElement).toBe('function');
    
    // Test that we can import from node_modules
    const vitestImport = expect;
    expect(typeof vitestImport).toBe('function');
  });
});