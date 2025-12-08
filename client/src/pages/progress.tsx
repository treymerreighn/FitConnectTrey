import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Camera, TrendingUp, Brain, Calendar, Weight, Eye, EyeOff, Share2, Sparkles, BarChart3, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { CURRENT_USER_ID } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import type { ProgressEntry, InsertProgressEntry } from "@shared/schema";
import { format } from "date-fns";
import { ProgressChart } from "@/components/ProgressChart";
import { ProgressPhotoAnalysis } from "@/components/ProgressPhotoAnalysis";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "@/components/ui/link";
import { PremiumFeatureDialog } from "@/components/premium-feature-dialog";
import { useLocation } from "wouter";
import { uploadMultipleImages, uploadImage } from "@/lib/imageUpload";
import { useToast } from "@/hooks/use-toast";
import { usePreferences } from "@/contexts/preferences-context";
import { ImageCropper } from "@/components/image-cropper";

const progressFormSchema = z.object({
  date: z.string(),
  weight: z.number().optional(),
  notes: z.string().optional(),
  isPrivate: z.boolean().default(true),
});

type ProgressFormData = z.infer<typeof progressFormSchema>;

export default function Progress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { weightUnit } = usePreferences();
  const [location, setLocation] = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImgSrc, setCropperImgSrc] = useState<string | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState<string | null>(null);
  const [showWeightChart, setShowWeightChart] = useState(true);
  const [weightTrendAnalysis, setWeightTrendAnalysis] = useState<any>(null);
  const [selectedPhotoForAnalysis, setSelectedPhotoForAnalysis] = useState<string | null>(null);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const userId = user?.id || CURRENT_USER_ID;
  const isPremiumUser = user?.isPremium || user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'pro';

  // Check URL parameter to auto-open modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      setIsCreateModalOpen(true);
      // Clean up URL
      setLocation('/progress');
    }
  }, [location, setLocation]);

  const { data: progressEntries = [], isLoading } = useQuery<ProgressEntry[]>({
    queryKey: ["/api/progress", userId],
    queryFn: async () => {
      const entries = await api.getProgressEntries(userId);
      // Ensure entries are sorted newest -> oldest using createdAt (fallback to date)
      return entries.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
        return bTime - aTime;
      });
    },
    enabled: Boolean(userId),
  });

  // Get weight data for chart
  const weightData = progressEntries
    .filter(entry => entry.weight)
    .map(entry => ({
      date: format(new Date(entry.date), 'yyyy-MM-dd'),
      weight: entry.weight!,
      bodyFat: entry.bodyFatPercentage,
      muscleMass: entry.muscleMass
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get recent workouts for trend analysis
  const { data: recentWorkouts = [] } = useQuery({
    queryKey: ["/api/user-exercises", userId],
    queryFn: () => fetch(`/api/user-exercises?userId=${userId}`).then(res => res.json()),
    enabled: Boolean(userId),
  });

  // Analyze weight trends when data changes
  useEffect(() => {
    if (weightData.length >= 3) {
      analyzeWeightTrends();
    }
  }, [weightData.length]);

  const analyzeWeightTrends = async () => {
    try {
      const analysis = await apiRequest("POST", "/api/ai/analyze-weight-trends", {
        weightEntries: weightData,
        userGoals: ["general_fitness"], // Could come from user profile
        workoutData: recentWorkouts.slice(-10),
      });
      setWeightTrendAnalysis(analysis);
    } catch (error) {
      console.error("Failed to analyze weight trends:", error);
    }
  };

  const form = useForm<ProgressFormData>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      isPrivate: true,
    },
  });

  const createProgressMutation = useMutation({
    mutationFn: async (data: ProgressFormData) => {
      console.log("Form data:", data);
      console.log("Selected photos:", selectedPhotos);
      
      const progressData: InsertProgressEntry = {
        userId: user?.id || CURRENT_USER_ID,
        date: new Date(data.date),
        weight: data.weight,
        notes: data.notes,
        photos: selectedPhotos,
        isPrivate: data.isPrivate,
      };
      
      console.log("Progress data to send:", progressData);
      
      try {
        const result = await api.createProgressEntry(progressData);
        return result;
      } catch (error) {
        console.error("API Error:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log("Progress entry created successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/progress", userId] });
      setIsCreateModalOpen(false);
      form.reset();
      setSelectedPhotos([]);
    },
    onError: (error) => {
      console.error("Failed to create progress entry:", error);
    },
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async ({ id, photos }: { id: string; photos: string[] }) => {
      return api.generateAIInsights(id, photos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", userId] });
      setGeneratingInsights(null);
    },
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCropperImgSrc(e.target.result as string);
        setShowCropper(true);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input value so same file can be selected again
    event.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setCropperImgSrc(null);
    setIsUploading(true);
    
    try {
      const file = new File([croppedBlob], "progress-photo.jpg", { type: "image/jpeg" });
      const result = await uploadImage(file);
      if (result.success) {
        setSelectedPhotos(prev => [...prev, result.url]);
        toast({
          title: "Photo uploaded",
          description: "Successfully uploaded photo.",
        });
      } else {
        toast({
          title: "Upload failed",
          description: "Failed to upload photo. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      toast({
        title: "Upload error",
        description: "An error occurred while uploading photos.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data: ProgressFormData) => {
    console.log("Form submit triggered with data:", data);
    console.log("Form errors:", form.formState.errors);
    createProgressMutation.mutate(data);
  };

  const handleGenerateInsights = (entry: ProgressEntry) => {
    if (entry.photos.length === 0) return;
    
    // Check if user has premium access
    if (!isPremiumUser) {
      setShowPremiumDialog(true);
      return;
    }
    
    setGeneratingInsights(entry.id);
    generateInsightsMutation.mutate({ id: entry.id, photos: entry.photos });
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case "excellent": return "bg-green-500";
      case "good": return "bg-blue-500";
      case "average": return "bg-yellow-500";
      case "poor": return "bg-orange-500";
      case "terrible": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case "excellent": return "😄";
      case "good": return "🙂";
      case "average": return "😐";
      case "poor": return "😕";
      case "terrible": return "😞";
      default: return "❓";
    }
  };

  const calculateProgress = () => {
    if (progressEntries.length < 2) return null;
    
    const latest = progressEntries[0];
    const earliest = progressEntries[progressEntries.length - 1];
    
    const weightChange = latest.weight && earliest.weight 
      ? latest.weight - earliest.weight 
      : null;
    
    return { weightChange };
  };

  const progressStats = calculateProgress();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
        <div className="px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Header - extends to top of screen */}
      <div className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex-1"></div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white text-center flex-1">PROGRESS</h1>
          <div className="flex-1 flex justify-end">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Entry</span>
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="w-[calc(100vw-1rem)] max-w-md max-h-[90vh] overflow-y-auto rounded-2xl"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <DialogHeader>
                  <DialogTitle>Add Progress Entry</DialogTitle>
                </DialogHeader>
              
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      className="h-10 appearance-none text-left block w-full"
                      {...form.register("date")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="weight">Weight ({weightUnit}) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="Enter your current weight"
                      {...form.register("weight", { valueAsNumber: true })}
                    />
                  </div>

                  {/* Photos */}
                  <div>
                    <Label>Progress Photos</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {isUploading ? (
                            <>
                              <Loader2 className="w-10 h-10 text-gray-400 mb-3 animate-spin" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Uploading...
                              </p>
                            </>
                          ) : (
                            <>
                              <Camera className="w-10 h-10 mb-3 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> progress photos
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 10MB)</p>
                            </>
                          )}
                        </div>
                      </label>
                    
                      {selectedPhotos.length > 0 && (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {selectedPhotos.map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Progress ${index + 1}`}
                              className="w-full aspect-[4/5] object-cover rounded"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="How are you feeling? Any observations?"
                      {...form.register("notes")}
                    />
                  </div>

                  {/* Privacy Toggle */}
                  <div className="flex items-center space-x-2">
                    <div 
                      className={`relative inline-flex h-8 w-24 items-center rounded-full transition-colors cursor-pointer border ${form.watch("isPrivate") ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600' : 'bg-green-500 border-green-600'}`}
                      onClick={() => form.setValue("isPrivate", !form.watch("isPrivate"))}
                    >
                      <span className={`absolute left-2 text-xs font-medium transition-opacity ${form.watch("isPrivate") ? 'opacity-0' : 'opacity-100 text-white'}`}>
                        Public
                      </span>
                      <span className={`absolute right-2 text-xs font-medium transition-opacity ${form.watch("isPrivate") ? 'opacity-100 text-gray-600 dark:text-gray-300' : 'opacity-0'}`}>
                        Private
                      </span>
                      <span
                        className={`inline-block h-6 w-10 transform rounded-full bg-white shadow-sm border border-gray-200 transition-transform duration-200 ease-in-out ${
                          form.watch("isPrivate") ? 'translate-x-1' : 'translate-x-[3.25rem]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="!mt-2">
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                      disabled={createProgressMutation.isPending}
                    >
                      {createProgressMutation.isPending ? "Saving..." : "Save Entry"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-4 sm:py-6 space-y-4">
        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (!isPremiumUser) {
                  setShowPremiumDialog(true);
                } else {
                  window.location.href = '/progress-insights';
                }
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600"
            >
              <Brain className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">AI Insights</span>
              <Crown className="w-3 h-3 ml-1" />
            </Button>
            
            <Link href="/exercise-progress" asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-1 sm:gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Exercise Progress</span>
              </Button>
            </Link>
          </div>

        {/* Premium Feature Dialog */}
        <PremiumFeatureDialog 
          open={showPremiumDialog}
          onOpenChange={setShowPremiumDialog}
          featureName="AI Progress Insights"
        />

        {/* Progress Overview */}
        {progressStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 px-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Weight className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Weight Change</p>
                    <p className={`text-base sm:text-lg font-bold truncate ${progressStats.weightChange && progressStats.weightChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {progressStats.weightChange ? 
                        `${progressStats.weightChange > 0 ? '+' : ''}${progressStats.weightChange.toFixed(1)} lbs` : 
                        'No data'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Entries */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white px-4">Progress History</h2>
          
          {progressEntries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start Your Progress Journey</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Track your weight and visual progress with optional photos and AI insights</p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                Add Your First Entry
              </Button>
            </div>
          ) : (
            progressEntries.map((entry) => (
              <Card key={entry.id} className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <CardTitle className="text-lg">
                          {format(new Date(entry.date), "MMMM dd, yyyy")}
                        </CardTitle>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {entry.isPrivate ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {entry.photos.length > 0 && !entry.aiInsights && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateInsights(entry)}
                        disabled={generatingInsights === entry.id}
                        className="border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white text-xs sm:text-sm"
                      >
                        {generatingInsights === entry.id ? (
                          <>
                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">AI Insights</span>
                            <span className="sm:hidden">AI</span>
                            {!isPremiumUser && <Crown className="w-3 h-3 ml-1" />}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3 sm:space-y-4">
                  {/* Metrics */}
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    {entry.weight && (
                      <div className="text-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[70px]">
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{entry.weight}</div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">lbs</div>
                      </div>
                    )}
                    

                  </div>

                  {/* Progress Photos */}
                  {entry.photos.length > 0 && (
                    <div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">Progress Photos</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {entry.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Progress ${index + 1}`}
                            className="w-full h-32 sm:h-40 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Insights */}
                  {entry.aiInsights && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-3 sm:p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                          <h4 className="text-sm sm:text-base font-medium text-purple-900 dark:text-purple-100">AI Insights</h4>
                        </div>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                      
                      {entry.aiInsights.bodyComposition && (
                        <div className="mb-3">
                          <h5 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1">Body Composition Analysis</h5>
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{entry.aiInsights.bodyComposition}</p>
                        </div>
                      )}
                      
                      {entry.aiInsights.progressAnalysis && (
                        <div className="mb-3">
                          <h5 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1">Progress Analysis</h5>
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{entry.aiInsights.progressAnalysis}</p>
                        </div>
                      )}
                      
                      {entry.aiInsights.recommendations.length > 0 && (
                        <div>
                          <h5 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">Recommendations</h5>
                          <ul className="space-y-1">
                            {entry.aiInsights.recommendations.map((rec, index) => (
                              <li key={index} className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex items-start space-x-2">
                                <span className="text-purple-600 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {entry.notes && (
                    <div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">Notes</h4>
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 sm:p-3 rounded-lg">
                        {entry.notes}
                      </p>
                    </div>
                  )}

                  {/* Measurements */}
                  {entry.measurements && Object.values(entry.measurements).some(val => val) && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Measurements</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                        {Object.entries(entry.measurements).map(([key, value]) => 
                          value ? (
                            <div key={key} className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="font-medium text-gray-900 dark:text-white">{value}"</div>
                              <div className="text-gray-600 dark:text-gray-400 capitalize">{key}</div>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Share to Feed Option */}
                  {!entry.isPrivate && (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Share2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-800 dark:text-green-200">Shared to your feed</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}