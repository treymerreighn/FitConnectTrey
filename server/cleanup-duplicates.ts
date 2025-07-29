import { storage } from "./storage";
import { removeDuplicateExercises, logDuplicateRemovalStats } from "./duplicate-remover";

/**
 * One-time cleanup script to remove all duplicate exercises from storage
 */
export async function cleanupDuplicateExercises(): Promise<void> {
  try {
    console.log("🧹 Starting duplicate exercise cleanup...");
    
    // Get all exercises from storage
    const allExercises = await storage.getAllExercises();
    console.log(`📊 Found ${allExercises.length} total exercises in storage`);
    
    // Remove duplicates
    const uniqueExercises = removeDuplicateExercises(allExercises);
    logDuplicateRemovalStats(allExercises, uniqueExercises);
    
    // If duplicates were found, clean up storage
    if (allExercises.length > uniqueExercises.length) {
      console.log("🗑️ Removing duplicate exercises from storage...");
      
      // Delete all exercises first
      for (const exercise of allExercises) {
        await storage.deleteExercise(exercise.id);
      }
      
      // Re-add only unique exercises
      for (const exercise of uniqueExercises) {
        await storage.createExercise(exercise);
      }
      
      console.log(`✅ Cleanup complete! Storage now has ${uniqueExercises.length} unique exercises`);
    } else {
      console.log("✅ No duplicates found - storage is already clean!");
    }
    
  } catch (error) {
    console.error("❌ Error during duplicate cleanup:", error);
    throw error;
  }
}