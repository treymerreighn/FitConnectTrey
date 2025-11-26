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
};
