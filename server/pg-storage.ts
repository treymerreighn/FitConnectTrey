import { eq, ilike, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "./db.ts";
import { users, posts, comments, connections, progressEntries, exercises, notifications, conversations, messages } from "../shared/db-schema.ts";
import type { IStorage, Notification, Message, Conversation } from "./storage.ts";
import type { WorkoutTemplate, InsertWorkoutTemplate, SavedWorkout, InsertSavedWorkout } from "../shared/workout-types.ts";
import type { User, Post, Comment, Connection, ProgressEntry, Exercise, Recipe, InsertUser, InsertPost, InsertComment, InsertConnection, InsertProgressEntry, InsertExercise, WorkoutSession, InsertWorkoutSession, ExerciseProgress, InsertExerciseProgress, CommunityMeal, ProgressInsight, InsertProgressInsight, Story, InsertStory, SavedMeal, InsertSavedMeal } from "../shared/schema.ts";

export class PgStorage implements IStorage {
  constructor() {
    this.seedData();
  }

  // Simple in-memory recipes store for environments where DB schema/table
  // is not present. PgStorage must implement recipe methods from IStorage.
  private recipes: Map<string, Recipe> = new Map();
  // In-memory maps for features not yet migrated to DB schema
  private workoutSessions: Map<string, WorkoutSession> = new Map();
  private exerciseProgress: Map<string, ExerciseProgress> = new Map();
  private communityMeals: Map<string, CommunityMeal> = new Map();
  private progressInsights: Map<string, ProgressInsight> = new Map();
  private workoutTemplates: Map<string, WorkoutTemplate> = new Map(); // in-memory until table added
  private savedWorkouts: Map<string, SavedWorkout[]> = new Map(); // in-memory bookmark persistence
  private savedMeals: Map<string, SavedMeal[]> = new Map(); // in-memory saved meals persistence
  private stories: Map<string, Story> = new Map(); // in-memory until table added

  private async seedData() {
    // Skip seeding if database is not available
    if (!db) return;
    
    try {
      // Check if data already exists
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) return;

    // Seed users
    const seedUsers = [
      {
        id: "user1",
        username: "alex_fitness",
        email: "alex@example.com",
        fullName: "Alex Johnson",
        bio: "💪 Fitness enthusiast | 🏃‍♂️ Marathon runner | 🥗 Clean eating advocate",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        isVerified: false,
        accountType: "user",
        fitnessGoals: ["weight_loss", "muscle_gain"],
        followers: ["user2", "user3"],
        following: ["user2", "user4"],
        location: "New York, NY"
        ,height: 68,
        weight: 170
      },
      {
        id: "user2",
        username: "sarah_trainer",
        email: "sarah@example.com",
        fullName: "Sarah Wilson",
        bio: "🏋️‍♀️ Certified Personal Trainer | 🎯 Help you reach your fitness goals",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
        isVerified: true,
        accountType: "trainer",
        fitnessGoals: ["strength_training"],
        followers: ["user1", "user3", "user4"],
        following: ["user1"],
        location: "Los Angeles, CA"
        ,height: 65,
        weight: 150
      },
      {
        id: "user3",
        username: "mike_nutrition",
        email: "mike@example.com",
        fullName: "Mike Rodriguez",
        bio: "🥑 Nutritionist | 📚 Science-based approach to healthy eating",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        isVerified: true,
        accountType: "nutritionist",
        fitnessGoals: ["healthy_lifestyle"],
        followers: ["user1", "user2"],
        following: ["user1", "user2"],
        location: "Chicago, IL"
        ,height: 72,
        weight: 200
      },
      {
        id: "user4",
        username: "emma_yoga",
        email: "emma@example.com",
        fullName: "Emma Chen",
        bio: "🧘‍♀️ Yoga instructor | ✨ Mind-body wellness advocate",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        isVerified: false,
        accountType: "user",
        fitnessGoals: ["flexibility", "mindfulness"],
        followers: ["user2"],
        following: ["user2", "user3"],
        location: "Austin, TX"
        ,height: 64,
        weight: 125
      }
    ];

    for (const user of seedUsers) {
      await db.insert(users).values(user);
    }

    // Seed exercises
    const seedExercises = [
      {
        id: "ex1",
        name: "Push-ups",
        description: "A classic upper body exercise that targets chest, shoulders, and triceps",
        instructions: ["Start in plank position with hands shoulder-width apart", "Lower your body until chest nearly touches floor", "Push back up to starting position", "Keep core engaged throughout"],
        category: "strength",
        muscleGroups: ["chest", "shoulders", "triceps"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
        tips: ["Keep your body in straight line", "Don't let hips sag", "Control the movement"]
      },
      {
        id: "ex2",
        name: "Squats",
        description: "Fundamental lower body exercise targeting quadriceps, glutes, and hamstrings",
        instructions: ["Stand with feet shoulder-width apart", "Lower hips back and down as if sitting in chair", "Keep chest up and knees tracking over toes", "Return to standing position"],
        category: "strength",
        muscleGroups: ["quadriceps", "glutes", "hamstrings"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        imageUrl: "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400&h=300&fit=crop",
        tips: ["Keep weight on heels", "Don't let knees cave inward", "Go as low as comfortable"]
      },
      {
        id: "ex3",
        name: "Deadlift",
        description: "Compound movement that works the entire posterior chain",
        instructions: ["Stand with feet hip-width apart, barbell over mid-foot", "Hinge at hips, grab bar with hands outside legs", "Keep chest up, shoulders back", "Drive through heels to stand up"],
        category: "strength",
        muscleGroups: ["hamstrings", "glutes", "back"],
        equipment: ["barbell"],
        difficulty: "intermediate",
        imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop",
        tips: ["Keep bar close to body", "Don't round your back", "Squeeze glutes at top"]
      },
      {
        id: "ex4",
        name: "Plank",
        description: "Isometric core exercise that builds stability and strength",
        instructions: ["Start in push-up position", "Lower to forearms", "Keep body in straight line", "Hold position"],
        category: "core",
        muscleGroups: ["core", "shoulders"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
        tips: ["Don't let hips sag", "Breathe normally", "Engage core muscles"]
      },
      {
        id: "ex5",
        name: "Burpees",
        description: "Full-body exercise combining squat, plank, and jump",
        instructions: ["Start standing", "Drop into squat, place hands on floor", "Jump feet back to plank", "Do push-up", "Jump feet to hands", "Explode up with jump"],
        category: "cardio",
        muscleGroups: ["full body"],
        equipment: ["bodyweight"],
        difficulty: "advanced",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
        tips: ["Move with control", "Land softly", "Modify by removing jump"]
      }
    ];

    for (const exercise of seedExercises) {
      await db.insert(exercises).values({
        ...exercise,
        isApproved: true,
        createdBy: "user2"
      });
    }

    console.log("Database seeded successfully");
    } catch (error) {
      console.warn('⚠️  Could not seed database, will use empty state');
    }
  }

  // Users
  async createUser(user: InsertUser): Promise<User> {
    const newUser = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...user
    };
    
    await db.insert(users).values({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      fullName: (newUser as any).name || newUser.username,
      bio: newUser.bio,
      avatar: newUser.avatar,
      isVerified: newUser.isVerified,
      accountType: (newUser as any).professionalType || "user",
      fitnessGoals: newUser.fitnessGoals,
      followers: newUser.followers,
      following: newUser.following
      ,height: (newUser as any).height
      ,weight: (newUser as any).weight
    });
    
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await db.update(users).set(updates).where(eq(users.id, id));
    const updated = await this.getUserById(id);
    if (!updated) throw new Error("User not found");
    return updated;
  }


  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: { id: string; email: string | null | undefined; firstName: string | null | undefined; lastName: string | null | undefined; profileImageUrl: string | null | undefined; }): Promise<User> {
    const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || 'User';
    const username = userData.email?.split('@')[0] || `user_${userData.id}`;
    
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        username: username,
        email: userData.email || '',
        fullName: fullName,
        avatar: userData.profileImageUrl,
        height: (userData as any).height,
        weight: (userData as any).weight,
        bio: 'New to FitConnect! 💪',
        isVerified: false,
        accountType: 'user',
        fitnessGoals: [],
        followers: [],
        following: [],
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email || '',
          fullName: fullName,
          avatar: userData.profileImageUrl,
          height: (userData as any).height,
          weight: (userData as any).weight,
        },
      })
      .returning();
    
    return user;
  }

  // Posts
  async createPost(post: InsertPost): Promise<Post> {
    const newPost = {
      id: crypto.randomUUID(),
      likes: [],
      comments: [],
      createdAt: new Date(),
      ...post
    };
    
    await db.insert(posts).values({
      id: newPost.id,
      userId: newPost.userId,
      type: newPost.type,
      caption: newPost.caption,
      images: newPost.images,
      likes: newPost.likes,
      comments: newPost.comments,
      workoutData: newPost.workoutData,
      nutritionData: newPost.nutritionData,
      progressData: newPost.progressData
    });
    
    return newPost;
  }

  async getPostById(id: string): Promise<Post | null> {
    const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return result[0] || null;
  }

  async getAllPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  async getPostsByUserId(userId: string): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt));
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    await db.update(posts).set(updates).where(eq(posts.id, id));
    const updated = await this.getPostById(id);
    if (!updated) throw new Error("Post not found");
    return updated;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return result.count > 0;
  }

  async getTrendingWorkouts(hours: number = 24): Promise<Post[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await db.select().from(posts)
      .where(and(
        eq(posts.type, "workout"),
        sql`created_at > ${since}`
      ))
      .orderBy(sql`array_length(likes, 1) DESC NULLS LAST`)
      .limit(10);
  }

  // Comments
  async createComment(comment: InsertComment): Promise<Comment> {
    const newComment = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...comment
    };
    
    await db.insert(comments).values({
      id: newComment.id,
      postId: newComment.postId,
      userId: newComment.userId,
      content: newComment.content
    });
    
    return newComment;
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt));
  }

  async deleteComment(id: string): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return result.count > 0;
  }

  // Social actions
  async likePost(postId: string, userId: string): Promise<Post> {
    const post = await this.getPostById(postId);
    if (!post) throw new Error("Post not found");
    
    const likes = post.likes || [];
    const isLiked = likes.includes(userId);
    
    const updatedLikes = isLiked 
      ? likes.filter(id => id !== userId)
      : [...likes, userId];
    
    return await this.updatePost(postId, { likes: updatedLikes });
  }

  async unlikePost(postId: string, userId: string): Promise<Post> {
    return await this.likePost(postId, userId); // Same logic
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    const follower = await this.getUserById(followerId);
    const following = await this.getUserById(followingId);
    
    if (!follower || !following) throw new Error("User not found");
    
    const updatedFollowing = [...(follower.following || []), followingId];
    const updatedFollowers = [...(following.followers || []), followerId];
    
    await this.updateUser(followerId, { following: updatedFollowing });
    await this.updateUser(followingId, { followers: updatedFollowers });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const follower = await this.getUserById(followerId);
    const following = await this.getUserById(followingId);
    
    if (!follower || !following) throw new Error("User not found");
    
    const updatedFollowing = (follower.following || []).filter(id => id !== followingId);
    const updatedFollowers = (following.followers || []).filter(id => id !== followerId);
    
    await this.updateUser(followerId, { following: updatedFollowing });
    await this.updateUser(followingId, { followers: updatedFollowers });
  }

  // Professional connections
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const newConnection = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...connection
    };
    
    await db.insert(connections).values({
      id: newConnection.id,
      clientId: newConnection.clientId,
      professionalId: newConnection.professionalId,
      status: newConnection.status,
      startDate: (newConnection as any).startDate,
      endDate: (newConnection as any).endDate,
      requestMessage: (newConnection as any).notes || (newConnection as any).requestMessage
    });
    
    return newConnection;
  }

  async getConnectionById(id: string): Promise<Connection | null> {
    const result = await db.select().from(connections).where(eq(connections.id, id)).limit(1);
    return result[0] || null;
  }

  async getConnectionsByClientId(clientId: string): Promise<Connection[]> {
    return await db.select().from(connections).where(eq(connections.clientId, clientId));
  }

  async getConnectionsByProfessionalId(professionalId: string): Promise<Connection[]> {
    return await db.select().from(connections).where(eq(connections.professionalId, professionalId));
  }

  async updateConnection(id: string, updates: Partial<Connection>): Promise<Connection> {
    await db.update(connections).set(updates).where(eq(connections.id, id));
    const updated = await this.getConnectionById(id);
    if (!updated) throw new Error("Connection not found");
    return updated;
  }

  async deleteConnection(id: string): Promise<boolean> {
    const result = await db.delete(connections).where(eq(connections.id, id));
    return result.count > 0;
  }

  async getProfessionals(type?: "trainer" | "nutritionist"): Promise<User[]> {
    const accountTypes = type ? [type] : ["trainer", "nutritionist"];
    return await db.select().from(users).where(inArray(users.accountType, accountTypes));
  }

  // Progress tracking
  async createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry> {
    const newEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...entry
    };
    
    await db.insert(progressEntries).values({
      id: newEntry.id,
      userId: newEntry.userId,
      date: newEntry.date,
      createdAt: newEntry.createdAt,
      type: "weight", // Default type for simplified progress tracking
      weight: newEntry.weight,
      bodyFat: newEntry.bodyFatPercentage,
      muscleMass: newEntry.muscleMass,
      measurements: newEntry.measurements,
      photos: newEntry.photos,
      notes: newEntry.notes,
      mood: newEntry.mood,
      energyLevel: newEntry.energyLevel,
      aiInsights: JSON.stringify(newEntry.aiInsights) // Convert object to string for storage
    });
    
    return newEntry;
  }

  async getProgressEntryById(id: string): Promise<ProgressEntry | null> {
    const result = await db.select().from(progressEntries).where(eq(progressEntries.id, id)).limit(1);
    return result[0] || null;
  }

  async getProgressEntriesByUserId(userId: string): Promise<ProgressEntry[]> {
    const dbEntries = await db.select().from(progressEntries).where(eq(progressEntries.userId, userId)).orderBy(desc(progressEntries.createdAt));

    // Convert database entries to match schema format
    return dbEntries.map((entry: any) => ({
      ...entry,
      bodyFatPercentage: entry.bodyFat,
      aiInsights: entry.aiInsights ? JSON.parse(entry.aiInsights) : undefined
    })) as ProgressEntry[];
  }

  async updateProgressEntry(id: string, updates: Partial<ProgressEntry>): Promise<ProgressEntry> {
    await db.update(progressEntries).set(updates).where(eq(progressEntries.id, id));
    const updated = await this.getProgressEntryById(id);
    if (!updated) throw new Error("Progress entry not found");
    return updated;
  }

  async deleteProgressEntry(id: string): Promise<boolean> {
    const result = await db.delete(progressEntries).where(eq(progressEntries.id, id));
    return result.count > 0;
  }

  async generateAIInsights(entryId: string, photos: string[]): Promise<ProgressEntry> {
    const entry = await this.getProgressEntryById(entryId);
    if (!entry) throw new Error("Progress entry not found");
    
    // Mock AI insights for now
    const insights = "Great progress! Your form is improving and you're showing consistent results. Keep up the excellent work!";
    const insightsObj = {
      recommendations: ["Keep consistent with training and recovery"],
      progressAnalysis: insights,
      bodyComposition: "Improving",
      confidenceScore: 0.8,
      generatedAt: new Date()
    };

    return await this.updateProgressEntry(entryId, { aiInsights: insightsObj as any });
  }

  // Exercise library
  async createExercise(exercise: Partial<InsertExercise>): Promise<Exercise> {
    const newExercise = {
      id: crypto.randomUUID(),
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
      tags: exercise.tags || [],
      isUserCreated: exercise.isUserCreated || false,
      createdBy: exercise.createdBy,
      isApproved: exercise.isApproved ?? true,
      createdAt: new Date()
    } as Exercise;

    await db.insert(exercises).values({
      id: newExercise.id,
      name: newExercise.name,
      description: newExercise.description,
      instructions: newExercise.instructions,
      category: newExercise.category,
      muscleGroups: newExercise.muscleGroups,
      equipment: newExercise.equipment,
      difficulty: newExercise.difficulty,
      images: newExercise.images || [],
      videos: newExercise.videos || [],
      tips: newExercise.tips || [],
      safetyNotes: newExercise.safetyNotes || [],
      variations: newExercise.variations || [],
      tags: newExercise.tags || [],
      isUserCreated: newExercise.isUserCreated || false,
      createdBy: newExercise.createdBy,
      isApproved: newExercise.isApproved
    });

    return newExercise;
  }

  async getExerciseById(id: string): Promise<Exercise | null> {
    const result = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
    return result[0] || null;
  }

  async getAllExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises).where(eq(exercises.isApproved, true));
  }

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    return await db.select().from(exercises).where(and(
      eq(exercises.category, category),
      eq(exercises.isApproved, true)
    ));
  }

  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    return await db.select().from(exercises).where(and(
      sql`${muscleGroup} = ANY(muscle_groups)`,
      eq(exercises.isApproved, true)
    ));
  }

  async searchExercises(query: string): Promise<Exercise[]> {
    return await db.select().from(exercises).where(and(
      ilike(exercises.name, `%${query}%`),
      eq(exercises.isApproved, true)
    ));
  }

  async updateExercise(id: string, updates: Partial<Exercise>): Promise<Exercise> {
    await db.update(exercises).set(updates).where(eq(exercises.id, id));
    const updated = await this.getExerciseById(id);
    if (!updated) throw new Error("Exercise not found");
    return updated;
  }

  async deleteExercise(id: string): Promise<boolean> {
    const result = await db.delete(exercises).where(eq(exercises.id, id));
    return result.count > 0;
  }

  async approveUserExercise(id: string): Promise<Exercise> {
    return await this.updateExercise(id, { isApproved: true });
  }

  async getUserCreatedExercises(userId: string): Promise<Exercise[]> {
    return await db.select().from(exercises).where(eq(exercises.createdBy, userId));
  }

  async getWorkoutTemplates(filters?: { category?: string; difficulty?: string; bodyPart?: string }): Promise<Post[]> {
    const result = await db.select()
      .from(posts)
      .where(eq(posts.type, "workout"))
      .orderBy(desc(posts.createdAt));
    
    // Filter for templates (posts with workoutData that are templates)
    return result.filter((post: any) => 
      post.workoutData && (post.workoutData as any).isTemplate
    );
  }

  // Canonical workout templates (not yet persisted in DB - placeholder layer)
  async createWorkoutTemplate(template: InsertWorkoutTemplate & { ownerUserId: string }): Promise<WorkoutTemplate> {
    const full: WorkoutTemplate = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...template,
      ownerUserId: template.ownerUserId,
      exercises: template.exercises || [],
    } as WorkoutTemplate;
    this.workoutTemplates.set(full.id, full);
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

  // Saved workouts CRUD (in-memory)
  async saveWorkout(data: InsertSavedWorkout): Promise<SavedWorkout> {
    const list = this.savedWorkouts.get(data.userId) || [];
    
    // Check if already saved to prevent duplicates
    const existing = list.find(sw => sw.templateId === data.templateId && sw.sourceType === data.sourceType);
    if (existing) {
      console.log(`[PgStorage] Workout ${data.templateId} already saved for user ${data.userId}`);
      return existing;
    }
    
    const saved: SavedWorkout = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...data,
    } as SavedWorkout;
    list.unshift(saved);
    this.savedWorkouts.set(data.userId, list);
    console.log(`[PgStorage] Saved workout ${saved.id} for user ${data.userId}. Total saved: ${list.length}`);
    return saved;
  }

  async listSavedWorkouts(userId: string): Promise<SavedWorkout[]> {
    const list = this.savedWorkouts.get(userId) || [];
    console.log(`[PgStorage] Listing saved workouts for user ${userId}: ${list.length} found`);
    return list;
  }

  async deleteSavedWorkout(userId: string, savedWorkoutId: string): Promise<boolean> {
    const list = this.savedWorkouts.get(userId) || [];
    const newList = list.filter(sw => sw.id !== savedWorkoutId);
    const changed = newList.length !== list.length;
    console.log(`[PgStorage] Delete workout ${savedWorkoutId} for user ${userId}: ${changed ? 'success' : 'not found'}`);
    if (changed) this.savedWorkouts.set(userId, newList);
    return changed;
  }

  // Saved meals CRUD (in-memory)
  async saveMeal(data: InsertSavedMeal): Promise<SavedMeal> {
    const list = this.savedMeals.get(data.userId) || [];
    
    // Check if already saved to prevent duplicates
    const existing = list.find(sm => sm.mealId === data.mealId);
    if (existing) {
      console.log(`[PgStorage] Meal ${data.mealId} already saved for user ${data.userId}`);
      return existing;
    }
    
    const saved: SavedMeal = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...data,
    } as SavedMeal;
    list.unshift(saved);
    this.savedMeals.set(data.userId, list);
    console.log(`[PgStorage] Saved meal ${saved.id} for user ${data.userId}. Total saved: ${list.length}`);
    return saved;
  }

  async listSavedMeals(userId: string): Promise<SavedMeal[]> {
    const list = this.savedMeals.get(userId) || [];
    console.log(`[PgStorage] Listing saved meals for user ${userId}: ${list.length} found`);
    return list;
  }

  async deleteSavedMeal(userId: string, savedMealId: string): Promise<boolean> {
    const list = this.savedMeals.get(userId) || [];
    const newList = list.filter(sm => sm.id !== savedMealId);
    const changed = newList.length !== list.length;
    console.log(`[PgStorage] Delete meal ${savedMealId} for user ${userId}: ${changed ? 'success' : 'not found'}`);
    if (changed) this.savedMeals.set(userId, newList);
    return changed;
  }

  // Recipe database methods (in-memory fallback for PgStorage)
  async addRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
    const newRecipe: Recipe = {
      id: recipe.id || crypto.randomUUID(),
      name: recipe.name || "Unnamed Recipe",
      description: recipe.description || "",
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      cookTime: recipe.cookTime || 0,
      prepTime: recipe.prepTime || 0,
      servings: recipe.servings || 1,
      difficulty: (recipe.difficulty as any) || "easy",
      cuisineType: recipe.cuisineType,
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
    return Array.from(this.recipes.values()).filter(r => r.category === category);
  }

  async getRecipesByDietaryTags(tags: string[]): Promise<Recipe[]> {
    return Array.from(this.recipes.values()).filter(r => r.dietaryTags && tags.some(t => r.dietaryTags!.includes(t)));
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    const q = query.toLowerCase();
    return Array.from(this.recipes.values()).filter(r =>
      r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q) || r.ingredients.some(i => i.toLowerCase().includes(q))
    );
  }

  async getRandomRecipes(count: number): Promise<Recipe[]> {
    const all = Array.from(this.recipes.values());
    const shuffled = all.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Workout session tracking (in-memory fallback)
  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const newSession: WorkoutSession = {
      id: crypto.randomUUID(),
      ...session,
      createdAt: new Date(),
    } as WorkoutSession;

    this.workoutSessions.set(newSession.id, newSession);

    // also create exercise progress entries
    for (const exercise of session.exercises) {
      const bestSet = exercise.sets.reduce((best, current) => {
        const currentScore = (current.weight || 0) * (current.reps || 0) + (current.duration || 0);
        const bestScore = (best.weight || 0) * (best.reps || 0) + (best.duration || 0);
        return currentScore > bestScore ? current : best;
      }, exercise.sets[0]);

      const progressEntry: InsertExerciseProgress = {
        userId: session.userId,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        date: session.startTime,
        bestSet: {
          reps: bestSet.reps || 0,
          weight: bestSet.weight,
          duration: bestSet.duration,
          oneRepMax: bestSet.weight ? Math.round(bestSet.weight * (1 + (bestSet.reps || 0) / 30)) : undefined,
        },
        totalVolume: exercise.totalVolume,
        personalRecord: exercise.personalRecord,
        workoutSessionId: newSession.id,
      } as InsertExerciseProgress;

      await this.createExerciseProgress(progressEntry);
    }

    return newSession;
  }

  async getWorkoutSessionById(id: string): Promise<WorkoutSession | null> {
    return this.workoutSessions.get(id) || null;
  }

  async getWorkoutSessionsByUserId(userId: string): Promise<WorkoutSession[]> {
    return Array.from(this.workoutSessions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async updateWorkoutSession(id: string, updates: Partial<WorkoutSession>): Promise<WorkoutSession> {
    const session = this.workoutSessions.get(id);
    if (!session) throw new Error("Workout session not found");
    const updated = { ...session, ...updates } as WorkoutSession;
    this.workoutSessions.set(id, updated);
    return updated;
  }

  async deleteWorkoutSession(id: string): Promise<boolean> {
    return this.workoutSessions.delete(id);
  }

  // Exercise progress (in-memory fallback)
  async createExerciseProgress(progress: InsertExerciseProgress): Promise<ExerciseProgress> {
    const newProgress: ExerciseProgress = {
      id: crypto.randomUUID(),
      ...progress,
      createdAt: new Date(),
    } as ExerciseProgress;

    this.exerciseProgress.set(newProgress.id, newProgress);
    return newProgress;
  }

  async getExerciseProgressById(id: string): Promise<ExerciseProgress | null> {
    return this.exerciseProgress.get(id) || null;
  }

  async getExerciseProgressByUserId(userId: string): Promise<ExerciseProgress[]> {
    return Array.from(this.exerciseProgress.values()).filter(p => p.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExerciseProgressByExercise(userId: string, exerciseId: string): Promise<ExerciseProgress[]> {
    return Array.from(this.exerciseProgress.values()).filter(p => p.userId === userId && p.exerciseId === exerciseId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async updateExerciseProgress(id: string, updates: Partial<ExerciseProgress>): Promise<ExerciseProgress> {
    const progress = this.exerciseProgress.get(id);
    if (!progress) throw new Error("Exercise progress not found");
    const updated = { ...progress, ...updates } as ExerciseProgress;
    this.exerciseProgress.set(id, updated);
    return updated;
  }

  async deleteExerciseProgress(id: string): Promise<boolean> {
    return this.exerciseProgress.delete(id);
  }

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
    })).reverse();
  }

  async getUserPersonalRecords(userId: string): Promise<ExerciseProgress[]> {
    return Array.from(this.exerciseProgress.values()).filter(p => p.userId === userId && p.personalRecord).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Community meals (in-memory fallback)
  async createCommunityMeal(meal: CommunityMeal): Promise<CommunityMeal> {
    this.communityMeals.set(meal.id, meal);
    return meal;
  }

  async getCommunityMealById(id: string): Promise<CommunityMeal | null> {
    return this.communityMeals.get(id) || null;
  }

  async getAllCommunityMeals(): Promise<CommunityMeal[]> {
    return Array.from(this.communityMeals.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateCommunityMeal(id: string, updates: Partial<CommunityMeal>): Promise<CommunityMeal> {
    const meal = this.communityMeals.get(id);
    if (!meal) throw new Error("Community meal not found");
    const updated = { ...meal, ...updates } as CommunityMeal;
    this.communityMeals.set(id, updated);
    return updated;
  }

  async deleteCommunityMeal(id: string): Promise<boolean> {
    return this.communityMeals.delete(id);
  }

  // Progress insights (in-memory fallback)
  async createProgressInsight(insight: InsertProgressInsight): Promise<ProgressInsight> {
    const newInsight: ProgressInsight = {
      id: crypto.randomUUID(),
      ...insight,
      createdAt: new Date(),
    } as ProgressInsight;
    this.progressInsights.set(newInsight.id, newInsight);
    return newInsight;
  }

  async getProgressInsightsByUserId(userId: string): Promise<ProgressInsight[]> {
    return Array.from(this.progressInsights.values()).filter(i => i.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProgressInsight(id: string): Promise<ProgressInsight | null> {
    return this.progressInsights.get(id) || null;
  }

  async deleteProgressInsight(id: string): Promise<boolean> {
    return this.progressInsights.delete(id);
  }

  // Notifications & Messaging
  async createNotification(notification: Partial<Notification>): Promise<Notification> {
    const n: Notification = {
      id: notification.id || crypto.randomUUID(),
      userId: notification.userId as string,
      type: notification.type || "info",
      text: notification.text || "",
      url: notification.url,
      read: notification.read ?? false,
      createdAt: notification.createdAt || new Date(),
    };

    await db.insert(notifications).values({
      id: n.id,
      userId: n.userId,
      type: n.type,
      text: n.text,
      url: n.url,
      read: n.read,
      createdAt: n.createdAt,
    });

    return n;
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    const rows = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
    return rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      type: r.type,
      text: r.text,
      url: r.url,
      read: r.read,
      createdAt: r.createdAt,
    }));
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const res = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
    return res.count > 0;
  }

  async createConversation(participants: string[]): Promise<Conversation> {
    const conv: Conversation = {
      id: crypto.randomUUID(),
      participants,
      lastMessage: undefined,
      createdAt: new Date(),
    };

    await db.insert(conversations).values({
      id: conv.id,
      participants: conv.participants,
      createdAt: conv.createdAt,
      updatedAt: conv.createdAt,
    });

    return conv;
  }

  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    const rows = await db.select().from(conversations).where(sql`${userId} = ANY(participants)`).orderBy(desc(conversations.updatedAt));
    return rows.map((r: any) => ({
      id: r.id,
      participants: r.participants,
      lastMessage: undefined,
      createdAt: r.createdAt,
    }));
  }

  async getMessagesForConversation(conversationId: string): Promise<Message[]> {
    const rows = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(desc(messages.createdAt));
    return rows.map((r: any) => ({
      id: r.id,
      conversationId: r.conversationId,
      senderId: r.senderId,
      content: r.content,
      createdAt: r.createdAt,
      read: r.read,
    }));
  }

  async sendMessage(conversationId: string, message: Partial<Message>): Promise<Message> {
    const m: Message = {
      id: message.id || crypto.randomUUID(),
      conversationId,
      senderId: message.senderId as string,
      content: message.content || "",
      createdAt: message.createdAt || new Date(),
      read: message.read ?? false,
    };

    await db.insert(messages).values({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      read: m.read,
      createdAt: m.createdAt,
    });

    // update conversation updatedAt
    await db.update(conversations).set({ updatedAt: new Date(), lastMessageId: m.id }).where(eq(conversations.id, conversationId));

    return m;
  }

  // Stories (in-memory until DB table added)
  async createStory(story: InsertStory): Promise<Story> {
    const { nanoid } = await import("nanoid");
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
}