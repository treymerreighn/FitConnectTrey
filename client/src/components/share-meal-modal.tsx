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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Plus, Minus, Share2, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { uploadImage as uploadImageToS3 } from "@/lib/imageUpload";
import { INGREDIENT_DATABASE, searchIngredients, type IngredientData } from "@shared/ingredient-database";
import { ImageCropper } from "@/components/image-cropper";

const UNIT_CONVERSIONS: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.35,
  lbs: 453.59,
  tbsp: 15,
  tsp: 5,
  cup: 240,
};

const formatMetric = (value: number, isCalories = false) => {
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'k';
  }
  return isCalories ? Math.round(value) : Math.round(value * 10) / 10;
};

const shareMealSchema = z.object({
  title: z.string().min(1, "Title is required"),
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
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImgSrc, setCropperImgSrc] = useState<string | null>(null);
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
      title: recipeData?.name || "",
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
        const grams = ing.quantity * (UNIT_CONVERSIONS[ing.unit] || 1);
        const multiplier = grams / 100; // Data is per 100g
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

  const updateIngredient = (index: number, field: 'quantity' | 'unit', value: number | string) => {
    const updated = [...trackedIngredients];
    if (field === 'quantity') {
      updated[index].quantity = Number(value);
    } else if (field === 'unit') {
      updated[index].unit = String(value);
    }
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

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCropperImgSrc(e.target.result as string);
          setShowCropper(true);
        }
      };
      reader.readAsDataURL(file);
      
      // Reset input value so the same file can be selected again if needed
      event.target.value = '';
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], "meal-photo.jpg", { type: "image/jpeg" });
    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setShowCropper(false);
    setCropperImgSrc(null);
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
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl w-[calc(100%-2rem)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            Share Your Meal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Section */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Meal Title *
            </Label>
            <Input
              id="title"
              placeholder="e.g., Grilled Chicken Salad"
              className="mt-2"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

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
                    className="w-full aspect-[4/5] object-cover rounded-lg"
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
            <div className="mb-2">
              <Label className="text-sm font-medium">Ingredients & Nutrition</Label>
            </div>
            
            {!showSearch ? (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-muted-foreground mb-4 font-normal"
                onClick={() => setShowSearch(true)}
              >
                <Search className="h-4 w-4 mr-2" />
                Add Ingredient...
              </Button>
            ) : (
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
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {trackedIngredients.map((ingredient, index) => (
                      <div key={index} className="space-y-1 pb-2 border-b last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{ingredient.name}</div>
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 mt-0.5">
                              {ingredient.data.category}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => removeTrackedIngredient(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                            className="w-16 h-10 text-sm px-2"
                            min="0.1"
                            step="0.1"
                          />
                          <Select
                            value={ingredient.unit}
                            onValueChange={(value) => updateIngredient(index, 'unit', value)}
                          >
                            <SelectTrigger className="w-16 h-10 text-sm px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(UNIT_CONVERSIONS).map((unit) => (
                                <SelectItem key={unit} value={unit} className="text-sm">
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex-1 min-w-0 text-xs text-gray-500 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatMetric(ingredient.data.calories * (ingredient.quantity * (UNIT_CONVERSIONS[ingredient.unit] || 1) / 100), true)} cal • {formatMetric(ingredient.data.protein * (ingredient.quantity * (UNIT_CONVERSIONS[ingredient.unit] || 1) / 100))} protein(g)
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
                      {formatMetric(form.watch("calories") || 0, true)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {formatMetric(form.watch("protein") || 0)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Protein (g)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {formatMetric(form.watch("carbs") || 0)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Carbs (g)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {formatMetric(form.watch("fat") || 0)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Fat (g)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {formatMetric(form.watch("fiber") || 0)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Fiber (g)</div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 text-right mt-2 italic">
                  * g = grams
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Post to Feed Toggle */}
          <div className="flex items-center space-x-2">
            <div 
              className={`relative inline-flex h-8 w-24 items-center rounded-full transition-colors cursor-pointer border ${form.watch("postToFeed") ? 'bg-green-500 border-green-600' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}
              onClick={() => form.setValue("postToFeed", !form.watch("postToFeed"))}
            >
              <span className={`absolute left-2 text-xs font-medium transition-opacity ${form.watch("postToFeed") ? 'opacity-100 text-white' : 'opacity-0'}`}>
                Public
              </span>
              <span className={`absolute right-2 text-xs font-medium transition-opacity ${form.watch("postToFeed") ? 'opacity-0' : 'opacity-100 text-gray-600 dark:text-gray-300'}`}>
                Private
              </span>
              <span
                className={`inline-block h-6 w-10 transform rounded-full bg-white shadow-sm border border-gray-200 transition-transform duration-200 ease-in-out ${
                  form.watch("postToFeed") ? 'translate-x-[3.25rem]' : 'translate-x-1'
                }`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="!mt-2">
            <Button
              type="submit"
              disabled={isUploading || shareMealMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
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

      {cropperImgSrc && (
        <ImageCropper
          open={showCropper}
          onClose={() => {
            setShowCropper(false);
            setCropperImgSrc(null);
          }}
          imageSrc={cropperImgSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={4/5}
          circularCrop={false}
        />
      )}
    </Dialog>
  );
}