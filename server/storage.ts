import type { User, Post, Comment, InsertUser, InsertPost, InsertComment } from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Posts
  createPost(post: InsertPost): Promise<Post>;
  getPostById(id: string): Promise<Post | null>;
  getAllPosts(): Promise<Post[]>;
  getPostsByUserId(userId: string): Promise<Post[]>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post>;
  deletePost(id: string): Promise<boolean>;
  getTrendingWorkouts(hours?: number): Promise<Post[]>;
  
  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByPostId(postId: string): Promise<Comment[]>;
  deleteComment(id: string): Promise<boolean>;
  
  // Social actions
  likePost(postId: string, userId: string): Promise<Post>;
  unlikePost(postId: string, userId: string): Promise<Post>;
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private posts: Map<string, Post> = new Map();
  private comments: Map<string, Comment> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create sample users
    const users: User[] = [
      {
        id: "user1",
        name: "Sarah Mitchell",
        username: "sarahfitness",
        email: "sarah@example.com",
        avatar: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=150&h=150&fit=crop&crop=face",
        bio: "Fitness enthusiast • Personal trainer • Nutrition coach",
        fitnessGoals: ["Weight Loss", "Strength Training"],
        followers: ["user2", "user3"],
        following: ["user2", "user4"],
        createdAt: new Date('2024-01-15'),
      },
      {
        id: "user2",
        name: "Mike Rodriguez",
        username: "mikestrong",
        email: "mike@example.com",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        bio: "Nutritionist • Meal prep expert • Clean eating advocate",
        fitnessGoals: ["Muscle Building", "Nutrition"],
        followers: ["user1", "user3", "user4"],
        following: ["user1", "user3"],
        createdAt: new Date('2024-01-10'),
      },
      {
        id: "user3",
        name: "Emma Thompson",
        username: "emmatransform",
        email: "emma@example.com",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        bio: "Transformation coach • Progress documentation • Motivation",
        fitnessGoals: ["Weight Loss", "Body Recomposition"],
        followers: ["user1", "user2"],
        following: ["user1", "user2", "user4"],
        createdAt: new Date('2024-01-20'),
      },
      {
        id: "user4",
        name: "Jessica Chen",
        username: "jessyoga",
        email: "jessica@example.com",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b890?w=150&h=150&fit=crop&crop=face",
        bio: "Yoga instructor • HIIT specialist • Mindful movement",
        fitnessGoals: ["Flexibility", "Cardio Fitness"],
        followers: ["user2", "user3"],
        following: ["user1", "user2"],
        createdAt: new Date('2024-01-25'),
      },
    ];

    // Create sample posts
    const posts: Post[] = [
      {
        id: "post1",
        userId: "user1",
        type: "workout",
        caption: "Crushed today's upper body session! 💪 Feeling stronger every day. Who's joining me tomorrow for legs?",
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"],
        likes: ["user2", "user3", "user4"],
        comments: ["comment1", "comment2"],
        workoutData: {
          workoutType: "Upper Body Strength",
          duration: 45,
          calories: 320,
          exercises: [
            {
              name: "Bench Press",
              sets: [
                { reps: 12, weight: 185 },
                { reps: 10, weight: 205 },
                { reps: 8, weight: 225 },
                { reps: 6, weight: 245 }
              ],
              notes: "Felt strong today, increased weight from last week"
            },
            {
              name: "Pull-ups",
              sets: [
                { reps: 12 },
                { reps: 10 },
                { reps: 8 },
                { reps: 6 }
              ]
            },
            {
              name: "Dumbbell Rows",
              sets: [
                { reps: 12, weight: 80 },
                { reps: 12, weight: 80 },
                { reps: 12, weight: 80 }
              ]
            }
          ],
          // Legacy fields for backward compatibility
          sets: 4,
          reps: "12-15",
        },
        createdAt: new Date('2024-07-04T10:00:00Z'),
      },
      {
        id: "post2",
        userId: "user2",
        type: "nutrition",
        caption: "Perfect post-workout fuel! 🥗 Grilled chicken, quinoa, and fresh veggies. Simple, clean, effective.",
        images: ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop"],
        likes: ["user1", "user3"],
        comments: ["comment3"],
        nutritionData: {
          mealType: "Post-Workout",
          calories: 485,
          protein: 42,
          carbs: 35,
          fat: 18,
        },
        createdAt: new Date('2024-07-04T08:00:00Z'),
      },
      {
        id: "post3",
        userId: "user3",
        type: "progress",
        caption: "3 months of consistency! 💯 Down 15lbs and feeling incredible. Thank you to everyone for the support! 🙏",
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"],
        likes: ["user1", "user2", "user4"],
        comments: ["comment4", "comment5"],
        progressData: {
          progressType: "3 Month Update",
          weightLost: "15 lbs",
          bodyFat: "-4.2%",
          muscleGain: "+3 lbs",
          duration: "3 months",
        },
        createdAt: new Date('2024-07-04T06:00:00Z'),
      },
    ];

    // Store users and posts
    users.forEach(user => this.users.set(user.id, user));
    posts.forEach(post => this.posts.set(post.id, post));
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: nanoid(),
      ...user,
      followers: [],
      following: [],
      createdAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const users = Array.from(this.users.values());
    return users.find(user => user.username === username) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createPost(post: InsertPost): Promise<Post> {
    const newPost: Post = {
      id: nanoid(),
      ...post,
      likes: [],
      comments: [],
      createdAt: new Date(),
    };
    this.posts.set(newPost.id, newPost);
    return newPost;
  }

  async getPostById(id: string): Promise<Post | null> {
    return this.posts.get(id) || null;
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getPostsByUserId(userId: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) throw new Error("Post not found");
    
    const updatedPost = { ...post, ...updates };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async deletePost(id: string): Promise<boolean> {
    return this.posts.delete(id);
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const newComment: Comment = {
      id: nanoid(),
      ...comment,
      createdAt: new Date(),
    };
    this.comments.set(newComment.id, newComment);
    
    // Add comment ID to post
    const post = await this.getPostById(comment.postId);
    if (post) {
      post.comments.push(newComment.id);
      this.posts.set(post.id, post);
    }
    
    return newComment;
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  async likePost(postId: string, userId: string): Promise<Post> {
    const post = this.posts.get(postId);
    if (!post) throw new Error("Post not found");
    
    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      this.posts.set(postId, post);
    }
    
    return post;
  }

  async unlikePost(postId: string, userId: string): Promise<Post> {
    const post = this.posts.get(postId);
    if (!post) throw new Error("Post not found");
    
    post.likes = post.likes.filter(id => id !== userId);
    this.posts.set(postId, post);
    
    return post;
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    const follower = this.users.get(followerId);
    const following = this.users.get(followingId);
    
    if (!follower || !following) throw new Error("User not found");
    
    if (!follower.following.includes(followingId)) {
      follower.following.push(followingId);
      this.users.set(followerId, follower);
    }
    
    if (!following.followers.includes(followerId)) {
      following.followers.push(followerId);
      this.users.set(followingId, following);
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const follower = this.users.get(followerId);
    const following = this.users.get(followingId);
    
    if (!follower || !following) throw new Error("User not found");
    
    follower.following = follower.following.filter(id => id !== followingId);
    following.followers = following.followers.filter(id => id !== followerId);
    
    this.users.set(followerId, follower);
    this.users.set(followingId, following);
  }

  async getTrendingWorkouts(hours: number = 24): Promise<Post[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return Array.from(this.posts.values())
      .filter(post => 
        post.type === "workout" && 
        new Date(post.createdAt) >= cutoffTime
      )
      .sort((a, b) => {
        // Sort by engagement score (likes + comments)
        const aScore = a.likes.length + a.comments.length;
        const bScore = b.likes.length + b.comments.length;
        return bScore - aScore;
      })
      .slice(0, 10); // Return top 10 trending workouts
  }
}

export const storage = new MemStorage();
