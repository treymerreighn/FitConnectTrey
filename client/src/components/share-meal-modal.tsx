import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Plus, Minus, Share2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const shareMealSchema = z.object({
  caption: z.string().min(1, "Caption is required"),
  ingredients: z.array(z.string()).optional(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  fiber: z.number().optional(),
  postToFeed: z.boolean().default(true),
});

type ShareMealFormData = z.infer<typeof shareMealSchema>;

interface ShareMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeData?: {
    name: string;
    ingredients?: string[];
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
}

export default function ShareMealModal({ isOpen, onClose, recipeData }: ShareMealModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredientInput, setIngredientInput] = useState("");
  const [showMacros, setShowMacros] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ShareMealFormData>({
    resolver: zodResolver(shareMealSchema),
    defaultValues: {
      caption: recipeData?.name || "",
      ingredients: recipeData?.ingredients || [],
      calories: recipeData?.calories,
      protein: recipeData?.protein,
      carbs: recipeData?.carbs,
      fat: recipeData?.fat,
      fiber: recipeData?.fiber,
      postToFeed: true,
    },
  });

  const ingredients = form.watch("ingredients") || [];

  const shareMealMutation = useMutation({
    mutationFn: async (data: ShareMealFormData & { imageUrl?: string }) => {
      return apiRequest("POST", "/api/meals/share", data);
    },
    onSuccess: (result, variables) => {
      toast({
        title: "Meal Shared Successfully!",
        description: variables.postToFeed 
          ? "Your meal has been shared with the community!" 
          : "Your meal has been saved to your profile!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community-meals"] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error Sharing Meal",
        description: error.message || "Failed to share meal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    form.reset();
    setSelectedImage(null);
    setImagePreview(null);
    setIngredientInput("");
    setShowMacros(false);
    setIsUploading(false);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await response.json();
    return data.url;
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      const currentIngredients = form.getValues("ingredients") || [];
      form.setValue("ingredients", [...currentIngredients, ingredientInput.trim()]);
      setIngredientInput("");
    }
  };

  const removeIngredient = (index: number) => {
    const currentIngredients = form.getValues("ingredients") || [];
    form.setValue("ingredients", currentIngredients.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ShareMealFormData) => {
    try {
      setIsUploading(true);
      let imageUrl: string | undefined;

      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      await shareMealMutation.mutateAsync({
        ...data,
        imageUrl,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to share meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5 text-green-600" />
            <span>Share Your Meal</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload Section */}
          <div>
            <Label htmlFor="image" className="text-sm font-medium">
              Meal Photo
            </Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Meal preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> a photo of your meal
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 10MB)</p>
                  </div>
                  <input
                    id="image"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Caption Section */}
          <div>
            <Label htmlFor="caption" className="text-sm font-medium">
              Caption *
            </Label>
            <Textarea
              id="caption"
              placeholder="Tell us about your delicious meal..."
              className="mt-2"
              {...form.register("caption")}
            />
            {form.formState.errors.caption && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.caption.message}</p>
            )}
          </div>

          {/* Ingredients Section */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Ingredients (Optional)</Label>
            </div>
            
            {ingredients.length > 0 && (
              <Card className="mt-2">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {ingredients.map((ingredient, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{ingredient}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex space-x-2 mt-2">
              <Input
                placeholder="Add an ingredient..."
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIngredient();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addIngredient}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Macros Section */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Nutrition Information (Optional)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowMacros(!showMacros)}
              >
                {showMacros ? "Hide" : "Show"} Macros
              </Button>
            </div>

            {showMacros && (
              <Card className="mt-2">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="calories" className="text-xs">Calories</Label>
                      <Input
                        id="calories"
                        type="number"
                        placeholder="0"
                        {...form.register("calories", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="protein" className="text-xs">Protein (g)</Label>
                      <Input
                        id="protein"
                        type="number"
                        step="0.1"
                        placeholder="0"
                        {...form.register("protein", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="carbs" className="text-xs">Carbs (g)</Label>
                      <Input
                        id="carbs"
                        type="number"
                        step="0.1"
                        placeholder="0"
                        {...form.register("carbs", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fat" className="text-xs">Fat (g)</Label>
                      <Input
                        id="fat"
                        type="number"
                        step="0.1"
                        placeholder="0"
                        {...form.register("fat", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fiber" className="text-xs">Fiber (g)</Label>
                      <Input
                        id="fiber"
                        type="number"
                        step="0.1"
                        placeholder="0"
                        {...form.register("fiber", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Post to Feed Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Share with Community</Label>
              <p className="text-xs text-gray-500 mt-1">
                Post this meal to the main feed for others to see and get inspired
              </p>
            </div>
            <Switch
              checked={form.watch("postToFeed")}
              onCheckedChange={(checked) => form.setValue("postToFeed", checked)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || shareMealMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isUploading || shareMealMutation.isPending ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-pulse" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  {form.watch("postToFeed") ? "Share to Community" : "Save to Profile"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}