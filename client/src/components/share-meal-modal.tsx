import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Plus, Minus, Share2, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { uploadImage as uploadImageToS3 } from "@/lib/imageUpload";
import { INGREDIENT_DATABASE, searchIngredients, type IngredientData } from "@shared/ingredient-database";

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

interface TrackedIngredient {
  name: string;
  quantity: number;
  unit: string;
  data: IngredientData;
}

export default function ShareMealModal({ isOpen, onClose, recipeData }: ShareMealModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<IngredientData[]>([]);
  const [trackedIngredients, setTrackedIngredients] = useState<TrackedIngredient[]>([]);
  const [showSearch, setShowSearch] = useState(false);
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

  // Calculate nutrition automatically when ingredients change
  useEffect(() => {
    if (trackedIngredients.length > 0) {
      const totals = trackedIngredients.reduce((acc, ing) => {
        const multiplier = ing.quantity / 100; // Data is per 100g
        return {
          calories: acc.calories + (ing.data.calories * multiplier),
          protein: acc.protein + (ing.data.protein * multiplier),
          carbs: acc.carbs + (ing.data.carbs * multiplier),
          fat: acc.fat + (ing.data.fat * multiplier),
          fiber: acc.fiber + (ing.data.fiber * multiplier),
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

      form.setValue("calories", Math.round(totals.calories));
      form.setValue("protein", Math.round(totals.protein * 10) / 10);
      form.setValue("carbs", Math.round(totals.carbs * 10) / 10);
      form.setValue("fat", Math.round(totals.fat * 10) / 10);
      form.setValue("fiber", Math.round(totals.fiber * 10) / 10);
      
      // Update ingredients list
      const ingredientNames = trackedIngredients.map(ing => 
        `${ing.name} (${ing.quantity}${ing.unit})`
      );
      form.setValue("ingredients", ingredientNames);
    }
  }, [trackedIngredients, form]);

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
    setIngredientSearch("");
    setSearchResults([]);
    setTrackedIngredients([]);
    setShowSearch(false);
    setIsUploading(false);
  };

  const handleSearchChange = (value: string) => {
    setIngredientSearch(value);
    if (value.length > 1) {
      const results = searchIngredients(value);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const addTrackedIngredient = (ingredientData: IngredientData) => {
    setTrackedIngredients([...trackedIngredients, {
      name: ingredientData.name,
      quantity: 100,
      unit: "g",
      data: ingredientData
    }]);
    setIngredientSearch("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const updateIngredientQuantity = (index: number, quantity: number) => {
    const updated = [...trackedIngredients];
    updated[index].quantity = quantity;
    setTrackedIngredients(updated);
  };

  const removeTrackedIngredient = (index: number) => {
    setTrackedIngredients(trackedIngredients.filter((_, i) => i !== index));
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
    const result = await uploadImageToS3(file);
    return result.url;
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
          <DialogTitle>
            Share Your Meal
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

          {/* Ingredients Section with Nutrition Tracking */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Ingredients & Nutrition</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4 mr-2" />
                Add Ingredient
              </Button>
            </div>
            
            {showSearch && (
              <div className="mb-4">
                <Input
                  placeholder="Search ingredients (e.g., chicken breast, brown rice)..."
                  value={ingredientSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <Card className="mt-2 max-h-60 overflow-y-auto">
                    <CardContent className="p-2">
                      {searchResults.map((result, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="ghost"
                          className="w-full justify-start text-left"
                          onClick={() => addTrackedIngredient(result)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{result.name}</div>
                            <div className="text-xs text-gray-500">
                              {result.category} • {result.calories}cal/100g
                            </div>
                          </div>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {trackedIngredients.length > 0 && (
              <Card className="mb-4">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {trackedIngredients.map((ingredient, index) => (
                      <div key={index} className="space-y-2 pb-3 border-b last:border-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{ingredient.name}</div>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {ingredient.data.category}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTrackedIngredient(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredientQuantity(index, Number(e.target.value))}
                            className="w-24"
                            min="1"
                          />
                          <span className="text-sm text-gray-600">grams</span>
                          <div className="flex-1 text-xs text-gray-500 text-right">
                            {Math.round(ingredient.data.calories * ingredient.quantity / 100)} cal • 
                            {Math.round(ingredient.data.protein * ingredient.quantity / 10) / 10}g protein
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Nutrition Summary - Auto-calculated */}
          {trackedIngredients.length > 0 && (
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-4">
                <Label className="text-sm font-medium mb-3 block">Total Nutrition (Auto-calculated)</Label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {form.watch("calories") || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {form.watch("protein") || 0}g
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Protein</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {form.watch("carbs") || 0}g
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Carbs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {form.watch("fat") || 0}g
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Fat</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {form.watch("fiber") || 0}g
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Fiber</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                "Sharing..."
              ) : (
                form.watch("postToFeed") ? "Share to Community" : "Save to Profile"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}