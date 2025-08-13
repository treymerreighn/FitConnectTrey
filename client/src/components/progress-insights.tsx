import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CURRENT_USER_ID } from "@/lib/constants";
import { 
  Camera, 
  Brain, 
  TrendingUp, 
  Star, 
  Target, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Crown,
  Upload,
  GitCompare
} from "lucide-react";
import type { ProgressInsight } from "@shared/schema";

interface ProgressInsightData {
  overallAssessment: string;
  muscleDefinition: {
    score: number;
    notes: string;
  };
  posture: {
    score: number;
    notes: string;
  };
  bodyComposition: {
    assessment: string;
    changes: string[];
  };
  recommendations: string[];
  motivationalMessage: string;
}

interface ProgressInsightsProps {
  userId?: string;
}

export function ProgressInsights({ userId = CURRENT_USER_ID }: ProgressInsightsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [previousImageUrl, setPreviousImageUrl] = useState("");
  const [timePeriod, setTimePeriod] = useState("1 month");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's progress insights
  const { data: insights, isLoading } = useQuery({
    queryKey: [`/api/progress-insights/${userId}`],
    queryFn: () => fetch(`/api/progress-insights/${userId}`).then(res => res.json()),
  });

  // Analyze single progress photo
  const analyzeMutation = useMutation({
    mutationFn: async ({ imageUrl }: { imageUrl: string }) => {
      return apiRequest("POST", "/api/progress-insights", {
        userId,
        imageUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/progress-insights/${userId}`] });
      toast({
        title: "Analysis Complete!",
        description: "Your progress photo has been analyzed with AI insights.",
      });
      setShowUploadDialog(false);
      setImageUrl("");
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze progress photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Compare two progress photos
  const compareMutation = useMutation({
    mutationFn: async ({ currentImageUrl, previousImageUrl, timePeriod }: { 
      currentImageUrl: string; 
      previousImageUrl: string; 
      timePeriod: string; 
    }) => {
      return apiRequest("POST", "/api/progress-insights/compare", {
        userId,
        currentImageUrl,
        previousImageUrl,
        timePeriod,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/progress-insights/${userId}`] });
      toast({
        title: "Comparison Complete!",
        description: "Your progress comparison has been analyzed with AI insights.",
      });
      setShowCompareDialog(false);
      setCurrentImageUrl("");
      setPreviousImageUrl("");
    },
    onError: (error: any) => {
      toast({
        title: "Comparison Failed",
        description: error.message || "Failed to compare progress photos. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!imageUrl.trim()) {
      toast({
        title: "Image URL Required",
        description: "Please provide a valid image URL.",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate({ imageUrl });
  };

  const handleCompare = () => {
    if (!currentImageUrl.trim() || !previousImageUrl.trim()) {
      toast({
        title: "Both Images Required",
        description: "Please provide URLs for both current and previous images.",
        variant: "destructive",
      });
      return;
    }
    compareMutation.mutate({ currentImageUrl, previousImageUrl, timePeriod });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600"; 
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Fair";
    return "Needs Work";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold">AI Progress Insights</h2>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold">AI Progress Insights</h2>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        </div>

        <div className="flex gap-2">
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Upload className="w-4 h-4 mr-2" />
                Analyze Photo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Analyze Progress Photo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/your-progress-photo.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleAnalyze} 
                  className="w-full"
                  disabled={analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze Photo
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <GitCompare className="w-4 h-4 mr-2" />
                Compare Photos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Compare Progress Photos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentImage">Current Photo URL</Label>
                  <Input
                    id="currentImage"
                    placeholder="https://example.com/current-photo.jpg"
                    value={currentImageUrl}
                    onChange={(e) => setCurrentImageUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="previousImage">Previous Photo URL</Label>
                  <Input
                    id="previousImage"
                    placeholder="https://example.com/previous-photo.jpg"
                    value={previousImageUrl}
                    onChange={(e) => setPreviousImageUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="timePeriod">Time Period</Label>
                  <Select value={timePeriod} onValueChange={setTimePeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2 weeks">2 weeks</SelectItem>
                      <SelectItem value="1 month">1 month</SelectItem>
                      <SelectItem value="2 months">2 months</SelectItem>
                      <SelectItem value="3 months">3 months</SelectItem>
                      <SelectItem value="6 months">6 months</SelectItem>
                      <SelectItem value="1 year">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleCompare} 
                  className="w-full"
                  disabled={compareMutation.isPending}
                >
                  {compareMutation.isPending ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Comparing with AI...
                    </>
                  ) : (
                    <>
                      <GitCompare className="w-4 h-4 mr-2" />
                      Compare Photos
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Insights List */}
      {!insights || insights.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Progress Analysis Yet</h3>
              <p className="text-gray-600 mb-4">
                Upload a progress photo to get AI-powered insights about your transformation.
              </p>
              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload First Photo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {insights.map((insight: ProgressInsight, index: number) => {
            const data = insight.analysisData as ProgressInsightData;
            return (
              <Card key={insight.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      Analysis #{insights.length - index}
                    </CardTitle>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(insight.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Overall Assessment */}
                  <div>
                    <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Overall Assessment
                    </h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {data.overallAssessment}
                    </p>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Muscle Definition</h5>
                        <span className={`font-bold ${getScoreColor(data.muscleDefinition.score)}`}>
                          {data.muscleDefinition.score}/10
                        </span>
                      </div>
                      <Progress value={data.muscleDefinition.score * 10} className="h-2" />
                      <Badge variant="outline" className={getScoreColor(data.muscleDefinition.score)}>
                        {getScoreLabel(data.muscleDefinition.score)}
                      </Badge>
                      <p className="text-sm text-gray-600">{data.muscleDefinition.notes}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Posture</h5>
                        <span className={`font-bold ${getScoreColor(data.posture.score)}`}>
                          {data.posture.score}/10
                        </span>
                      </div>
                      <Progress value={data.posture.score * 10} className="h-2" />
                      <Badge variant="outline" className={getScoreColor(data.posture.score)}>
                        {getScoreLabel(data.posture.score)}
                      </Badge>
                      <p className="text-sm text-gray-600">{data.posture.notes}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Body Composition */}
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Body Composition Analysis</h4>
                    <p className="text-gray-700 mb-3">{data.bodyComposition.assessment}</p>
                    {data.bodyComposition.changes.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Observed Changes:</h5>
                        <ul className="space-y-1">
                          {data.bodyComposition.changes.map((change, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Recommendations
                    </h4>
                    <div className="grid gap-2">
                      {data.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                          <Star className="w-4 h-4 text-blue-600 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Motivational Message */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-600" />
                      Motivation
                    </h4>
                    <p className="text-gray-700 italic">"{data.motivationalMessage}"</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}