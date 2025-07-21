import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CURRENT_USER_ID, WORKOUT_TYPES, MEAL_TYPES, PROGRESS_TYPES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { Dumbbell, Apple, TrendingUp } from "lucide-react";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const basePostSchema = z.object({
  caption: z.string().min(1, "Caption is required"),
  image: z.string().optional(),
  type: z.enum(["workout", "nutrition", "progress"]),
});

const workoutSchema = basePostSchema.extend({
  type: z.literal("workout"),
  workoutType: z.string().min(1, "Workout type is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  calories: z.number().min(1, "Calories must be at least 1"),
  sets: z.number().optional(),
  reps: z.string().optional(),
  intervals: z.number().optional(),
  rest: z.string().optional(),
});

const nutritionSchema = basePostSchema.extend({
  type: z.literal("nutrition"),
  mealType: z.string().min(1, "Meal type is required"),
  calories: z.number().min(1, "Calories must be at least 1"),
  protein: z.number().min(0, "Protein must be at least 0"),
  carbs: z.number().min(0, "Carbs must be at least 0"),
  fat: z.number().min(0, "Fat must be at least 0"),
});

const progressSchema = basePostSchema.extend({
  type: z.literal("progress"),
  progressType: z.string().min(1, "Progress type is required"),
  duration: z.string().min(1, "Duration is required"),
  weightLost: z.string().optional(),
  bodyFat: z.string().optional(),
  muscleGain: z.string().optional(),
});

const postSchema = z.discriminatedUnion("type", [workoutSchema, nutritionSchema, progressSchema]);

type PostFormData = z.infer<typeof postSchema>;

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [selectedType, setSelectedType] = useState<"workout" | "nutrition" | "progress" | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      caption: "",
      image: "",
      type: "workout",
    },
  });

  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    form.setValue("image", imageUrl);
  };

  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const postData = {
        userId: CURRENT_USER_ID,
        caption: data.caption,
        image: data.image,
        type: data.type,
        workoutData: data.type === "workout" ? {
          workoutType: data.workoutType,
          duration: data.duration,
          calories: data.calories,
          sets: data.sets,
          reps: data.reps,
          intervals: data.intervals,
          rest: data.rest,
        } : undefined,
        nutritionData: data.type === "nutrition" ? {
          mealType: data.mealType,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
        } : undefined,
        progressData: data.type === "progress" ? {
          progressType: data.progressType,
          duration: data.duration,
          weightLost: data.weightLost,
          bodyFat: data.bodyFat,
          muscleGain: data.muscleGain,
        } : undefined,
      };

      return apiRequest("/api/posts", {
        method: "POST",
        body: postData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setSelectedType(null);
    setUploadedImageUrl("");
    onClose();
  };

  const handleTypeSelect = (type: "workout" | "nutrition" | "progress") => {
    setSelectedType(type);
    form.setValue("type", type);
  };

  const onSubmit = (data: PostFormData) => {
    createPostMutation.mutate(data);
  };

  if (!selectedType) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2 bg-fit-green/5 border-fit-green/20 hover:bg-fit-green/10"
                onClick={() => handleTypeSelect("workout")}
              >
                <Dumbbell className="h-6 w-6 text-fit-green" />
                <span className="font-medium text-fit-green">Workout</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2 bg-fit-blue/5 border-fit-blue/20 hover:bg-fit-blue/10"
                onClick={() => handleTypeSelect("nutrition")}
              >
                <Apple className="h-6 w-6 text-fit-blue" />
                <span className="font-medium text-fit-blue">Nutrition</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2 bg-fit-gold/5 border-fit-gold/20 hover:bg-fit-gold/10"
                onClick={() => handleTypeSelect("progress")}
              >
                <TrendingUp className="h-6 w-6 text-fit-gold" />
                <span className="font-medium text-fit-gold">Progress</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create {selectedType} Post</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caption</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What's on your mind?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Upload Photo (optional)</FormLabel>
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                currentImageUrl={uploadedImageUrl}
                label="Upload post photo"
                className="mt-2"
              />
            </div>

            {selectedType === "workout" && (
              <>
                <FormField
                  control={form.control}
                  name="workoutType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workout Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select workout type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WORKOUT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="calories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calories Burned</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="300"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sets (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="3"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reps (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="10-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {selectedType === "nutrition" && (
              <>
                <FormField
                  control={form.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MEAL_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="calories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calories</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="protein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protein (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="25"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="carbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carbs (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fat (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="15"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {selectedType === "progress" && (
              <>
                <FormField
                  control={form.control}
                  name="progressType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progress Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select progress type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROGRESS_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Period</FormLabel>
                      <FormControl>
                        <Input placeholder="3 months" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weightLost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight Change (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="10 lbs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bodyFat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Fat Change (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="-2.5%" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="muscleGain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Muscle Gain (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+5 lbs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPostMutation.isPending}>
                {createPostMutation.isPending ? "Creating..." : "Create Post"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
