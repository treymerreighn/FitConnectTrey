import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Sparkles, TrendingUp, Target, Lightbulb } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AIAnalysisResult {
  physicalChanges: string[];
  muscleGrowth: string[];
  bodyComposition: string;
  motivationalInsights: string[];
  recommendations: string[];
  progressScore: number;
  comparisonWithPrevious?: string;
}

interface ProgressPhotoAnalysisProps {
  imageUrl: string;
  previousAnalysis?: AIAnalysisResult;
  userGoals?: string[];
  timeframe?: string;
  onAnalysisComplete?: (analysis: AIAnalysisResult) => void;
}

export function ProgressPhotoAnalysis({
  imageUrl,
  previousAnalysis,
  userGoals = ["general_fitness"],
  timeframe = "1 month",
  onAnalysisComplete
}: ProgressPhotoAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePhoto = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await apiRequest("POST", "/api/ai/analyze-progress-photo", {
        imageUrl,
        previousAnalysis,
        userGoals,
        timeframe
      });
      
      const result = await response.json();
      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      setError("Failed to analyze progress photo. Please try again.");
      console.error("Progress photo analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>AI Progress Analysis</span>
          </CardTitle>
          {!analysis && (
            <Button
              onClick={analyzePhoto}
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
              className="border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Photo
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        {isAnalyzing && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-purple-500 animate-spin" />
              <span className="text-sm text-gray-600">AI is analyzing your progress photo...</span>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded animate-pulse" />
              <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Progress Score */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-lg font-semibold">Progress Score</span>
              </div>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysis.progressScore / 100)}`}
                    className={analysis.progressScore >= 80 ? "text-green-500" : 
                              analysis.progressScore >= 60 ? "text-yellow-500" : "text-red-500"}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{analysis.progressScore}</span>
                </div>
              </div>
              <Badge variant="secondary" className="mt-2">
                {analysis.progressScore >= 80 ? "Excellent" : 
                 analysis.progressScore >= 60 ? "Good" : "Keep Going"}
              </Badge>
            </div>

            {/* Physical Changes */}
            {analysis.physicalChanges.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                  Physical Changes Observed
                </h4>
                <ul className="space-y-1">
                  {analysis.physicalChanges.map((change, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                      <span className="mr-2 text-blue-500">•</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Muscle Growth */}
            {analysis.muscleGrowth.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-green-500" />
                  Muscle Development
                </h4>
                <ul className="space-y-1">
                  {analysis.muscleGrowth.map((growth, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                      <span className="mr-2 text-green-500">•</span>
                      {growth}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Body Composition */}
            {analysis.bodyComposition && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Body Composition Assessment
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  {analysis.bodyComposition}
                </p>
              </div>
            )}

            {/* Motivational Insights */}
            {analysis.motivationalInsights.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                  Motivational Insights
                </h4>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  {analysis.motivationalInsights.map((insight, index) => (
                    <p key={index} className="text-sm text-purple-700 dark:text-purple-300 mb-2 last:mb-0">
                      {insight}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                  AI Recommendations
                </h4>
                <ul className="space-y-1">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                      <span className="mr-2 text-yellow-500">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Comparison with Previous */}
            {analysis.comparisonWithPrevious && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Progress Comparison
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  {analysis.comparisonWithPrevious}
                </p>
              </div>
            )}
          </div>
        )}

        {!analysis && !isAnalyzing && (
          <div className="text-center py-6">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-4">
              Get AI-powered insights about your progress photo
            </p>
            <p className="text-xs text-gray-400">
              Our AI will analyze muscle development, body composition changes, and provide personalized recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}