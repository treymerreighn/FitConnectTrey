import { apiRequest } from "./queryClient";
import type { Post, User, Comment, Connection, ProgressEntry, Exercise, InsertPost, InsertComment, InsertConnection, InsertProgressEntry, InsertExercise } from "@shared/schema";

export const api = {
  // Posts
  getPosts: async (): Promise<Post[]> => {
    const res = await apiRequest("GET", "/api/posts");
    return res.json();
  },
  getPost: async (id: string): Promise<Post> => {
    const res = await apiRequest("GET", `/api/posts/${id}`);
    return res.json();
  },
  getUserPosts: async (userId: string): Promise<Post[]> => {
    const res = await apiRequest("GET", `/api/users/${userId}/posts`);
    return res.json();
  },
  createPost: async (post: InsertPost): Promise<Post> => {
    const res = await apiRequest("POST", "/api/posts", post);
    return res.json();
  },
  deletePost: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiRequest("DELETE", `/api/posts/${id}`);
    return res.json();
  },
  getTrendingWorkouts: async (hours?: number): Promise<Post[]> => {
    const res = await apiRequest("GET", `/api/workouts/trending${hours ? `?hours=${hours}` : ""}`);
    return res.json();
  },
  
  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await apiRequest("GET", "/api/users");
    return res.json();
  },
  getUser: async (id: string): Promise<User> => {
    const res = await apiRequest("GET", `/api/users/${id}`);
    return res.json();
  },
  
  // Comments
  getComments: async (postId: string): Promise<Comment[]> => {
    const res = await apiRequest("GET", `/api/posts/${postId}/comments`);
    return res.json();
  },
  createComment: async (postId: string, comment: InsertComment): Promise<Comment> => {
    const res = await apiRequest("POST", `/api/posts/${postId}/comments`, { ...comment, postId });
    return res.json();
  },
  
  // Social actions
  likePost: async (postId: string, userId: string): Promise<Post> => {
    const res = await apiRequest("POST", `/api/posts/${postId}/like`, { userId });
    return res.json();
  },
  unlikePost: async (postId: string, userId: string): Promise<Post> => {
    const res = await apiRequest("POST", `/api/posts/${postId}/unlike`, { userId });
    return res.json();
  },
  followUser: async (userId: string, followerId: string): Promise<{ success: boolean }> => {
    const res = await apiRequest("POST", `/api/users/${userId}/follow`, { followerId });
    return res.json();
  },
  unfollowUser: async (userId: string, followerId: string): Promise<{ success: boolean }> => {
    const res = await apiRequest("POST", `/api/users/${userId}/unfollow`, { followerId });
    return res.json();
  },
  
  // Professional connections
  getProfessionals: async (type?: "trainer" | "nutritionist"): Promise<User[]> => {
    const res = await apiRequest("GET", `/api/professionals${type ? `?type=${type}` : ""}`);
    return res.json();
  },
  createConnection: async (connection: InsertConnection): Promise<Connection> => {
    const res = await apiRequest("POST", "/api/connections", connection);
    return res.json();
  },
  getClientConnections: async (clientId: string): Promise<Connection[]> => {
    const res = await apiRequest("GET", `/api/connections/client/${clientId}`);
    return res.json();
  },
  getProfessionalConnections: async (professionalId: string): Promise<Connection[]> => {
    const res = await apiRequest("GET", `/api/connections/professional/${professionalId}`);
    return res.json();
  },
  updateConnection: async (id: string, updates: Partial<Connection>): Promise<Connection> => {
    const res = await apiRequest("PUT", `/api/connections/${id}`, updates);
    return res.json();
  },
  deleteConnection: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiRequest("DELETE", `/api/connections/${id}`);
    return res.json();
  },
  
  // Progress tracking
  createProgressEntry: async (entry: InsertProgressEntry): Promise<ProgressEntry> => {
    const res = await apiRequest("POST", "/api/progress", entry);
    return res.json();
  },
  getProgressEntries: async (userId: string): Promise<ProgressEntry[]> => {
    const res = await apiRequest("GET", `/api/progress/user/${userId}`);
    return res.json();
  },
  getProgressEntry: async (id: string): Promise<ProgressEntry> => {
    const res = await apiRequest("GET", `/api/progress/${id}`);
    return res.json();
  },
  updateProgressEntry: async (id: string, updates: Partial<ProgressEntry>): Promise<ProgressEntry> => {
    const res = await apiRequest("PUT", `/api/progress/${id}`, updates);
    return res.json();
  },
  deleteProgressEntry: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiRequest("DELETE", `/api/progress/${id}`);
    return res.json();
  },
  generateAIInsights: async (id: string, photos: string[]): Promise<ProgressEntry> => {
    const res = await apiRequest("POST", `/api/progress/${id}/ai-insights`, { photos });
    return res.json();
  },

  // Exercise library
  getExercises: async (params?: { category?: string; muscleGroup?: string; search?: string }): Promise<Exercise[]> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append("category", params.category);
    if (params?.muscleGroup) searchParams.append("muscleGroup", params.muscleGroup);
    if (params?.search) searchParams.append("search", params.search);
    
    const queryString = searchParams.toString();
    const url = `/api/exercises${queryString ? `?${queryString}` : ""}`;
    
    const res = await apiRequest("GET", url);
    return res.json();
  },

  getExerciseById: async (id: string): Promise<Exercise> => {
    const res = await apiRequest("GET", `/api/exercises/${id}`);
    return res.json();
  },

  createExercise: async (exercise: InsertExercise): Promise<Exercise> => {
    const res = await apiRequest("POST", "/api/exercises", exercise);
    return res.json();
  },

  updateExercise: async (id: string, updates: Partial<Exercise>): Promise<Exercise> => {
    const res = await apiRequest("PUT", `/api/exercises/${id}`, updates);
    return res.json();
  },

  deleteExercise: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/exercises/${id}`);
  },

  approveExercise: async (id: string): Promise<Exercise> => {
    const res = await apiRequest("POST", `/api/exercises/${id}/approve`);
    return res.json();
  },

  getUserCreatedExercises: async (userId: string): Promise<Exercise[]> => {
    const res = await apiRequest("GET", `/api/users/${userId}/exercises`);
    return res.json();
  },
};
