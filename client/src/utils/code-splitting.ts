// Route-based code splitting optimization
export const routePreloader = {
  // Preload routes based on user behavior
  preloadOnHover: (routeName: string) => {
    const preloadMap: Record<string, () => Promise<any>> = {
      'exercise-progress': () => import('../pages/exercise-progress'),
      'workout-session': () => import('../pages/workout-session'),
      'build-workout': () => import('../pages/build-workout'),
      'exercise-library': () => import('../pages/exercise-library'),
      'admin': () => import('../pages/admin-dashboard'),
    };

    const preloadFn = preloadMap[routeName];
    if (preloadFn) {
      // Preload with slight delay to avoid unnecessary requests
      setTimeout(preloadFn, 100);
    }
  },

  // Preload critical routes on app load
  preloadCritical: () => {
    // Preload commonly used components
    setTimeout(() => {
      import('../pages/workout-session');
      import('../pages/exercise-library');
    }, 2000);
  }
};

// Bundle size monitoring
export function logBundleInfo() {
  if (process.env.NODE_ENV === 'development') {
    console.group('Bundle Analysis');
    console.log('Main bundle loaded');
    
    // Log when major chunks load
    const originalImport = (window as any).__webpack_require__ || ((module: string) => import(module));
    
    console.groupEnd();
  }
}