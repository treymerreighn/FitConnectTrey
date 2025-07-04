import { apiRequest } from "./queryClient";
import type { Post, User, Comment, InsertPost, InsertComment } from "@shared/schema";

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
};
