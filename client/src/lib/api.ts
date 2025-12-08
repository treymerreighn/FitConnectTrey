import { apiRequest } from "./queryClient";
import { uploadImage, uploadMultipleImages } from "./imageUpload";
import type { Post, User, Comment, Connection, ProgressEntry, Exercise, InsertPost, InsertComment, InsertConnection, InsertProgressEntry, InsertExercise, Story, InsertStory } from "@shared/schema";

export const api = {
  // Posts
  getPosts: async (): Promise<Post[]> => {
    return await apiRequest("GET", "/api/posts");
  },
  getPost: async (id: string): Promise<Post> => {
    return await apiRequest("GET", `/api/posts/${id}`);
  },
  getUserPosts: async (userId: string): Promise<Post[]> => {
    return await apiRequest("GET", `/api/users/${userId}/posts`);
  },
  createPost: async (post: InsertPost): Promise<Post> => {
    return await apiRequest("POST", "/api/posts", post);
  },
  deletePost: async (id: string): Promise<{ success: boolean }> => {
    return await apiRequest("DELETE", `/api/posts/${id}`);
  },
  updatePost: async (id: string, updates: Partial<Post>): Promise<Post> => {
    return await apiRequest("PUT", `/api/posts/${id}`, updates);
  },
  getTrendingWorkouts: async (hours?: number): Promise<Post[]> => {
    return await apiRequest("GET", `/api/workouts/trending${hours ? `?hours=${hours}` : ""}`);
  },
  
  // Users
  getUsers: async (): Promise<User[]> => {
    return await apiRequest("GET", "/api/users");
  },
  getUser: async (id: string): Promise<User> => {
    return await apiRequest("GET", `/api/users/${id}`);
  },
  getUserById: async (id: string): Promise<User> => {
    return await apiRequest("GET", `/api/users/${id}`);
  },
  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    return await apiRequest("PUT", `/api/users/${id}`, updates);
  },
  getPostsByUserId: async (userId: string): Promise<Post[]> => {
    return await apiRequest("GET", `/api/posts/user/${userId}`);
  },
  getPostsByExerciseTag: async (exerciseName: string, limit?: number): Promise<Post[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    return await apiRequest("GET", `/api/posts/exercise/${encodeURIComponent(exerciseName)}?${params}`);
  },
  
  // Comments
  getComments: async (postId: string): Promise<Comment[]> => {
    return await apiRequest("GET", `/api/posts/${postId}/comments`);
  },
  createComment: async (postId: string, comment: InsertComment): Promise<Comment> => {
    return await apiRequest("POST", `/api/posts/${postId}/comments`, { ...comment, postId });
  },
  
  // Social actions
  likePost: async (postId: string, userId: string): Promise<Post> => {
    return await apiRequest("POST", `/api/posts/${postId}/like`, { userId });
  },
  unlikePost: async (postId: string, userId: string): Promise<Post> => {
    return await apiRequest("POST", `/api/posts/${postId}/unlike`, { userId });
  },
  followUser: async (userId: string, followerId: string): Promise<{ success: boolean }> => {
    return await apiRequest("POST", `/api/users/${userId}/follow`, { followerId });
  },
  unfollowUser: async (userId: string, followerId: string): Promise<{ success: boolean }> => {
    return await apiRequest("POST", `/api/users/${userId}/unfollow`, { followerId });
  },
  
  // Professional connections
  getProfessionals: async (type?: "trainer" | "nutritionist"): Promise<User[]> => {
    return await apiRequest("GET", `/api/professionals${type ? `?type=${type}` : ""}`);
  },
  createConnection: async (connection: InsertConnection): Promise<Connection> => {
    return await apiRequest("POST", "/api/connections", connection);
  },
  getClientConnections: async (clientId: string): Promise<Connection[]> => {
    return await apiRequest("GET", `/api/connections/client/${clientId}`);
  },
  getProfessionalConnections: async (professionalId: string): Promise<Connection[]> => {
    return await apiRequest("GET", `/api/connections/professional/${professionalId}`);
  },
  updateConnection: async (id: string, updates: Partial<Connection>): Promise<Connection> => {
    return await apiRequest("PUT", `/api/connections/${id}`, updates);
  },
  deleteConnection: async (id: string): Promise<{ success: boolean }> => {
    return await apiRequest("DELETE", `/api/connections/${id}`);
  },
  
  // Progress tracking
  createProgressEntry: async (entry: InsertProgressEntry): Promise<ProgressEntry> => {
    return await apiRequest("POST", "/api/progress", entry);
  },
  getProgressEntries: async (userId: string): Promise<ProgressEntry[]> => {
    return await apiRequest("GET", `/api/progress/user/${userId}`);
  },
  getProgressEntry: async (id: string): Promise<ProgressEntry> => {
    return await apiRequest("GET", `/api/progress/${id}`);
  },
  updateProgressEntry: async (id: string, updates: Partial<ProgressEntry>): Promise<ProgressEntry> => {
    return await apiRequest("PUT", `/api/progress/${id}`, updates);
  },
  deleteProgressEntry: async (id: string): Promise<{ success: boolean }> => {
    return await apiRequest("DELETE", `/api/progress/${id}`);
  },
  generateAIInsights: async (id: string, photos: string[]): Promise<ProgressEntry> => {
    return await apiRequest("POST", `/api/progress/${id}/ai-insights`, { photos });
  },

  // Exercise library
  getExercises: async (params?: { category?: string; muscleGroup?: string; search?: string }): Promise<Exercise[]> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append("category", params.category);
    if (params?.muscleGroup) searchParams.append("muscleGroup", params.muscleGroup);
    if (params?.search) searchParams.append("search", params.search);
    
    const queryString = searchParams.toString();
    const url = `/api/exercises${queryString ? `?${queryString}` : ""}`;
    
    return await apiRequest("GET", url);
  },

  getExerciseById: async (id: string): Promise<Exercise> => {
    return await apiRequest("GET", `/api/exercises/${id}`);
  },

  createExercise: async (exercise: InsertExercise): Promise<Exercise> => {
    return await apiRequest("POST", "/api/exercises", exercise);
  },

  updateExercise: async (id: string, updates: Partial<Exercise>): Promise<Exercise> => {
    return await apiRequest("PUT", `/api/exercises/${id}`, updates);
  },

  deleteExercise: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/exercises/${id}`);
  },

  approveExercise: async (id: string): Promise<Exercise> => {
    return await apiRequest("POST", `/api/exercises/${id}/approve`);
  },

  getUserCreatedExercises: async (userId: string): Promise<Exercise[]> => {
    return await apiRequest("GET", `/api/users/${userId}/exercises`);
  },

  // Exercise history (for premium weight tracking and 1RM)
  getExerciseHistory: async (userId: string, exerciseName: string, limit: number = 10): Promise<{
    exerciseName: string;
    history: Array<{ date: string; sets: Array<{ reps: number; weight?: number }>; workoutName?: string }>;
    totalWorkouts: number;
  }> => {
    return await apiRequest("GET", `/api/users/${userId}/exercise-history/${encodeURIComponent(exerciseName)}?limit=${limit}`);
  },

  // Exercise progress
  getExerciseProgress: async (exerciseId: string, userId?: string): Promise<{ date: string; weight?: number; reps: number; oneRepMax?: number }[]> => {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    const queryString = params.toString();
    return await apiRequest("GET", `/api/exercise-progress/${exerciseId}${queryString ? `?${queryString}` : ""}`);
  },

  // Image uploads
  uploadImage: async (file: File) => {
    return await uploadImage(file);
  },
  
  uploadMultipleImages: async (files: File[]) => {
    return await uploadMultipleImages(files);
  },

  // Stories
  createStory: async (story: InsertStory): Promise<Story> => {
    return await apiRequest("POST", "/api/stories", story);
  },

  getActiveStories: async (): Promise<Story[]> => {
    return await apiRequest("GET", "/api/stories");
  },

  getUserStories: async (userId: string): Promise<Story[]> => {
    return await apiRequest("GET", `/api/stories/user/${userId}`);
  },

  viewStory: async (storyId: string, userId: string): Promise<Story> => {
    return await apiRequest("POST", `/api/stories/${storyId}/view`, { userId });
  },

  deleteStory: async (id: string): Promise<{ success: boolean }> => {
    return await apiRequest("DELETE", `/api/stories/${id}`);
  },

  // Saved Meals
  getSavedMeals: async (userId: string): Promise<any[]> => {
    return await apiRequest("GET", `/api/saved-meals?userId=${userId}`);
  },

  saveMeal: async (data: { userId: string; mealId: string; dataSnapshot?: any }): Promise<any> => {
    return await apiRequest("POST", "/api/saved-meals", data);
  },

  deleteSavedMeal: async (id: string, userId: string): Promise<{ success: boolean }> => {
    return await apiRequest("DELETE", `/api/saved-meals/${id}?userId=${userId}`);
  },

  // =========================================================================
  // Strength Insights - AI-powered workout analysis (premium feature)
  // =========================================================================

  generateStrengthInsights: async (data: {
    userId: string;
    postId?: string;
    workoutData: {
      exercises: Array<{
        name: string;
        sets: Array<{ reps: number; weight?: number }>;
      }>;
      duration?: number;
      workoutType?: string;
    };
    userGoals?: string[];
  }): Promise<{
    id: string;
    userId: string;
    postId?: string;
    workoutData: any;
    insights: {
      summary: string;
      volumeAnalysis: string;
      strengthTrends: Array<{ exercise: string; trend: string; note: string }>;
      muscleGroupFocus: string[];
      personalRecords: Array<{ exercise: string; achievement: string; previousBest?: string }>;
      recommendations: string[];
      motivationalMessage: string;
      recoveryTips: string[];
      nextWorkoutSuggestion?: string;
    };
    createdAt: string;
  }> => {
    return await apiRequest("POST", "/api/strength-insights", data);
  },

  getStrengthInsightsByUser: async (userId: string): Promise<any[]> => {
    return await apiRequest("GET", `/api/strength-insights/user/${userId}`);
  },

  getStrengthInsightByPost: async (postId: string): Promise<any | null> => {
    return await apiRequest("GET", `/api/strength-insights/post/${postId}`);
  },

  getStrengthInsight: async (id: string): Promise<any> => {
    return await apiRequest("GET", `/api/strength-insights/${id}`);
  },

  generateWeeklyStrengthSummary: async (data: {
    userId: string;
    userGoals?: string[];
  }): Promise<{
    weeklyVolume: number;
    workoutCount: number;
    topExercises: string[];
    summary: string;
    achievements: string[];
    areasToFocus: string[];
    motivationalMessage: string;
  }> => {
    return await apiRequest("POST", "/api/strength-insights/weekly-summary", data);
  },

  deleteStrengthInsight: async (id: string): Promise<{ success: boolean }> => {
    return await apiRequest("DELETE", `/api/strength-insights/${id}`);
  },
};
