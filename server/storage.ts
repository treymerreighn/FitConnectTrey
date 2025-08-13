import type { User, Post, Comment, Connection, ProgressEntry, Exercise, WorkoutSession, ExerciseProgress, Recipe, CommunityMeal, ProgressInsight, InsertUser, InsertPost, InsertComment, InsertConnection, InsertProgressEntry, InsertExercise, InsertWorkoutSession, InsertExerciseProgress, InsertProgressInsight } from "@shared/schema";
import { nanoid } from "nanoid";
import { PgStorage } from "./pg-storage";

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: { id: string; email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null; }): Promise<User>;
  
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
  
  // Professional connections
  createConnection(connection: InsertConnection): Promise<Connection>;
  getConnectionById(id: string): Promise<Connection | null>;
  getConnectionsByClientId(clientId: string): Promise<Connection[]>;
  getConnectionsByProfessionalId(professionalId: string): Promise<Connection[]>;
  updateConnection(id: string, updates: Partial<Connection>): Promise<Connection>;
  deleteConnection(id: string): Promise<boolean>;
  getProfessionals(type?: "trainer" | "nutritionist"): Promise<User[]>;
  
  // Progress tracking
  createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry>;
  getProgressEntryById(id: string): Promise<ProgressEntry | null>;
  getProgressEntriesByUserId(userId: string): Promise<ProgressEntry[]>;
  updateProgressEntry(id: string, updates: Partial<ProgressEntry>): Promise<ProgressEntry>;
  deleteProgressEntry(id: string): Promise<boolean>;
  generateAIInsights(entryId: string, photos: string[]): Promise<ProgressEntry>;
  
  // Exercise library
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  getExerciseById(id: string): Promise<Exercise | null>;
  getAllExercises(): Promise<Exercise[]>;
  getExercisesByCategory(category: string): Promise<Exercise[]>;
  getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]>;
  searchExercises(query: string): Promise<Exercise[]>;
  updateExercise(id: string, updates: Partial<Exercise>): Promise<Exercise>;
  deleteExercise(id: string): Promise<boolean>;
  approveUserExercise(id: string): Promise<Exercise>;
  getUserCreatedExercises(userId: string): Promise<Exercise[]>;
  
  // Workout template operations
  getWorkoutTemplates(filters?: { category?: string; difficulty?: string; bodyPart?: string }): Promise<Post[]>;
  
  // Workout session tracking
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  getWorkoutSessionById(id: string): Promise<WorkoutSession | null>;
  getWorkoutSessionsByUserId(userId: string): Promise<WorkoutSession[]>;
  updateWorkoutSession(id: string, updates: Partial<WorkoutSession>): Promise<WorkoutSession>;
  deleteWorkoutSession(id: string): Promise<boolean>;
  
  // Exercise progress tracking
  createExerciseProgress(progress: InsertExerciseProgress): Promise<ExerciseProgress>;
  getExerciseProgressById(id: string): Promise<ExerciseProgress | null>;
  getExerciseProgressByUserId(userId: string): Promise<ExerciseProgress[]>;
  getExerciseProgressByExercise(userId: string, exerciseId: string): Promise<ExerciseProgress[]>;
  updateExerciseProgress(id: string, updates: Partial<ExerciseProgress>): Promise<ExerciseProgress>;
  deleteExerciseProgress(id: string): Promise<boolean>;
  
  // Analytics and insights
  getExerciseProgressChart(userId: string, exerciseId: string): Promise<{ date: string; weight?: number; reps: number; oneRepMax?: number }[]>;
  getWorkoutVolumeChart(userId: string): Promise<{ date: string; volume: number; duration: number }[]>;
  getUserPersonalRecords(userId: string): Promise<ExerciseProgress[]>;
  
  // Recipe database operations
  addRecipe(recipe: Recipe): Promise<Recipe>;
  getRecipeById(id: string): Promise<Recipe | null>;
  getAllRecipes(): Promise<Recipe[]>;
  getRecipesByCategory(category: string): Promise<Recipe[]>;
  getRecipesByDietaryTags(tags: string[]): Promise<Recipe[]>;
  searchRecipes(query: string): Promise<Recipe[]>;
  getRandomRecipes(count: number): Promise<Recipe[]>;
  
  // Community meal operations
  createCommunityMeal(meal: CommunityMeal): Promise<CommunityMeal>;
  getCommunityMealById(id: string): Promise<CommunityMeal | null>;
  getAllCommunityMeals(): Promise<CommunityMeal[]>;
  updateCommunityMeal(id: string, updates: Partial<CommunityMeal>): Promise<CommunityMeal>;
  deleteCommunityMeal(id: string): Promise<boolean>;

  // Progress insights operations - AI photo analysis (premium feature)  
  createProgressInsight(insight: InsertProgressInsight): Promise<ProgressInsight>;
  getProgressInsightsByUserId(userId: string): Promise<ProgressInsight[]>;
  getProgressInsight(id: string): Promise<ProgressInsight | null>;
  deleteProgressInsight(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private posts: Map<string, Post> = new Map();
  private comments: Map<string, Comment> = new Map();
  private connections: Map<string, Connection> = new Map();
  private progressEntries: Map<string, ProgressEntry> = new Map();
  private exercises: Map<string, Exercise> = new Map();
  private workoutSessions: Map<string, WorkoutSession> = new Map();
  private exerciseProgress: Map<string, ExerciseProgress> = new Map();
  private recipes: Map<string, Recipe> = new Map();
  private communityMeals: Map<string, CommunityMeal> = new Map();
  private progressInsights: Map<string, ProgressInsight> = new Map();

  constructor() {
    this.seedData();
    this.seedExercises();
  }

  private seedExercises() {
    const basicExercises: Exercise[] = [
      {
        id: "bench-press",
        name: "Bench Press",
        category: "strength",
        muscleGroups: ["chest", "triceps", "delts"],
        equipment: ["barbell", "bench"],
        difficulty: "intermediate",
        description: "A compound upper body exercise that primarily targets the chest muscles.",
        instructions: [
          "Lie flat on the bench with feet firmly planted on the ground",
          "Grip the barbell with hands slightly wider than shoulder width",
          "Lower the bar to your chest in a controlled manner",
          "Press the bar back up to starting position"
        ],
        tips: ["Keep shoulder blades retracted", "Don't bounce the bar off your chest"],
        safetyNotes: ["Always use a spotter when lifting heavy"],
        images: [],
        videos: [],
        variations: ["Incline Bench Press", "Decline Bench Press"],
        tags: ["compound", "pushing"],
        isUserCreated: false,
        isApproved: true,
        createdAt: new Date(),
      },
      {
        id: "squats",
        name: "Squats",
        category: "strength",
        muscleGroups: ["quadriceps", "glutes", "hamstrings"],
        equipment: ["bodyweight", "barbell"],
        difficulty: "beginner",
        description: "A fundamental lower body exercise that builds strength and mobility.",
        instructions: [
          "Stand with feet shoulder-width apart",
          "Lower your body by bending at hips and knees",
          "Go down until thighs are parallel to ground",
          "Drive through heels to return to standing"
        ],
        tips: ["Keep knees in line with toes", "Keep chest up"],
        safetyNotes: ["Don't go deeper than mobility allows"],
        images: [],
        videos: [],
        variations: ["Goblet Squats", "Front Squats"],
        tags: ["compound", "lower-body"],
        isUserCreated: false,
        isApproved: true,
        createdAt: new Date(),
      },
      {
        id: "deadlift",
        name: "Deadlift",
        category: "strength",
        muscleGroups: ["back", "glutes", "hamstrings"],
        equipment: ["barbell"],
        difficulty: "advanced",
        description: "A full-body compound movement targeting multiple muscle groups.",
        instructions: [
          "Stand with feet hip-width apart, bar over mid-foot",
          "Bend at hips and knees to grip the bar",
          "Keep back straight and chest up",
          "Drive through heels to lift the bar"
        ],
        tips: ["Keep bar close to body", "Focus on hip hinge"],
        safetyNotes: ["Learn proper form before adding weight"],
        images: [],
        videos: [],
        variations: ["Romanian Deadlift", "Sumo Deadlift"],
        tags: ["compound", "full-body"],
        isUserCreated: false,
        isApproved: true,
        createdAt: new Date(),
      },
      {
        id: "push-ups",
        name: "Push-ups",
        category: "strength",
        muscleGroups: ["chest", "triceps", "delts"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        description: "A bodyweight exercise for upper body strength.",
        instructions: [
          "Start in plank position with hands shoulder-width apart",
          "Lower body until chest nearly touches ground",
          "Push back up to starting position",
          "Keep body in straight line"
        ],
        tips: ["Engage core", "Focus on quality over quantity"],
        safetyNotes: ["Modify on knees if needed"],
        images: [],
        videos: [],
        variations: ["Diamond Push-ups", "Wide-grip Push-ups"],
        tags: ["bodyweight", "compound"],
        isUserCreated: false,
        isApproved: true,
        createdAt: new Date(),
      },
      {
        id: "plank",
        name: "Plank",
        category: "strength",
        muscleGroups: ["abs", "back"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        description: "An isometric core exercise that builds stability.",
        instructions: [
          "Start in push-up position with forearms on ground",
          "Keep body in straight line from head to heels",
          "Hold position for desired time",
          "Breathe normally throughout"
        ],
        tips: ["Don't let hips sag", "Keep core engaged"],
        safetyNotes: ["Stop if lower back pain occurs"],
        images: [],
        videos: [],
        variations: ["Side Plank", "Plank with Leg Lifts"],
        tags: ["core", "isometric"],
        isUserCreated: false,
        isApproved: true,
        createdAt: new Date(),
      }
    ];

    basicExercises.forEach(exercise => {
      this.exercises.set(exercise.id, exercise);
    });
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
        isVerified: true,
        professionalType: "trainer",
        certifications: ["NASM-CPT", "ACSM-CPT"],
        specialties: ["Strength Training", "Weight Loss", "Functional Movement"],
        experience: "5+ years helping clients achieve their fitness goals",
        hourlyRate: 75,
        clients: ["user3", "user4"],
        trainers: [],
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
        isVerified: true,
        professionalType: "nutritionist",
        certifications: ["RD", "CSCS"],
        specialties: ["Meal Planning", "Sports Nutrition", "Weight Management"],
        experience: "8+ years in clinical and sports nutrition",
        hourlyRate: 85,
        clients: ["user1", "user3"],
        trainers: [],
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
        isVerified: false,
        certifications: [],
        specialties: [],
        clients: [],
        trainers: ["user1", "user2"],
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
        isVerified: false,
        certifications: [],
        specialties: [],
        clients: [],
        trainers: ["user1"],
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

  async upsertUser(userData: { id: string; email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null; }): Promise<User> {
    const existingUser = this.users.get(userData.id);
    
    if (existingUser) {
      // Update existing user
      const updatedUser = {
        ...existingUser,
        email: userData.email || existingUser.email,
        name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}`
          : existingUser.name,
        avatar: userData.profileImageUrl || existingUser.avatar,
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        id: userData.id,
        username: userData.email?.split('@')[0] || `user${userData.id.slice(-4)}`,
        email: userData.email || '',
        name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}`
          : userData.firstName || userData.lastName || 'Anonymous User',
        bio: "New to FitConnect! 💪",
        avatar: userData.profileImageUrl,
        isVerified: false,
        isPremium: true, // Enable premium access for AI insights testing
        subscriptionTier: "premium",
        followers: [],
        following: [],
        certifications: [],
        specialties: [],
        clients: [],
        trainers: [],
        createdAt: new Date(),
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
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

  // Professional connection methods
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const newConnection: Connection = {
      id: nanoid(),
      ...connection,
      createdAt: new Date(),
    };
    
    this.connections.set(newConnection.id, newConnection);
    return newConnection;
  }

  async getConnectionById(id: string): Promise<Connection | null> {
    return this.connections.get(id) || null;
  }

  async getConnectionsByClientId(clientId: string): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      connection => connection.clientId === clientId
    );
  }

  async getConnectionsByProfessionalId(professionalId: string): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      connection => connection.professionalId === professionalId
    );
  }

  async updateConnection(id: string, updates: Partial<Connection>): Promise<Connection> {
    const connection = this.connections.get(id);
    if (!connection) throw new Error("Connection not found");
    
    const updatedConnection = { ...connection, ...updates };
    this.connections.set(id, updatedConnection);
    return updatedConnection;
  }

  async deleteConnection(id: string): Promise<boolean> {
    return this.connections.delete(id);
  }

  async getProfessionals(type?: "trainer" | "nutritionist"): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => {
      if (!user.isVerified) return false;
      if (type && user.professionalType !== type) return false;
      return true;
    });
  }

  // Progress tracking methods
  async createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry> {
    const newEntry: ProgressEntry = {
      id: nanoid(),
      ...entry,
      createdAt: new Date(),
    };
    
    this.progressEntries.set(newEntry.id, newEntry);
    return newEntry;
  }

  async getProgressEntryById(id: string): Promise<ProgressEntry | null> {
    return this.progressEntries.get(id) || null;
  }

  async getProgressEntriesByUserId(userId: string): Promise<ProgressEntry[]> {
    return Array.from(this.progressEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async updateProgressEntry(id: string, updates: Partial<ProgressEntry>): Promise<ProgressEntry> {
    const entry = this.progressEntries.get(id);
    if (!entry) throw new Error("Progress entry not found");
    
    const updatedEntry = { ...entry, ...updates };
    this.progressEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteProgressEntry(id: string): Promise<boolean> {
    return this.progressEntries.delete(id);
  }

  async generateAIInsights(entryId: string, photos: string[]): Promise<ProgressEntry> {
    const entry = this.progressEntries.get(entryId);
    if (!entry) throw new Error("Progress entry not found");

    // Simulate AI analysis - in real implementation, this would call OpenAI API
    const mockInsights = {
      bodyComposition: "Based on the progress photos, there appears to be noticeable muscle definition improvement and reduction in body fat percentage.",
      progressAnalysis: "Your transformation shows consistent progress over time. The changes in muscle tone and overall physique indicate your current routine is effective.",
      recommendations: [
        "Continue with current strength training routine",
        "Consider increasing protein intake to support muscle growth",
        "Maintain consistent sleep schedule for optimal recovery"
      ],
      confidenceScore: 0.85,
      generatedAt: new Date(),
    };

    const updatedEntry = {
      ...entry,
      aiInsights: mockInsights,
    };

    this.progressEntries.set(entryId, updatedEntry);
    return updatedEntry;
  }

  // Exercise library methods
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const newExercise: Exercise = {
      id: nanoid(),
      ...exercise,
      createdAt: new Date(),
    };
    
    this.exercises.set(newExercise.id, newExercise);
    return newExercise;
  }

  async getExerciseById(id: string): Promise<Exercise | null> {
    return this.exercises.get(id) || null;
  }

  async getAllExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.muscleGroups.includes(muscleGroup as any))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async searchExercises(query: string): Promise<Exercise[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.exercises.values())
      .filter(exercise => 
        exercise.name.toLowerCase().includes(lowercaseQuery) ||
        exercise.description.toLowerCase().includes(lowercaseQuery) ||
        exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||
        exercise.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateExercise(id: string, updates: Partial<Exercise>): Promise<Exercise> {
    const exercise = this.exercises.get(id);
    if (!exercise) throw new Error("Exercise not found");
    
    const updatedExercise = { ...exercise, ...updates };
    this.exercises.set(id, updatedExercise);
    return updatedExercise;
  }

  async deleteExercise(id: string): Promise<boolean> {
    return this.exercises.delete(id);
  }

  async approveUserExercise(id: string): Promise<Exercise> {
    const exercise = this.exercises.get(id);
    if (!exercise) throw new Error("Exercise not found");
    
    const updatedExercise = { ...exercise, isApproved: true };
    this.exercises.set(id, updatedExercise);
    return updatedExercise;
  }

  async getUserCreatedExercises(userId: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.createdBy === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getWorkoutTemplates(filters?: { category?: string; difficulty?: string; bodyPart?: string }): Promise<Post[]> {
    const allPosts = Array.from(this.posts.values());
    return allPosts.filter(post => 
      post.type === "workout_template" || 
      (post.workoutData && post.isTemplate)
    );
  }

  // Workout session tracking methods
  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const newSession: WorkoutSession = {
      id: nanoid(),
      ...session,
      createdAt: new Date(),
    };
    
    this.workoutSessions.set(newSession.id, newSession);
    
    // Also create exercise progress records for each exercise
    for (const exercise of session.exercises) {
      const bestSet = exercise.sets.reduce((best, current) => {
        const currentScore = (current.weight || 0) * current.reps + (current.duration || 0);
        const bestScore = (best.weight || 0) * best.reps + (best.duration || 0);
        return currentScore > bestScore ? current : best;
      });

      const progressEntry: InsertExerciseProgress = {
        userId: session.userId,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        date: session.startTime,
        bestSet: {
          reps: bestSet.reps,
          weight: bestSet.weight,
          duration: bestSet.duration,
          oneRepMax: bestSet.weight ? Math.round(bestSet.weight * (1 + bestSet.reps / 30)) : undefined,
        },
        totalVolume: exercise.totalVolume,
        personalRecord: exercise.personalRecord,
        workoutSessionId: newSession.id,
      };

      await this.createExerciseProgress(progressEntry);
    }
    
    return newSession;
  }

  async getWorkoutSessionById(id: string): Promise<WorkoutSession | null> {
    return this.workoutSessions.get(id) || null;
  }

  async getWorkoutSessionsByUserId(userId: string): Promise<WorkoutSession[]> {
    return Array.from(this.workoutSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async updateWorkoutSession(id: string, updates: Partial<WorkoutSession>): Promise<WorkoutSession> {
    const session = this.workoutSessions.get(id);
    if (!session) throw new Error("Workout session not found");
    
    const updatedSession = { ...session, ...updates };
    this.workoutSessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteWorkoutSession(id: string): Promise<boolean> {
    return this.workoutSessions.delete(id);
  }

  // Exercise progress tracking methods
  async createExerciseProgress(progress: InsertExerciseProgress): Promise<ExerciseProgress> {
    const newProgress: ExerciseProgress = {
      id: nanoid(),
      ...progress,
      createdAt: new Date(),
    };
    
    this.exerciseProgress.set(newProgress.id, newProgress);
    return newProgress;
  }

  async getExerciseProgressById(id: string): Promise<ExerciseProgress | null> {
    return this.exerciseProgress.get(id) || null;
  }

  async getExerciseProgressByUserId(userId: string): Promise<ExerciseProgress[]> {
    return Array.from(this.exerciseProgress.values())
      .filter(progress => progress.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExerciseProgressByExercise(userId: string, exerciseId: string): Promise<ExerciseProgress[]> {
    return Array.from(this.exerciseProgress.values())
      .filter(progress => progress.userId === userId && progress.exerciseId === exerciseId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async updateExerciseProgress(id: string, updates: Partial<ExerciseProgress>): Promise<ExerciseProgress> {
    const progress = this.exerciseProgress.get(id);
    if (!progress) throw new Error("Exercise progress not found");
    
    const updatedProgress = { ...progress, ...updates };
    this.exerciseProgress.set(id, updatedProgress);
    return updatedProgress;
  }

  async deleteExerciseProgress(id: string): Promise<boolean> {
    return this.exerciseProgress.delete(id);
  }

  // Analytics and insights methods
  async getExerciseProgressChart(userId: string, exerciseId: string): Promise<{ date: string; weight?: number; reps: number; oneRepMax?: number }[]> {
    const progressEntries = await this.getExerciseProgressByExercise(userId, exerciseId);
    
    return progressEntries.map(entry => ({
      date: entry.date.toISOString().split('T')[0],
      weight: entry.bestSet.weight,
      reps: entry.bestSet.reps,
      oneRepMax: entry.bestSet.oneRepMax,
    }));
  }

  async getWorkoutVolumeChart(userId: string): Promise<{ date: string; volume: number; duration: number }[]> {
    const sessions = await this.getWorkoutSessionsByUserId(userId);
    
    return sessions.map(session => ({
      date: session.startTime.toISOString().split('T')[0],
      volume: session.totalVolume || 0,
      duration: session.totalDuration || 0,
    })).reverse(); // Oldest first for chart display
  }

  async getUserPersonalRecords(userId: string): Promise<ExerciseProgress[]> {
    return Array.from(this.exerciseProgress.values())
      .filter(progress => progress.userId === userId && progress.personalRecord)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Recipe database operations
  async addRecipe(recipe: Recipe): Promise<Recipe> {
    this.recipes.set(recipe.id, recipe);
    return recipe;
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    return this.recipes.get(id) || null;
  }

  async getAllRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values());
  }

  async getRecipesByCategory(category: string): Promise<Recipe[]> {
    return Array.from(this.recipes.values()).filter(recipe => recipe.category === category);
  }

  async getRecipesByDietaryTags(tags: string[]): Promise<Recipe[]> {
    return Array.from(this.recipes.values()).filter(recipe => 
      recipe.dietaryTags && tags.some(tag => recipe.dietaryTags!.includes(tag))
    );
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.recipes.values()).filter(recipe =>
      recipe.name.toLowerCase().includes(lowercaseQuery) ||
      recipe.description?.toLowerCase().includes(lowercaseQuery) ||
      recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getRandomRecipes(count: number): Promise<Recipe[]> {
    const allRecipes = Array.from(this.recipes.values());
    const shuffled = allRecipes.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Community meal operations
  async createCommunityMeal(meal: CommunityMeal): Promise<CommunityMeal> {
    this.communityMeals.set(meal.id, meal);
    return meal;
  }

  async getCommunityMealById(id: string): Promise<CommunityMeal | null> {
    return this.communityMeals.get(id) || null;
  }

  async getAllCommunityMeals(): Promise<CommunityMeal[]> {
    return Array.from(this.communityMeals.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateCommunityMeal(id: string, updates: Partial<CommunityMeal>): Promise<CommunityMeal> {
    const meal = this.communityMeals.get(id);
    if (!meal) {
      throw new Error("Community meal not found");
    }
    const updatedMeal = { ...meal, ...updates };
    this.communityMeals.set(id, updatedMeal);
    return updatedMeal;
  }

  async deleteCommunityMeal(id: string): Promise<boolean> {
    return this.communityMeals.delete(id);
  }

  // Progress insights methods for AI-powered photo analysis (premium feature)
  async createProgressInsight(insight: InsertProgressInsight): Promise<ProgressInsight> {
    const newInsight: ProgressInsight = {
      id: nanoid(),
      ...insight,
      createdAt: new Date(),
    };
    this.progressInsights.set(newInsight.id, newInsight);
    return newInsight;
  }

  async getProgressInsightsByUserId(userId: string): Promise<ProgressInsight[]> {
    return Array.from(this.progressInsights.values())
      .filter(insight => insight.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProgressInsight(id: string): Promise<ProgressInsight | null> {
    return this.progressInsights.get(id) || null;
  }

  async deleteProgressInsight(id: string): Promise<boolean> {
    return this.progressInsights.delete(id);
  }
}

// Switch between development (MemStorage) and production (PgStorage)
export const storage = new MemStorage();
