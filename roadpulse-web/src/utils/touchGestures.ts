/**
 * Touch gesture utilities for handling pinch-to-zoom, drag-to-pan, and other touch interactions
 */
import React from 'react';

export interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

export interface GestureState {
  isActive: boolean;
  startTime: number;
  startDistance?: number;
  startCenter?: { x: number; y: number };
  currentDistance?: number;
  currentCenter?: { x: number; y: number };
  scale: number;
  deltaX: number;
  deltaY: number;
  velocity: { x: number; y: number };
}

export interface TouchGestureHandlers {
  onPinchStart?: (state: GestureState) => void;
  onPinchMove?: (state: GestureState) => void;
  onPinchEnd?: (state: GestureState) => void;
  onPanStart?: (state: GestureState) => void;
  onPanMove?: (state: GestureState) => void;
  onPanEnd?: (state: GestureState) => void;
  onDoubleTap?: (point: TouchPoint) => void;
  onLongPress?: (point: TouchPoint) => void;
}

export interface TouchGestureOptions {
  enablePinchZoom?: boolean;
  enablePan?: boolean;
  enableDoubleTap?: boolean;
  enableLongPress?: boolean;
  minPinchDistance?: number;
  maxPinchDistance?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  panThreshold?: number;
  preventDefaultTouchEvents?: boolean;
}

const DEFAULT_OPTIONS: Required<TouchGestureOptions> = {
  enablePinchZoom: true,
  enablePan: true,
  enableDoubleTap: true,
  enableLongPress: true,
  minPinchDistance: 10,
  maxPinchDistance: 500,
  longPressDelay: 500,
  doubleTapDelay: 300,
  panThreshold: 10,
  preventDefaultTouchEvents: true
};

export class TouchGestureManager {
  private element: HTMLElement;
  private options: Required<TouchGestureOptions>;
  private handlers: TouchGestureHandlers;
  private gestureState: GestureState;
  private touches: TouchPoint[] = [];
  private lastTapTime = 0;
  private lastTapPoint: TouchPoint | null = null;
  private longPressTimer: number | null = null;
  private isGestureActive = false;

  constructor(
    element: HTMLElement,
    handlers: TouchGestureHandlers,
    options: TouchGestureOptions = {}
  ) {
    this.element = element;
    this.handlers = handlers;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.gestureState = this.createInitialGestureState();

    this.bindEvents();
  }

  private createInitialGestureState(): GestureState {
    return {
      isActive: false,
      startTime: 0,
      scale: 1,
      deltaX: 0,
      deltaY: 0,
      velocity: { x: 0, y: 0 }
    };
  }

  private bindEvents(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });
  }

  private handleTouchStart = (event: TouchEvent): void => {
    if (this.options.preventDefaultTouchEvents) {
      event.preventDefault();
    }

    this.updateTouches(event);
    const now = Date.now();

    // Handle single touch
    if (this.touches.length === 1) {
      const touch = this.touches[0];
      
      // Check for double tap
      if (this.options.enableDoubleTap && this.lastTapPoint) {
        const timeDiff = now - this.lastTapTime;
        const distance = this.getDistance(touch, this.lastTapPoint);
        
        if (timeDiff < this.options.doubleTapDelay && distance < 50) {
          this.handlers.onDoubleTap?.(touch);
          this.lastTapPoint = null;
          return;
        }
      }

      this.lastTapTime = now;
      this.lastTapPoint = touch;

      // Start long press timer
      if (this.options.enableLongPress) {
        this.longPressTimer = window.setTimeout(() => {
          if (this.touches.length === 1 && !this.isGestureActive) {
            this.handlers.onLongPress?.(this.touches[0]);
          }
        }, this.options.longPressDelay);
      }

      // Start pan gesture
      if (this.options.enablePan) {
        this.gestureState = {
          ...this.createInitialGestureState(),
          isActive: true,
          startTime: now,
          startCenter: { x: touch.x, y: touch.y },
          currentCenter: { x: touch.x, y: touch.y }
        };
        this.handlers.onPanStart?.(this.gestureState);
      }
    }

    // Handle pinch gesture (two touches)
    if (this.touches.length === 2 && this.options.enablePinchZoom) {
      this.clearLongPressTimer();
      this.isGestureActive = true;

      const distance = this.getDistance(this.touches[0], this.touches[1]);
      const center = this.getCenter(this.touches[0], this.touches[1]);

      this.gestureState = {
        ...this.createInitialGestureState(),
        isActive: true,
        startTime: now,
        startDistance: distance,
        currentDistance: distance,
        startCenter: center,
        currentCenter: center,
        scale: 1
      };

      this.handlers.onPinchStart?.(this.gestureState);
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (this.options.preventDefaultTouchEvents) {
      event.preventDefault();
    }

    this.updateTouches(event);

    if (!this.gestureState.isActive) return;

    // Handle pan gesture
    if (this.touches.length === 1 && this.options.enablePan) {
      const touch = this.touches[0];
      const deltaX = touch.x - (this.gestureState.startCenter?.x || 0);
      const deltaY = touch.y - (this.gestureState.startCenter?.y || 0);

      // Check if movement exceeds threshold
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > this.options.panThreshold) {
        this.clearLongPressTimer();
        this.isGestureActive = true;

        // Calculate velocity
        const timeDiff = Date.now() - this.gestureState.startTime;
        const velocity = {
          x: deltaX / Math.max(timeDiff, 1),
          y: deltaY / Math.max(timeDiff, 1)
        };

        this.gestureState = {
          ...this.gestureState,
          deltaX,
          deltaY,
          velocity,
          currentCenter: { x: touch.x, y: touch.y }
        };

        this.handlers.onPanMove?.(this.gestureState);
      }
    }

    // Handle pinch gesture
    if (this.touches.length === 2 && this.options.enablePinchZoom) {
      const distance = this.getDistance(this.touches[0], this.touches[1]);
      const center = this.getCenter(this.touches[0], this.touches[1]);
      const scale = distance / (this.gestureState.startDistance || 1);

      // Clamp scale within reasonable bounds
      const clampedScale = Math.max(0.1, Math.min(10, scale));

      this.gestureState = {
        ...this.gestureState,
        currentDistance: distance,
        currentCenter: center,
        scale: clampedScale
      };

      this.handlers.onPinchMove?.(this.gestureState);
    }
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    if (this.options.preventDefaultTouchEvents) {
      event.preventDefault();
    }

    this.updateTouches(event);
    this.clearLongPressTimer();

    // End gestures when no touches remain
    if (this.touches.length === 0) {
      if (this.gestureState.isActive) {
        if (this.gestureState.startDistance) {
          // End pinch gesture
          this.handlers.onPinchEnd?.(this.gestureState);
        } else {
          // End pan gesture
          this.handlers.onPanEnd?.(this.gestureState);
        }
      }

      this.gestureState = this.createInitialGestureState();
      this.isGestureActive = false;
    }

    // Handle transition from pinch to pan
    if (this.touches.length === 1 && this.gestureState.startDistance) {
      // End pinch, start pan
      this.handlers.onPinchEnd?.(this.gestureState);
      
      const touch = this.touches[0];
      this.gestureState = {
        ...this.createInitialGestureState(),
        isActive: true,
        startTime: Date.now(),
        startCenter: { x: touch.x, y: touch.y },
        currentCenter: { x: touch.x, y: touch.y }
      };
      
      this.handlers.onPanStart?.(this.gestureState);
    }
  };

  private handleTouchCancel = (event: TouchEvent): void => {
    this.handleTouchEnd(event);
  };

  private updateTouches(event: TouchEvent): void {
    this.touches = Array.from(event.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier
    }));
  }

  private getDistance(touch1: TouchPoint, touch2: TouchPoint): number {
    const dx = touch2.x - touch1.x;
    const dy = touch2.y - touch1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getCenter(touch1: TouchPoint, touch2: TouchPoint): { x: number; y: number } {
    return {
      x: (touch1.x + touch2.x) / 2,
      y: (touch1.y + touch2.y) / 2
    };
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  public destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    this.clearLongPressTimer();
  }
}

// React hook for touch gestures
export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  handlers: TouchGestureHandlers,
  options: TouchGestureOptions = {}
): void {
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const gestureManager = new TouchGestureManager(element, handlers, options);

    return () => {
      gestureManager.destroy();
    };
  }, [elementRef, handlers, options]);
}

// Orientation change utilities
export interface OrientationChangeHandler {
  onOrientationChange: (orientation: 'portrait' | 'landscape') => void;
  responseTime?: number; // Target response time in ms
}

export function useOrientationChange(handler: OrientationChangeHandler): void {
  React.useEffect(() => {
    let timeoutId: number;
    
    const handleOrientationChange = () => {
      // Clear any pending timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Set timeout to ensure we respond within the target time
      timeoutId = window.setTimeout(() => {
        const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        handler.onOrientationChange(orientation);
      }, Math.min(handler.responseTime || 300, 50)); // Ensure we respond quickly
    };

    // Listen for both orientationchange and resize events
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Initial call
    handleOrientationChange();

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [handler]);
}

// Touch target optimization utilities
export function optimizeTouchTargets(element: HTMLElement): void {
  const MIN_TOUCH_TARGET_SIZE = 44; // iOS HIG recommendation
  
  // Find all interactive elements
  const interactiveElements = element.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [tabindex]'
  );
  
  interactiveElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const rect = htmlEl.getBoundingClientRect();
    
    // Ensure minimum touch target size
    if (rect.width < MIN_TOUCH_TARGET_SIZE || rect.height < MIN_TOUCH_TARGET_SIZE) {
      const style = htmlEl.style;
      style.minWidth = `${MIN_TOUCH_TARGET_SIZE}px`;
      style.minHeight = `${MIN_TOUCH_TARGET_SIZE}px`;
      style.display = style.display || 'inline-flex';
      style.alignItems = 'center';
      style.justifyContent = 'center';
    }
  });
}

// Haptic feedback utilities (where supported)
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    
    navigator.vibrate(patterns[type]);
  }
}