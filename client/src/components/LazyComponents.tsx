import { lazy } from 'react';

// Lazy loaded components for better performance
export const LazyExerciseProgress = lazy(() => import('../pages/exercise-progress'));
export const LazyWorkoutSession = lazy(() => import('../pages/workout-session'));
export const LazyBuildWorkout = lazy(() => import('../pages/build-workout'));
export const LazyExerciseLibrary = lazy(() => import('../pages/exercise-library'));
export const LazyTestUpload = lazy(() => import('../pages/test-upload'));
export const LazyAdminDashboard = lazy(() => import('../pages/admin-dashboard'));

// Preload functions for better UX
export const preloadComponents = {
  exerciseProgress: () => import('../pages/exercise-progress'),
  workoutSession: () => import('../pages/workout-session'),
  buildWorkout: () => import('../pages/build-workout'),
  exerciseLibrary: () => import('../pages/exercise-library'),
  testUpload: () => import('../pages/test-upload'),
  adminDashboard: () => import('../pages/admin-dashboard')
};