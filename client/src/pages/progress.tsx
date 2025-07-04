import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Calendar, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Post } from "@shared/schema";

export default function Progress() {
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const progressPosts = posts.filter(post => post.type === "progress");

  const progressStats = {
    totalUpdates: progressPosts.length,
    weightChanges: progressPosts.filter(p => p.progressData?.weightLost).length,
    bodyFatChanges: progressPosts.filter(p => p.progressData?.bodyFat).length,
    muscleGains: progressPosts.filter(p => p.progressData?.muscleGain).length,
  };

  const progressTypes = progressPosts.reduce((acc, post) => {
    const type = post.progressData?.progressType || "Other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-32 h-8" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-fit-gold rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-fit-gold/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-fit-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{progressStats.totalUpdates}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{progressStats.weightChanges}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Weight Changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{progressStats.bodyFatChanges}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Body Fat Updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{progressStats.muscleGains}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Muscle Gains</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Types */}
        {Object.keys(progressTypes).length > 0 && (
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Progress Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(progressTypes).map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="bg-fit-gold/10 text-fit-gold">
                    {type} ({count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Progress */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Progress</h2>
          
          {progressPosts.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No progress updates yet</p>
            </div>
          ) : (
            progressPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
