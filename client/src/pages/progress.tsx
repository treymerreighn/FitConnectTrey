import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Camera, TrendingUp, Brain, Calendar, Weight, Eye, EyeOff, Share2, Sparkles, BarChart3 } from "lucide-react";
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [generatingInsights, setGeneratingInsights] = useState<string | null>(null);
  const [showWeightChart, setShowWeightChart] = useState(true);
  const [weightTrendAnalysis, setWeightTrendAnalysis] = useState<any>(null);
  const [selectedPhotoForAnalysis, setSelectedPhotoForAnalysis] = useState<string | null>(null);

  const { data: progressEntries = [], isLoading } = useQuery<ProgressEntry[]>({
    queryKey: ["/api/progress"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/progress");
      return response.json();
    },
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
    queryKey: ["/api/user-exercises", user?.id || CURRENT_USER_ID],
    queryFn: () => fetch(`/api/user-exercises?userId=${user?.id || CURRENT_USER_ID}`).then(res => res.json()),
  });

  // Analyze weight trends when data changes
  useEffect(() => {
    if (weightData.length >= 3) {
      analyzeWeightTrends();
    }
  }, [weightData.length]);

  const analyzeWeightTrends = async () => {
    try {
      const response = await apiRequest("POST", "/api/ai/analyze-weight-trends", {
        weightEntries: weightData,
        userGoals: ["general_fitness"], // Could come from user profile
        workoutData: recentWorkouts.slice(-10)
      });
      const analysis = await response.json();
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
      
      // Use apiRequest directly to see detailed error responses
      try {
        const response = await apiRequest("POST", "/api/progress", progressData);
        const result = await response.json();
        console.log("API Response:", result);
        return result;
      } catch (error) {
        console.error("API Error:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log("Progress entry created successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/progress", CURRENT_USER_ID] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/progress", CURRENT_USER_ID] });
      setGeneratingInsights(null);
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Simulate photo upload - in real app, upload to cloud storage
      const mockUrls = Array.from(files).map((file, index) => 
        `https://images.unsplash.com/photo-${Date.now()}-${index}?w=300&h=400&fit=crop`
      );
      setSelectedPhotos(prev => [...prev, ...mockUrls]);
    }
  };

  const onSubmit = (data: ProgressFormData) => {
    console.log("Form submit triggered with data:", data);
    console.log("Form errors:", form.formState.errors);
    createProgressMutation.mutate(data);
  };

  const handleGenerateInsights = (entry: ProgressEntry) => {
    if (entry.photos.length === 0) return;
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <div className="px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-fit-green rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress Tracking</h1>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-fit-green hover:bg-fit-green/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Progress Entry</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    {...form.register("date")}
                  />
                </div>

                <div>
                  <Label htmlFor="weight">Weight (lbs) - Optional</Label>
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
                  <Label>Progress Photos - Optional</Label>
                  <p className="text-xs text-gray-500 mb-2">Add photos to track your visual progress with AI analysis</p>
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
                      className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="text-center">
                        <Camera className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Add photos (optional)
                        </p>
                      </div>
                    </label>
                    
                    {selectedPhotos.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {selectedPhotos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Progress ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes - Optional</Label>
                  <Textarea
                    id="notes"
                    placeholder="How are you feeling? Any observations?"
                    {...form.register("notes")}
                  />
                </div>

                {/* Privacy Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="privacy"
                    checked={form.watch("isPrivate")}
                    onCheckedChange={(checked) => form.setValue("isPrivate", checked)}
                  />
                  <Label htmlFor="privacy" className="flex items-center space-x-2">
                    {form.watch("isPrivate") ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{form.watch("isPrivate") ? "Private" : "Shareable"}</span>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-fit-green hover:bg-fit-green/90"
                  disabled={createProgressMutation.isPending}
                >
                  {createProgressMutation.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress Overview */}
        {progressStats && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Weight className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Weight Change</p>
                    <p className={`text-lg font-bold ${progressStats.weightChange && progressStats.weightChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Progress History</h2>
          
          {progressEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start Your Progress Journey</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Track your weight and visual progress with optional photos and AI insights</p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-fit-green hover:bg-fit-green/90">
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
                        className="border-fit-green text-fit-green hover:bg-fit-green hover:text-white"
                      >
                        {generatingInsights === entry.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-fit-green border-t-transparent rounded-full animate-spin mr-2" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate AI Insights
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Metrics */}
                  <div className="flex flex-wrap gap-4">
                    {entry.weight && (
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{entry.weight}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">lbs</div>
                      </div>
                    )}
                    

                  </div>

                  {/* Progress Photos */}
                  {entry.photos.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Progress Photos</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {entry.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Progress ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Insights */}
                  {entry.aiInsights && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center space-x-2 mb-3">
                        <Brain className="w-5 h-5 text-purple-600" />
                        <h4 className="font-medium text-purple-900 dark:text-purple-100">AI Insights</h4>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          {Math.round((entry.aiInsights.confidenceScore || 0) * 100)}% confidence
                        </Badge>
                      </div>
                      
                      {entry.aiInsights.bodyComposition && (
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-1">Body Composition Analysis</h5>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{entry.aiInsights.bodyComposition}</p>
                        </div>
                      )}
                      
                      {entry.aiInsights.progressAnalysis && (
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-1">Progress Analysis</h5>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{entry.aiInsights.progressAnalysis}</p>
                        </div>
                      )}
                      
                      {entry.aiInsights.recommendations.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Recommendations</h5>
                          <ul className="space-y-1">
                            {entry.aiInsights.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start space-x-2">
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
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Notes</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
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