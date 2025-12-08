import type { User, Post, Comment, Connection, ProgressEntry, Exercise, WorkoutSession, ExerciseProgress, Recipe, CommunityMeal, ProgressInsight, StrengthInsight, Story, SavedMeal, Report, InsertUser, InsertPost, InsertComment, InsertConnection, InsertProgressEntry, InsertExercise, InsertWorkoutSession, InsertExerciseProgress, InsertProgressInsight, InsertStrengthInsight, InsertStory, InsertSavedMeal, InsertReport } from "../shared/schema.ts";
import type { WorkoutTemplate, InsertWorkoutTemplate, SavedWorkout, InsertSavedWorkout } from "../shared/workout-types.ts";
// Lightweight messaging/notification types used by server storage
export type Notification = {
  id: string;
  userId: string;
  type: string;
  text: string;
  url?: string;
  read?: boolean;
  createdAt: Date;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  read?: boolean;
};

export type Conversation = {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Date;
};
import { nanoid } from "nanoid";
import { PgStorage } from "./pg-storage.ts";
import { db } from './db.ts';
import fs from 'fs';
import path from 'path';

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: { id: string; email: string | null | undefined; firstName: string | null | undefined; lastName: string | null | undefined; profileImageUrl: string | null | undefined; isAdmin?: boolean; }): Promise<User>;
  
  // Posts
  createPost(post: InsertPost): Promise<Post>;
  getPostById(id: string): Promise<Post | null>;
  getAllPosts(): Promise<Post[]>;
  getPostsByUserId(userId: string): Promise<Post[]>;
  getPostsByExerciseTag(exerciseName: string, limit?: number): Promise<Post[]>;
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
  // Accept flexible input (AI generators may produce partial shapes)
  createExercise(exercise: any): Promise<Exercise>;
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

  // Canonical workout templates (separate from social posts)
  createWorkoutTemplate(template: InsertWorkoutTemplate & { ownerUserId: string }): Promise<WorkoutTemplate>;
  getWorkoutTemplate(id: string): Promise<WorkoutTemplate | null>;
  listWorkoutTemplates(ownerUserId?: string): Promise<WorkoutTemplate[]>;
  updateWorkoutTemplate(id: string, updates: Partial<WorkoutTemplate>): Promise<WorkoutTemplate>;
  deleteWorkoutTemplate(id: string): Promise<boolean>;

  // Saved workouts (user bookmarks a template/post)
  saveWorkout(data: InsertSavedWorkout): Promise<SavedWorkout>;
  listSavedWorkouts(userId: string): Promise<SavedWorkout[]>;
  deleteSavedWorkout(userId: string, savedWorkoutId: string): Promise<boolean>;
  
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
  addRecipe(recipe: Partial<Recipe>): Promise<Recipe>;
  getRecipeById(id: string): Promise<Recipe | null>;
  getAllRecipes(): Promise<Recipe[]>;
  getRecipesByCategory(category: string): Promise<Recipe[]>;
  getRecipesByDietaryTags(tags: string[]): Promise<Recipe[]>;
  searchRecipes(query: string): Promise<Recipe[]>;
  getRandomRecipes(count: number): Promise<Recipe[]>;

  // Notifications
  createNotification(notification: Partial<Notification>): Promise<Notification>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<boolean>;

  // Messaging / direct messages
  createConversation(participants: string[]): Promise<Conversation>;
  getConversationsForUser(userId: string): Promise<Conversation[]>;
  getMessagesForConversation(conversationId: string): Promise<Message[]>;
  sendMessage(conversationId: string, message: Partial<Message>): Promise<Message>;
  
  // Community meal operations
  createCommunityMeal(meal: CommunityMeal): Promise<CommunityMeal>;
  getCommunityMealById(id: string): Promise<CommunityMeal | null>;
  getAllCommunityMeals(): Promise<CommunityMeal[]>;
  updateCommunityMeal(id: string, updates: Partial<CommunityMeal>): Promise<CommunityMeal>;
  deleteCommunityMeal(id: string): Promise<boolean>;

  // Saved meals (user bookmarks a community meal)
  saveMeal(data: InsertSavedMeal): Promise<SavedMeal>;
  listSavedMeals(userId: string): Promise<SavedMeal[]>;
  deleteSavedMeal(userId: string, savedMealId: string): Promise<boolean>;

  // Progress insights operations - AI photo analysis (premium feature)  
  createProgressInsight(insight: InsertProgressInsight): Promise<ProgressInsight>;
  getProgressInsightsByUserId(userId: string): Promise<ProgressInsight[]>;
  getProgressInsight(id: string): Promise<ProgressInsight | null>;
  deleteProgressInsight(id: string): Promise<boolean>;

  // Strength insights operations - AI workout analysis (premium feature)
  createStrengthInsight(insight: InsertStrengthInsight): Promise<StrengthInsight>;
  getStrengthInsightsByUserId(userId: string): Promise<StrengthInsight[]>;
  getStrengthInsightByPostId(postId: string): Promise<StrengthInsight | null>;
  getStrengthInsight(id: string): Promise<StrengthInsight | null>;
  deleteStrengthInsight(id: string): Promise<boolean>;

  // Stories operations - 24-hour disappearing stories
  createStory(story: InsertStory): Promise<Story>;
  getActiveStories(): Promise<Story[]>; // Get all non-expired stories
  getStoriesByUserId(userId: string): Promise<Story[]>; // Get user's active stories
  viewStory(storyId: string, userId: string): Promise<Story | null>; // Mark story as viewed
  deleteStory(id: string): Promise<boolean>;
  cleanupExpiredStories(): Promise<number>; // Remove expired stories, returns count

  // Reports operations - for flagged posts
  createReport(report: { postId: string; reporterId: string; reason: string }): Promise<Report>;
  getAllReports(): Promise<Report[]>;
  getReportById(id: string): Promise<Report | null>;
  updateReportStatus(id: string, status: "pending" | "reviewed" | "dismissed"): Promise<Report>;
  deleteReport(id: string): Promise<boolean>;
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
  private strengthInsights: Map<string, StrengthInsight> = new Map();
  private notifications: Map<string, Notification[]> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private stories: Map<string, Story> = new Map();
  private workoutTemplates: Map<string, WorkoutTemplate> = new Map();
  private savedWorkouts: Map<string, SavedWorkout[]> = new Map();
  private savedMeals: Map<string, SavedMeal[]> = new Map();
  private reports: Map<string, Report> = new Map();

  constructor() {
    this.seedData();
    this.seedExercises();
    this.loadExerciseLibraryFile();
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

  // Load extended exercise library from JSON file (server/exerciseLibrary.json) if present.
  // This provides persistence across restarts for seeded + previously added exercises.
  private loadExerciseLibraryFile() {
    try {
      const filePath = path.join(process.cwd(), 'server', 'exerciseLibrary.json');
      if (!fs.existsSync(filePath)) return;
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return;
      let imported = 0;
      for (const item of data) {
        if (!item || typeof item !== 'object' || !item.name) continue;
        const id = typeof item.id === 'string' ? item.id : nanoid();
        if (this.exercises.has(id)) continue; // don't overwrite existing seeds
        const ex: Exercise = {
          id,
          name: item.name,
          category: (item.category?.toString().toLowerCase() || 'strength') as any,
          muscleGroups: Array.isArray(item.muscleGroups) ? item.muscleGroups.map((m: string) => m.toLowerCase().replace(/\s+/g, '_')) as any : [],
          equipment: Array.isArray(item.equipment) ? item.equipment.map((e: string) => e.toLowerCase()) : [],
          difficulty: (item.difficulty?.toString().toLowerCase() || 'beginner') as any,
          description: item.description || item.instructions?.join(' ') || '',
          instructions: Array.isArray(item.instructions) ? item.instructions : [],
          tips: Array.isArray(item.tips) ? item.tips : [],
          safetyNotes: Array.isArray(item.safetyNotes) ? item.safetyNotes : [],
          images: item.images || (item.thumbnailUrl ? [item.thumbnailUrl] : []),
          videos: item.videos || [],
          variations: item.variations || [],
          isUserCreated: false,
          createdBy: undefined,
          isApproved: true,
          tags: item.tags || [],
          createdAt: new Date(),
        };
        this.exercises.set(id, ex);
        imported++;
      }
      if (imported) {
        console.log(`📥 Imported ${imported} exercises from exerciseLibrary.json`);
      }
    } catch (err) {
      console.warn('Failed loading exerciseLibrary.json (non-fatal):', err);
    }
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
        location: "New York, NY",
        height: 65,
        weight: 150,
        fitnessGoals: ["Weight Loss", "Strength Training"],
        followers: ["user2", "user3"],
        following: ["user2", "user4"],
        isVerified: true,
        isAdmin: true, // Admin user for moderation
        professionalType: "trainer",
        certifications: ["NASM-CPT", "ACSM-CPT"],
        specialties: ["Strength Training", "Weight Loss", "Functional Movement"],
        experience: "5+ years helping clients achieve their fitness goals",
        hourlyRate: 75,
        clients: ["user3", "user4"],
        trainers: [],
        isPremium: true,
        subscriptionTier: "premium",
        createdAt: new Date('2024-01-15'),
      },
      {
        id: "user2",
        name: "Mike Rodriguez",
        username: "mikestrong",
        email: "mike@example.com",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        bio: "Nutritionist • Meal prep expert • Clean eating advocate",
        location: "Los Angeles, CA",
        height: 72,
        weight: 195,
        fitnessGoals: ["Muscle Building", "Nutrition"],
        followers: ["user1", "user3", "user4"],
        following: ["user1", "user3"],
        isVerified: true,
        isAdmin: false,
        professionalType: "nutritionist",
        certifications: ["RD", "CSCS"],
        specialties: ["Meal Planning", "Sports Nutrition", "Weight Management"],
        experience: "8+ years in clinical and sports nutrition",
        hourlyRate: 85,
        clients: ["user1", "user3"],
        trainers: [],
        isPremium: true,
        subscriptionTier: "premium",
        createdAt: new Date('2024-01-10'),
      },
      {
        id: "user3",
        name: "Emma Thompson",
        username: "emmatransform",
        email: "emma@example.com",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        bio: "Transformation coach • Progress documentation • Motivation",
        location: "Chicago, IL",
        height: 64,
        weight: 135,
        fitnessGoals: ["Weight Loss", "Body Recomposition"],
        followers: ["user1", "user2"],
        following: ["user1", "user2", "user4"],
        isVerified: false,
        isAdmin: false,
        certifications: [],
        specialties: [],
        clients: [],
        trainers: ["user1", "user2"],
        isPremium: false,
        subscriptionTier: "free",
        createdAt: new Date('2024-01-20'),
      },
      {
        id: "user4",
        name: "Jessica Chen",
        username: "jessyoga",
        email: "jessica@example.com",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b890?w=150&h=150&fit=crop&crop=face",
        bio: "Yoga instructor • HIIT specialist • Mindful movement",
        location: "Austin, TX",
        height: 66,
        weight: 128,
        fitnessGoals: ["Flexibility", "Cardio Fitness"],
        followers: ["user2", "user3"],
        following: ["user1", "user2"],
        isVerified: false,
        isAdmin: false,
        certifications: [],
        specialties: [],
        clients: [],
        trainers: ["user1"],
        isPremium: false,
        subscriptionTier: "free",
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
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1000&fit=crop"],
        exerciseTags: [],
        mediaItems: [],
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
        images: ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=1000&fit=crop"],
        exerciseTags: [],
        mediaItems: [],
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
        images: ["https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&h=1000&fit=crop"],
        exerciseTags: [],
        mediaItems: [],
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

    // Add mock stories for testing
    const now = new Date();
    const mockStories: Story[] = [
      {
        id: nanoid(),
        userId: "user2", // Mike Rodriguez
        image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1080&h=1920&fit=crop",
        caption: "Morning workout complete! 💪",
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        expiresAt: new Date(now.getTime() + 22 * 60 * 60 * 1000), // expires in 22 hours
        views: ["user1", "user3"], // Sarah and Emma have viewed it
      },
      {
        id: nanoid(),
        userId: "user3", // Emma Thompson
        image: "https://images.unsplash.com/photo-1540206395-68808572332f?w=1080&h=1920&fit=crop",
        caption: "New gym selfie! Feeling strong 🔥",
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
        expiresAt: new Date(now.getTime() + 19 * 60 * 60 * 1000), // expires in 19 hours
        views: [], // No one has viewed it yet
      },
    ];

    mockStories.forEach(story => this.stories.set(story.id, story));
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

  async upsertUser(userData: { id: string; email: string | undefined; firstName: string | undefined; lastName: string | undefined; profileImageUrl: string | undefined; isAdmin?: boolean; }): Promise<User> {
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
        height: (userData as any).height ?? existingUser.height,
        weight: (userData as any).weight ?? existingUser.weight,
        isAdmin: userData.isAdmin ?? existingUser.isAdmin,
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
        height: (userData as any).height,
        weight: (userData as any).weight,
        isVerified: false,
        isAdmin: userData.isAdmin ?? false,
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
      createdAt: (post as any).createdAt || new Date(),
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

  async getPostsByExerciseTag(exerciseName: string, limit: number = 10): Promise<Post[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const allMatchingPosts = Array.from(this.posts.values())
      .filter(post => {
        // Must be a workout post
        if (post.type !== 'workout') return false;

        // Check if exercise is in workout data (legacy or general match)
        const hasExerciseInWorkout = post.workoutData?.exercises?.some((exercise: any) => 
          exercise.name?.toLowerCase().includes(exerciseName.toLowerCase()) ||
          exercise.exerciseName?.toLowerCase().includes(exerciseName.toLowerCase())
        );

        // Check for videos in mediaItems (new structure)
        // We want videos that are explicitly tagged with this exercise.
        // We do NOT fallback to workout data for untagged videos to prevent
        // showing the wrong video (e.g. Squat video for Bench Press).
        const hasVideoInMediaItems = post.mediaItems?.some(item => 
          item.type === 'video' && 
          item.exerciseTags?.some(tag => tag.toLowerCase().includes(exerciseName.toLowerCase()))
        );

        // Check for videos in images (legacy structure)
        // Only check this if mediaItems is NOT present or empty to avoid double counting
        // and incorrect fallback for new posts that have mediaItems
        const hasVideoInImages = (!post.mediaItems || post.mediaItems.length === 0) && post.images?.some((image: string) => 
          image.toLowerCase().match(/\.(mp4|mov|avi|webm|ogg)$/)
        ) && hasExerciseInWorkout;

        return hasVideoInMediaItems || hasVideoInImages;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filter for past week
    const recentPosts = allMatchingPosts.filter(post => new Date(post.createdAt) >= oneWeekAgo);

    if (recentPosts.length > 0) {
      return recentPosts.slice(0, limit);
    }

    // If no recent posts, return the latest ones
    return allMatchingPosts.slice(0, limit);
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
      // Sort by createdAt (most recent first). Fall back to `date` if createdAt is missing.
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
        return bTime - aTime;
      });
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
  async createExercise(exercise: any): Promise<Exercise> {
    const newExercise: Exercise = {
      id: nanoid(),
      name: exercise.name || "Unnamed Exercise",
      category: (exercise.category as any) || "strength",
      muscleGroups: (exercise.muscleGroups as any) || [],
      equipment: exercise.equipment || [],
      difficulty: (exercise.difficulty as any) || "beginner",
      description: exercise.description || "",
      instructions: exercise.instructions || [],
      tips: exercise.tips || [],
      safetyNotes: exercise.safetyNotes || [],
      images: exercise.images || [],
      videos: exercise.videos || [],
      variations: exercise.variations || [],
      isUserCreated: exercise.isUserCreated ?? false,
      createdBy: exercise.createdBy,
      isApproved: exercise.isApproved ?? true,
      tags: exercise.tags || [],
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
      post.type === "workout" && 
      (post.workoutData && (post.workoutData as any).isTemplate)
    );
  }

  // Canonical Workout Templates CRUD (in-memory)
  async createWorkoutTemplate(template: InsertWorkoutTemplate & { ownerUserId: string }): Promise<WorkoutTemplate> {
    const id = nanoid();
    const now = new Date();
    const full: WorkoutTemplate = {
      id,
      createdAt: now,
      updatedAt: now,
      ...template,
      ownerUserId: template.ownerUserId,
      exercises: template.exercises || [],
    } as WorkoutTemplate;
    this.workoutTemplates.set(id, full);
    return full;
  }

  async getWorkoutTemplate(id: string): Promise<WorkoutTemplate | null> {
    return this.workoutTemplates.get(id) || null;
  }

  async listWorkoutTemplates(ownerUserId?: string): Promise<WorkoutTemplate[]> {
    const list = Array.from(this.workoutTemplates.values());
    return ownerUserId ? list.filter(t => t.ownerUserId === ownerUserId) : list;
  }

  async updateWorkoutTemplate(id: string, updates: Partial<WorkoutTemplate>): Promise<WorkoutTemplate> {
    const existing = this.workoutTemplates.get(id);
    if (!existing) throw new Error("Workout template not found");
    const updated = { ...existing, ...updates, updatedAt: new Date() } as WorkoutTemplate;
    this.workoutTemplates.set(id, updated);
    return updated;
  }

  async deleteWorkoutTemplate(id: string): Promise<boolean> {
    return this.workoutTemplates.delete(id);
  }

  // Saved workouts
  async saveWorkout(data: InsertSavedWorkout): Promise<SavedWorkout> {
    const list = this.savedWorkouts.get(data.userId) || [];
    
    // Check if already saved to prevent duplicates
    const existing = list.find(sw => sw.templateId === data.templateId && sw.sourceType === data.sourceType);
    if (existing) {
      console.log(`[MemStorage] Workout ${data.templateId} already saved for user ${data.userId}`);
      return existing;
    }
    
    const saved: SavedWorkout = {
      id: nanoid(),
      createdAt: new Date(),
      ...data,
    } as SavedWorkout;
    list.unshift(saved);
    this.savedWorkouts.set(data.userId, list);
    console.log(`[MemStorage] Saved workout ${saved.id} for user ${data.userId}. Total saved: ${list.length}`);
    return saved;
  }

  async listSavedWorkouts(userId: string): Promise<SavedWorkout[]> {
    const list = this.savedWorkouts.get(userId) || [];
    console.log(`[MemStorage] Listing saved workouts for user ${userId}: ${list.length} found`);
    return list;
  }

  async deleteSavedWorkout(userId: string, savedWorkoutId: string): Promise<boolean> {
    const list = this.savedWorkouts.get(userId) || [];
    const newList = list.filter(sw => sw.id !== savedWorkoutId);
    const changed = newList.length !== list.length;
    console.log(`[MemStorage] Delete workout ${savedWorkoutId} for user ${userId}: ${changed ? 'success' : 'not found'}`);
    if (changed) this.savedWorkouts.set(userId, newList);
    return changed;
  }

  // Saved meals
  async saveMeal(data: InsertSavedMeal): Promise<SavedMeal> {
    const list = this.savedMeals.get(data.userId) || [];
    
    // Check if already saved to prevent duplicates
    const existing = list.find(sm => sm.mealId === data.mealId);
    if (existing) {
      console.log(`[MemStorage] Meal ${data.mealId} already saved for user ${data.userId}`);
      return existing;
    }
    
    const saved: SavedMeal = {
      id: nanoid(),
      createdAt: new Date(),
      ...data,
    } as SavedMeal;
    list.unshift(saved);
    this.savedMeals.set(data.userId, list);
    console.log(`[MemStorage] Saved meal ${saved.id} for user ${data.userId}. Total saved: ${list.length}`);
    return saved;
  }

  async listSavedMeals(userId: string): Promise<SavedMeal[]> {
    const list = this.savedMeals.get(userId) || [];
    console.log(`[MemStorage] Listing saved meals for user ${userId}: ${list.length} found`);
    return list;
  }

  async deleteSavedMeal(userId: string, savedMealId: string): Promise<boolean> {
    const list = this.savedMeals.get(userId) || [];
    const newList = list.filter(sm => sm.id !== savedMealId);
    const changed = newList.length !== list.length;
    console.log(`[MemStorage] Delete meal ${savedMealId} for user ${userId}: ${changed ? 'success' : 'not found'}`);
    if (changed) this.savedMeals.set(userId, newList);
    return changed;
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
  async addRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
    const newRecipe: Recipe = {
      id: recipe.id || nanoid(),
      name: recipe.name || "Unnamed Recipe",
      description: recipe.description || "",
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      cookTime: recipe.cookTime || 0,
      prepTime: recipe.prepTime || 0,
      servings: recipe.servings || 1,
      difficulty: (recipe.difficulty as any) || "easy",
      cuisineType: recipe.cuisineType || undefined,
      dietaryTags: recipe.dietaryTags || [],
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      fiber: recipe.fiber,
      image: recipe.image,
      isAiGenerated: recipe.isAiGenerated ?? true,
      category: (recipe.category as any) || "breakfast",
      healthBenefits: recipe.healthBenefits || [],
      tips: recipe.tips || [],
      createdAt: recipe.createdAt || new Date(),
    } as Recipe;

    this.recipes.set(newRecipe.id, newRecipe);
    return newRecipe;
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

  // Strength insights methods for AI-powered workout analysis (premium feature)
  async createStrengthInsight(insight: InsertStrengthInsight): Promise<StrengthInsight> {
    const newInsight: StrengthInsight = {
      id: nanoid(),
      ...insight,
      createdAt: new Date(),
    };
    this.strengthInsights.set(newInsight.id, newInsight);
    return newInsight;
  }

  async getStrengthInsightsByUserId(userId: string): Promise<StrengthInsight[]> {
    return Array.from(this.strengthInsights.values())
      .filter(insight => insight.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getStrengthInsightByPostId(postId: string): Promise<StrengthInsight | null> {
    return Array.from(this.strengthInsights.values())
      .find(insight => insight.postId === postId) || null;
  }

  async getStrengthInsight(id: string): Promise<StrengthInsight | null> {
    return this.strengthInsights.get(id) || null;
  }

  async deleteStrengthInsight(id: string): Promise<boolean> {
    return this.strengthInsights.delete(id);
  }

  // Notifications
  async createNotification(notification: Partial<Notification>): Promise<Notification> {
    const newNotification: Notification = {
      id: nanoid(),
      userId: notification.userId || "",
      type: notification.type || "generic",
      text: notification.text || "",
      url: notification.url,
      read: notification.read ?? false,
      createdAt: notification.createdAt || new Date(),
    };

    const list = this.notifications.get(newNotification.userId) || [];
    list.unshift(newNotification);
    this.notifications.set(newNotification.userId, list);
    return newNotification;
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return this.notifications.get(userId) || [];
  }

  async markNotificationRead(id: string): Promise<boolean> {
    for (const [userId, list] of this.notifications.entries()) {
      const idx = list.findIndex((n: Notification) => n.id === id);
      if (idx >= 0) {
        list[idx].read = true;
        this.notifications.set(userId, list);
        return true;
      }
    }
    return false;
  }

  // Messaging
  async createConversation(participants: string[]): Promise<Conversation> {
    const id = nanoid();
    const conv: Conversation = { id, participants, createdAt: new Date() };
    this.conversations.set(id, conv);
    this.messages.set(id, []);
    return conv;
  }

  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(c => c.participants.includes(userId));
  }

  async getMessagesForConversation(conversationId: string): Promise<Message[]> {
    return this.messages.get(conversationId) || [];
  }

  async sendMessage(conversationId: string, message: Partial<Message>): Promise<Message> {
    const msg: Message = {
      id: nanoid(),
      conversationId,
      senderId: message.senderId || "",
      content: message.content || "",
      createdAt: new Date(),
      read: message.read ?? false,
    };

    const list = this.messages.get(conversationId) || [];
    list.push(msg);
    this.messages.set(conversationId, list);

    const conv = this.conversations.get(conversationId);
    if (conv) {
      conv.lastMessage = msg;
      this.conversations.set(conversationId, conv);
    }

    return msg;
  }

  // Stories
  async createStory(story: InsertStory): Promise<Story> {
    const id = nanoid();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    const newStory: Story = {
      id,
      userId: story.userId,
      image: story.image,
      caption: story.caption,
      createdAt: now,
      expiresAt,
      views: [],
    };

    this.stories.set(id, newStory);
    return newStory;
  }

  async getActiveStories(): Promise<Story[]> {
    const now = new Date();
    return Array.from(this.stories.values())
      .filter(story => story.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getStoriesByUserId(userId: string): Promise<Story[]> {
    const now = new Date();
    return Array.from(this.stories.values())
      .filter(story => story.userId === userId && story.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async viewStory(storyId: string, userId: string): Promise<Story | null> {
    const story = this.stories.get(storyId);
    if (!story) return null;

    // Add userId to views if not already present
    if (!story.views.includes(userId)) {
      story.views.push(userId);
      this.stories.set(storyId, story);
    }

    return story;
  }

  async deleteStory(id: string): Promise<boolean> {
    return this.stories.delete(id);
  }

  async cleanupExpiredStories(): Promise<number> {
    const now = new Date();
    let count = 0;
    
    for (const [id, story] of this.stories.entries()) {
      if (story.expiresAt <= now) {
        this.stories.delete(id);
        count++;
      }
    }
    
    return count;
  }

  // Reports operations
  async createReport(report: { postId: string; reporterId: string; reason: string }): Promise<Report> {
    const newReport: Report = {
      id: nanoid(),
      postId: report.postId,
      reporterId: report.reporterId,
      reason: report.reason,
      status: "pending",
      createdAt: new Date(),
    };
    this.reports.set(newReport.id, newReport);
    return newReport;
  }

  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getReportById(id: string): Promise<Report | null> {
    return this.reports.get(id) || null;
  }

  async updateReportStatus(id: string, status: "pending" | "reviewed" | "dismissed"): Promise<Report> {
    const report = this.reports.get(id);
    if (!report) throw new Error("Report not found");
    const updated = { ...report, status };
    this.reports.set(id, updated);
    return updated;
  }

  async deleteReport(id: string): Promise<boolean> {
    return this.reports.delete(id);
  }
}

// Use PgStorage only when database is successfully connected
// Falls back to MemStorage for development without database
// To persist messages, set DATABASE_URL in .env and restart server
export const storage = db ? new PgStorage() : new MemStorage();
