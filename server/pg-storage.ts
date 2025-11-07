import { eq, ilike, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "./db.ts";
import { users, posts, comments, connections, progressEntries, exercises } from "../shared/db-schema.ts";
import { IStorage } from "./storage.ts";
import type { User, Post, Comment, Connection, ProgressEntry, Exercise, InsertUser, InsertPost, InsertComment, InsertConnection, InsertProgressEntry, InsertExercise } from "../shared/schema.ts";

export class PgStorage implements IStorage {
  constructor() {
    this.seedData();
  }

  private async seedData() {
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
      fullName: newUser.fullName,
      bio: newUser.bio,
      avatar: newUser.avatar,
      isVerified: newUser.isVerified,
      accountType: newUser.accountType,
      fitnessGoals: newUser.fitnessGoals,
      followers: newUser.followers,
      following: newUser.following,
      location: newUser.location
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

  async getPostsByUserId(userId: string): Promise<Post[]> {
    const userPosts = await db.select().from(posts).where(eq(posts.userId, userId));
    return userPosts;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: { id: string; email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null; }): Promise<User> {
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
      type: newConnection.type,
      status: newConnection.status,
      requestMessage: newConnection.requestMessage
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
    const dbEntries = await db.select().from(progressEntries).where(eq(progressEntries.userId, userId)).orderBy(desc(progressEntries.date));
    
    // Convert database entries to match schema format
    return dbEntries.map(entry => ({
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
    
    return await this.updateProgressEntry(entryId, { aiInsights: insights });
  }

  // Exercise library
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const newExercise = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...exercise
    };
    
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
    return result.filter(post => 
      post.workoutData && (post.workoutData as any).isTemplate
    );
  }
}