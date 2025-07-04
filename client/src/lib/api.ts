import { apiRequest } from "./queryClient";
import type { Post, User, Comment, InsertPost, InsertComment } from "@shared/schema";

export const api = {
  // Posts
  getPosts: (): Promise<Post[]> => apiRequest("/api/posts"),
  getPost: (id: string): Promise<Post> => apiRequest(`/api/posts/${id}`),
  getUserPosts: (userId: string): Promise<Post[]> => apiRequest(`/api/users/${userId}/posts`),
  createPost: (post: InsertPost): Promise<Post> => 
    apiRequest("/api/posts", { method: "POST", body: post }),
  deletePost: (id: string): Promise<{ success: boolean }> => 
    apiRequest(`/api/posts/${id}`, { method: "DELETE" }),
  
  // Users
  getUsers: (): Promise<User[]> => apiRequest("/api/users"),
  getUser: (id: string): Promise<User> => apiRequest(`/api/users/${id}`),
  
  // Comments
  getComments: (postId: string): Promise<Comment[]> => 
    apiRequest(`/api/posts/${postId}/comments`),
  createComment: (postId: string, comment: InsertComment): Promise<Comment> => 
    apiRequest(`/api/posts/${postId}/comments`, { method: "POST", body: comment }),
  
  // Social actions
  likePost: (postId: string, userId: string): Promise<Post> => 
    apiRequest(`/api/posts/${postId}/like`, { method: "POST", body: { userId } }),
  unlikePost: (postId: string, userId: string): Promise<Post> => 
    apiRequest(`/api/posts/${postId}/unlike`, { method: "POST", body: { userId } }),
  followUser: (userId: string, followerId: string): Promise<{ success: boolean }> => 
    apiRequest(`/api/users/${userId}/follow`, { method: "POST", body: { followerId } }),
  unfollowUser: (userId: string, followerId: string): Promise<{ success: boolean }> => 
    apiRequest(`/api/users/${userId}/unfollow`, { method: "POST", body: { followerId } }),
};
