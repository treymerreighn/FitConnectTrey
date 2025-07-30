// Production analytics and monitoring utilities
export class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private events: any[] = [];

  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  // Track user interactions for optimization
  trackEvent(eventName: string, properties?: Record<string, any>) {
    if (process.env.NODE_ENV === 'production') {
      const event = {
        name: eventName,
        properties,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      this.events.push(event);
      
      // Send to analytics service in production
      this.sendToAnalytics(event);
    }
  }

  // Track workout completion
  trackWorkoutComplete(workoutData: {
    duration: number;
    exerciseCount: number;
    totalVolume: number;
  }) {
    this.trackEvent('workout_completed', {
      duration_minutes: workoutData.duration,
      exercise_count: workoutData.exerciseCount,
      total_volume: workoutData.totalVolume,
      platform: 'web'
    });
  }

  // Track exercise progress views
  trackExerciseProgress(exerciseName: string, timeSpent: number) {
    this.trackEvent('exercise_progress_viewed', {
      exercise_name: exerciseName,
      time_spent_seconds: timeSpent,
      feature: 'progress_charts'
    });
  }

  // Track performance metrics
  trackPerformance(metricName: string, value: number) {
    this.trackEvent('performance_metric', {
      metric: metricName,
      value,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    });
  }

  private sendToAnalytics(event: any) {
    // In production, send to your analytics service
    // Example: Google Analytics, Mixpanel, etc.
    if (typeof gtag !== 'undefined') {
      gtag('event', event.name, event.properties);
    }
  }

  // Get analytics data for optimization
  getAnalyticsData() {
    return this.events;
  }
}

// Core Web Vitals tracking
export function trackWebVitals() {
  if (process.env.NODE_ENV === 'production') {
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      const analytics = AnalyticsTracker.getInstance();
      
      onCLS(metric => analytics.trackPerformance('CLS', metric.value));
      onFID(metric => analytics.trackPerformance('FID', metric.value));
      onFCP(metric => analytics.trackPerformance('FCP', metric.value));
      onLCP(metric => analytics.trackPerformance('LCP', metric.value));
      onTTFB(metric => analytics.trackPerformance('TTFB', metric.value));
    });
  }
}

export const analytics = AnalyticsTracker.getInstance();