// Performance monitoring utilities for production
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure function execution time
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;
    
    this.metrics.set(name, duration);
    
    if (duration > 100) { // Log slow operations (>100ms)
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  // Measure async function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;
    
    this.metrics.set(name, duration);
    
    if (duration > 500) { // Log slow async operations (>500ms)
      console.warn(`Slow async operation: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  // Get performance metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
  }
}

import React from 'react';

// Lazy loading utility
export function lazyWithPreload<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(importFn);
  
  // Add preload method
  (LazyComponent as any).preload = importFn;
  
  return LazyComponent;
}

// Image optimization utility
export function optimizeImageUrl(url: string, width?: number, height?: number): string {
  if (!url) return '';
  
  // For production, implement CDN transformations
  if (process.env.NODE_ENV === 'production') {
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', '80'); // Quality
    params.set('f', 'webp'); // Format
    
    return `${url}?${params.toString()}`;
  }
  
  return url;
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis - Main chunks:');
    console.log('React:', import('react').then(() => 'Loaded'));
    console.log('React DOM:', import('react-dom').then(() => 'Loaded'));
    console.log('Query Client:', import('@tanstack/react-query').then(() => 'Loaded'));
  }
}

// Export singleton instance
export const perfMonitor = PerformanceMonitor.getInstance();