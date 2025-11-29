import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Settings, Camera, Edit3, MapPin, Calendar, Trophy, Users, Heart, MessageCircle, Share2, MoreHorizontal, Plus, Dumbbell, TrendingUp, Target, Weight, Clock, Flame, BarChart3, X, Activity, Brain, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useRoute, useLocation } from "wouter";
import { CURRENT_USER_ID } from "@/lib/constants";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/imageUpload";
import { Link } from "@/components/ui/link";
import { useAuth } from "@/hooks/useAuth";
// apiRequest is not used directly here; use the `api` wrapper instead
import type { User as UserType, Post, ProgressEntry } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const editProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().max(160, "Bio must be under 160 characters"),
  location: z.string().optional(),
  // Coerce string inputs into numbers so form inputs (which produce strings) validate correctly
  height: z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return undefined;
    const n = Number(val);
    return Number.isNaN(n) ? val : n;
  }, z.number().optional()),
  weight: z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return undefined;
    const n = Number(val);
    return Number.isNaN(n) ? val : n;
  }, z.number().optional()),
  fitnessGoals: z.array(z.string()).default([]),
});

type EditProfileData = z.infer<typeof editProfileSchema>;

// Progress Insights Tab Component
function ProgressInsightsTab({ userId, isOwner }: { userId: string; isOwner?: boolean }) {
  const [selectedMetric, setSelectedMetric] = useState<"weight" | "bodyFat" | "muscle">("weight");
  
  // Fetch progress entries
  const { data: progressEntries = [], isLoading: progressLoading } = useQuery<ProgressEntry[]>({
    queryKey: ["/api/progress", userId],
    queryFn: async () => {
      const entries = await api.getProgressEntries(userId);
      return entries.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
        return bTime - aTime;
      });
    },
    enabled: Boolean(userId),
  });

  // Fetch recent posts for activity tracking
  const { data: userPosts = [] } = useQuery({
    queryKey: ["/api/posts", "user", userId],
    queryFn: async () => api.getPostsByUserId(userId),
    enabled: Boolean(userId),
  });

  if (progressLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Prepare chart data
  const chartData = progressEntries
    .filter(entry => entry.weight || entry.bodyFatPercentage || entry.muscleMass)
    .map(entry => ({
      date: format(new Date(entry.date), 'MMM dd'),
      weight: entry.weight,
      bodyFat: entry.bodyFatPercentage,
      muscle: entry.muscleMass,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10); // Last 10 entries

  // Calculate progress stats
  const latestEntry = progressEntries[0];
  const firstEntry = progressEntries[progressEntries.length - 1];
  const weightChange = latestEntry?.weight && firstEntry?.weight 
    ? latestEntry.weight - firstEntry.weight 
    : null;
  
  const workoutPosts = userPosts.filter((post: Post) => post.type === 'workout').length;
  const progressPosts = userPosts.filter((post: Post) => post.type === 'progress').length;
  const nutritionPosts = userPosts.filter((post: Post) => post.type === 'nutrition').length;

  // Activity breakdown for pie chart
  const activityData = [
    { name: 'Workout Posts', value: workoutPosts, color: '#3B82F6' },
    { name: 'Progress Posts', value: progressPosts, color: '#10B981' },
    { name: 'Nutrition Posts', value: nutritionPosts, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  return (
    <div className="w-full">
      {/* Progress Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-b">
        <Card className="rounded-none border-r border-b bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4 text-center">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-blue-600" />
            <div className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
              {progressEntries.length}
            </div>
            <div className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400">Progress Entries</div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-r border-b bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-green-600" />
            <div className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-300">
              {isOwner ? (latestEntry?.weight ?? '--') : '--'}
            </div>
            <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">Current Weight</div>
            {!isOwner && (
              <div className="text-[10px] sm:text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none border-r border-b lg:border-r bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-purple-600" />
            <div className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
              {isOwner ? (weightChange ? (weightChange > 0 ? '+' : '') + weightChange : '--') : '--'}
            </div>
            <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400">Weight Change</div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-b bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardContent className="p-4 text-center">
            <Brain className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {progressEntries.filter(e => e.aiInsights).length}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">AI Insights</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts */}
      {chartData.length > 0 && (
        <Card className="rounded-none border-0 border-b bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Progress Trends
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={selectedMetric === "weight" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMetric("weight")}
                >
                  Weight
                </Button>
                <Button
                  variant={selectedMetric === "bodyFat" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMetric("bodyFat")}
                >
                  Body Fat
                </Button>
                <Button
                  variant={selectedMetric === "muscle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMetric("muscle")}
                >
                  Muscle
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Breakdown */}
      {activityData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-0">
          <Card className="rounded-none border-0 border-b md:border-r bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Activity Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                    >
                      {activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {activityData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Progress Photos */}
          <Card className="rounded-none border-0 border-b bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-500" />
                Recent Progress Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressEntries.filter(entry => entry.photos.length > 0).length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {progressEntries
                    .filter(entry => entry.photos.length > 0)
                    .slice(0, 4)
                    .map((entry, index) => (
                      <OptimizedImage
                        key={index}
                        src={entry.photos[0]}
                        alt={`Progress ${index + 1}`}
                        width={240}
                        height={96}
                        className="w-full h-24 object-cover rounded-lg"
                        placeholder="blur"
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No progress photos yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Data State */}
      {progressEntries.length === 0 && (
        <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start Your Progress Journey
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Track your fitness progress with photos, measurements, and notes
            </p>
            <Button 
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => window.location.href = '/progress'}
            >
              Add First Progress Entry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Profile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [openFollowList, setOpenFollowList] = useState<"followers" | "following" | null>(null);
  const { user: authUser } = useAuth();
  const authUserId = (authUser as UserType | undefined)?.id;
  const canonicalViewerId = authUserId || CURRENT_USER_ID;
  const FOLLOW_BUTTON_BASE_CLASS = "min-w-[110px] text-sm font-medium border transition-colors disabled:opacity-80";
  const getFollowButtonClass = (isFollowing: boolean) =>
    `${FOLLOW_BUTTON_BASE_CLASS} ${
      isFollowing
        ? "bg-gray-200 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-700"
        : "bg-fit-green text-white border-fit-green hover:bg-fit-green/90 dark:border-fit-green"
    }`;

  // Fetch the signed-in viewer so we can know following state
  const { data: viewerData } = useQuery<UserType | null>({
    queryKey: [`/api/users/${canonicalViewerId}`],
    queryFn: async () => {
      try {
        return await api.getUserById(canonicalViewerId);
      } catch (_err) {
        return null;
      }
    },
  });
  const { data: allUsers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Determine if we're viewing another user's profile via route param
  const [, routeParams] = useRoute("/profile/:id");
  const routeUserId = (routeParams as any)?.id;

  const fallbackAuthUser = authUserId ? allUsers.find((u) => u.id === authUserId) : undefined;
  const fallbackCanonicalUser = allUsers.find((u) => u.id === canonicalViewerId);
  const fallbackFirstUser = allUsers.length > 0 ? allUsers[0] : undefined;

  const resolvedViewer =
    viewerData ||
    fallbackAuthUser ||
    fallbackCanonicalUser ||
    fallbackFirstUser ||
    null;

  const viewerId = resolvedViewer?.id ?? canonicalViewerId;
  const resolverFollowing = resolvedViewer?.following ?? [];
  const viewerKeyTuple = viewerId ? (["/api/users", viewerId] as const) : null;
  const viewerKeyString = viewerId ? ([`/api/users/${viewerId}`] as const) : null;
  const fallbackViewerTuple = viewerId && viewerId !== canonicalViewerId ? (["/api/users", canonicalViewerId] as const) : null;
  const fallbackViewerString = viewerId && viewerId !== canonicalViewerId ? ([`/api/users/${canonicalViewerId}`] as const) : null;

  const profileUserId = routeUserId || resolvedViewer?.id || fallbackFirstUser?.id;
  const profileUserKeyTuple = profileUserId ? (["/api/users", profileUserId] as const) : null;
  const profileUserKeyString = profileUserId ? ([`/api/users/${profileUserId}`] as const) : null;

  const { data: currentUser, isLoading: userLoading } = useQuery<UserType | null>({
    queryKey: profileUserKeyTuple ?? ["/api/users", "pending-profile"],
    queryFn: async () => {
      if (!profileUserId) return null;
      try {
        return await api.getUserById(profileUserId);
      } catch (err) {
        return null;
      }
    },
    enabled: Boolean(profileUserId),
  });

  // Determine the profile being viewed and whether it's the current user's own profile
  const userId = profileUserId ?? viewerId;
  const isOwner = profileUserId === viewerId;
  const { data: userPosts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", "user", userId],
    queryFn: () => api.getPostsByUserId(userId),
    enabled: Boolean(currentUser),
  });

  // Fetch user's progress entries for stats
  const { data: progressEntries = [] } = useQuery<ProgressEntry[]>({
    queryKey: ["/api/progress", userId],
    queryFn: async () => {
      const entries = await api.getProgressEntries(userId);
      return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: Boolean(currentUser),
  });
  const form = useForm<EditProfileData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: currentUser?.name || "",
      bio: currentUser?.bio || "",
      location: (currentUser as any)?.location ?? undefined,
      fitnessGoals: currentUser?.fitnessGoals || [],
      height: (currentUser as any)?.height ?? undefined,
      weight: (currentUser as any)?.weight ?? undefined,
    },
  });

  // Follow/unfollow mutation for profile page actions
  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const isFollowing = resolverFollowing.includes(targetUserId);
      if (isFollowing) {
        return api.unfollowUser(targetUserId, viewerId);
      }
      return api.followUser(targetUserId, viewerId);
    },
    onMutate: async (targetUserId: string) => {
      if (viewerKeyTuple) await queryClient.cancelQueries({ queryKey: viewerKeyTuple });
      if (viewerKeyString) await queryClient.cancelQueries({ queryKey: viewerKeyString });
      if (fallbackViewerTuple) await queryClient.cancelQueries({ queryKey: fallbackViewerTuple });
      if (fallbackViewerString) await queryClient.cancelQueries({ queryKey: fallbackViewerString });
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      if (profileUserKeyTuple) await queryClient.cancelQueries({ queryKey: profileUserKeyTuple });
      if (profileUserKeyString) await queryClient.cancelQueries({ queryKey: profileUserKeyString });

      const previousViewerArray = viewerKeyTuple
        ? queryClient.getQueryData<UserType>(viewerKeyTuple)
        : undefined;
      const previousViewerString = viewerKeyString
        ? queryClient.getQueryData<UserType>(viewerKeyString)
        : undefined;
      const previousFallbackArray = fallbackViewerTuple
        ? queryClient.getQueryData<UserType>(fallbackViewerTuple)
        : undefined;
      const previousFallbackString = fallbackViewerString
        ? queryClient.getQueryData<UserType>(fallbackViewerString)
        : undefined;
      const previousUsers = queryClient.getQueryData<UserType[]>(["/api/users"]);
      const previousProfileArray = profileUserKeyTuple
        ? queryClient.getQueryData<UserType>(profileUserKeyTuple)
        : undefined;
      const previousProfileString = profileUserKeyString
        ? queryClient.getQueryData<UserType>(profileUserKeyString)
        : undefined;

      const currentlyFollowing =
        resolverFollowing.includes(targetUserId) ||
        Boolean(previousViewerArray?.following?.includes(targetUserId)) ||
        Boolean(previousViewerString?.following?.includes(targetUserId));

      const adjustFollowing = (user?: UserType | null) => {
        if (!user) return user;
        const next = new Set(user.following || []);
        if (currentlyFollowing) {
          next.delete(targetUserId);
        } else {
          next.add(targetUserId);
        }
        return { ...user, following: Array.from(next) } as UserType;
      };

      const adjustFollowers = (user?: UserType | null) => {
        if (!user) return user;
        const followers = new Set(user.followers || []);
        if (currentlyFollowing) {
          followers.delete(viewerId);
        } else {
          followers.add(viewerId);
        }
        return { ...user, followers: Array.from(followers) } as UserType;
      };

      const viewerArrayNext = adjustFollowing(previousViewerArray);
      if (viewerArrayNext && viewerKeyTuple) {
        queryClient.setQueryData(viewerKeyTuple, viewerArrayNext);
      }
      const viewerStringNext = adjustFollowing(previousViewerString);
      if (viewerStringNext && viewerKeyString) {
        queryClient.setQueryData(viewerKeyString, viewerStringNext);
      }
      if (fallbackViewerTuple) {
        const fallbackArrayNext = adjustFollowing(previousFallbackArray);
        if (fallbackArrayNext) {
          queryClient.setQueryData(fallbackViewerTuple, fallbackArrayNext);
        }
      }
      if (fallbackViewerString) {
        const fallbackStringNext = adjustFollowing(previousFallbackString);
        if (fallbackStringNext) {
          queryClient.setQueryData(fallbackViewerString, fallbackStringNext);
        }
      }

      if (previousUsers) {
        const updatedUsers = previousUsers.map((u) => {
          if (u.id !== targetUserId) return u;
          const followers = new Set(u.followers || []);
          if (currentlyFollowing) {
            followers.delete(viewerId);
          } else {
            followers.add(viewerId);
          }
          return { ...u, followers: Array.from(followers) } as UserType;
        });
        queryClient.setQueryData(["/api/users"], updatedUsers);
      }

      const profileArrayNext = adjustFollowers(previousProfileArray);
      if (profileArrayNext && profileUserKeyTuple) {
        queryClient.setQueryData(profileUserKeyTuple, profileArrayNext);
      }
      const profileStringNext = adjustFollowers(previousProfileString);
      if (profileStringNext && profileUserKeyString) {
        queryClient.setQueryData(profileUserKeyString, profileStringNext);
      }

      return {
        previousViewerArray,
        previousViewerString,
        previousFallbackArray,
        previousFallbackString,
        previousUsers,
        previousProfileArray,
        previousProfileString,
      };
    },
    onError: (_err, _targetUserId, context: any) => {
      if (viewerKeyTuple && context?.previousViewerArray) queryClient.setQueryData(viewerKeyTuple, context.previousViewerArray);
      if (viewerKeyString && context?.previousViewerString) queryClient.setQueryData(viewerKeyString, context.previousViewerString);
      if (fallbackViewerTuple && context?.previousFallbackArray) queryClient.setQueryData(fallbackViewerTuple, context.previousFallbackArray);
      if (fallbackViewerString && context?.previousFallbackString) queryClient.setQueryData(fallbackViewerString, context.previousFallbackString);
      if (context?.previousUsers) queryClient.setQueryData(["/api/users"], context.previousUsers);
      if (profileUserKeyTuple && context?.previousProfileArray) queryClient.setQueryData(profileUserKeyTuple, context.previousProfileArray);
      if (profileUserKeyString && context?.previousProfileString) queryClient.setQueryData(profileUserKeyString, context.previousProfileString);
    },
    onSettled: (_data, _error, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      if (viewerKeyTuple) queryClient.invalidateQueries({ queryKey: viewerKeyTuple });
      if (viewerKeyString) queryClient.invalidateQueries({ queryKey: viewerKeyString });
      if (fallbackViewerTuple) queryClient.invalidateQueries({ queryKey: fallbackViewerTuple });
      if (fallbackViewerString) queryClient.invalidateQueries({ queryKey: fallbackViewerString });
      if (profileUserKeyTuple) queryClient.invalidateQueries({ queryKey: profileUserKeyTuple });
      if (profileUserKeyString) queryClient.invalidateQueries({ queryKey: profileUserKeyString });
      if (targetUserId) {
        queryClient.invalidateQueries({ queryKey: ["/api/users", targetUserId] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}`] });
      }
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UserType> }) => {
      return api.updateUser(id, updates);
    },
    onSuccess: () => {
      if (viewerKeyTuple) queryClient.invalidateQueries({ queryKey: viewerKeyTuple });
      if (viewerKeyString) queryClient.invalidateQueries({ queryKey: viewerKeyString });
      if (fallbackViewerTuple) queryClient.invalidateQueries({ queryKey: fallbackViewerTuple });
      if (fallbackViewerString) queryClient.invalidateQueries({ queryKey: fallbackViewerString });
      if (profileUserKeyTuple) queryClient.invalidateQueries({ queryKey: profileUserKeyTuple });
      if (profileUserKeyString) queryClient.invalidateQueries({ queryKey: profileUserKeyString });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: EditProfileData) => {
      return api.updateUser(userId, data);
    },
    onSuccess: () => {
      if (viewerKeyTuple) queryClient.invalidateQueries({ queryKey: viewerKeyTuple });
      if (viewerKeyString) queryClient.invalidateQueries({ queryKey: viewerKeyString });
      if (fallbackViewerTuple) queryClient.invalidateQueries({ queryKey: fallbackViewerTuple });
      if (fallbackViewerString) queryClient.invalidateQueries({ queryKey: fallbackViewerString });
      if (profileUserKeyTuple) queryClient.invalidateQueries({ queryKey: profileUserKeyTuple });
      if (profileUserKeyString) queryClient.invalidateQueries({ queryKey: profileUserKeyString });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadImage(file);
      if (result.success) {
        await updateUserMutation.mutateAsync({ 
          id: userId, 
          updates: { avatar: result.url }
        });
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: EditProfileData) => {
    if (!currentUser) return;
    // Ensure numeric fields are numbers before sending
    const payload: Partial<EditProfileData> = {
      ...data,
      height: data.height ? Number(data.height) : undefined,
      weight: data.weight ? Number(data.weight) : undefined,
      location: data.location ?? undefined,
    };

    try {
      // Update the user record
      await updateProfileMutation.mutateAsync(payload as EditProfileData);

      // If the user edited weight, also create or update a progress entry so profile weight reflects immediately
      if (payload.weight !== undefined && payload.weight !== null) {
        const newWeight = Number(payload.weight);
        const latest = progressEntries && progressEntries.length > 0 ? progressEntries[0] : null;

        const isSameDay = (entry: ProgressEntry) => {
          const entryDate = new Date(entry.createdAt || entry.date);
          const today = new Date();
          return entryDate.getFullYear() === today.getFullYear() && entryDate.getMonth() === today.getMonth() && entryDate.getDate() === today.getDate();
        };

        if (latest && isSameDay(latest)) {
          // Update the existing entry for today
          try {
            await api.updateProgressEntry(latest.id, { weight: newWeight });
          } catch (err) {
            console.error("Failed to update today's progress entry:", err);
          }
        } else {
          // Create a new progress entry with the edited weight
          try {
            await api.createProgressEntry({
              userId,
              date: new Date(),
              weight: newWeight,
              photos: [],
              notes: 'Weight updated via profile',
              isPrivate: true,
            } as any);
          } catch (err) {
            console.error("Failed to create progress entry from profile update:", err);
          }
        }

        // Refresh progress queries so UI shows the updated weight immediately
        queryClient.invalidateQueries({ queryKey: ["/api/progress", userId] });
      }

      setIsEditModalOpen(false);
      toast({ title: 'Profile updated', description: 'Your profile has been successfully updated.' });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({ title: 'Error', description: 'Failed to update profile. Please try again.', variant: 'destructive' });
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    );
  }

  const totalWorkouts = userPosts.filter(p => p.type === "workout").length;
  const totalProgress = progressEntries.length;
  const joinDate = format(new Date(currentUser.createdAt), "MMMM yyyy");
  const latestProgress = (progressEntries && progressEntries.length > 0) ? progressEntries[0] : null;
  const currentWeight = latestProgress?.weight ?? null;
  const currentHeight = (currentUser as any)?.height ?? null;
  const followerUsers = (currentUser.followers ?? [])
    .map(id => allUsers.find(u => u.id === id))
    .filter((u): u is UserType => Boolean(u));
  const followingUsers = (currentUser.following ?? [])
    .map(id => allUsers.find(u => u.id === id))
    .filter((u): u is UserType => Boolean(u));
  const selectedList = openFollowList === "followers"
    ? followerUsers
    : openFollowList === "following"
    ? followingUsers
    : [];
  const selectedTitle = openFollowList === "followers"
    ? "Followers"
    : openFollowList === "following"
    ? "Following"
    : "";
  const modalPronoun = isOwner ? "you" : currentUser.name || "this user";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      <Dialog open={Boolean(openFollowList)} onOpenChange={(value) => { if (!value) setOpenFollowList(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTitle}</DialogTitle>
            {selectedTitle && (
              <DialogDescription>
                {selectedList.length > 0
                  ? `People ${selectedTitle === "Followers" ? "who follow" : "followed by"} ${modalPronoun}.`
                  : `No ${selectedTitle.toLowerCase()} to show yet.`}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {selectedList.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No users to show yet.</p>
            ) : (
              selectedList.map(user => (
                <div key={user.id} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={() => setOpenFollowList(null)}
                    className="flex items-center gap-3 flex-1"
                  >
                    <UserAvatar
                      src={user.avatar || ""}
                      alt={user.name || user.username}
                      name={user.name || user.username}
                      className="h-10 w-10"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {user.name || user.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                    </div>
                  </Link>
                  {user.bio && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                      {user.bio}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      <div className="w-full h-full">
        {/* Profile Header */}
        <Card className="rounded-none border-0 border-b">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                  <AvatarImage src={currentUser.avatar || ""} alt={currentUser.name || ""} />
                  <AvatarFallback className="text-xl sm:text-2xl bg-fit-green text-white">
                    {currentUser.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {isOwner && (
                  <label className="absolute -bottom-1 -right-1 rounded-full w-6 h-6 p-0 bg-fit-green hover:bg-fit-green/90 cursor-pointer flex items-center justify-center">
                    <Camera className="h-3 w-3 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                        {currentUser.name || "User"}
                      </h1>
                      {currentUser.isVerified && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1 truncate">
                      @{currentUser.username}
                    </p>
                    {currentUser.bio && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                        {currentUser.bio}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {currentUser.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{currentUser.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Joined {joinDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    {isOwner ? (
                      <>
                        <Button
                          onClick={() => setIsEditModalOpen(true)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 sm:gap-2"
                        >
                          <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">Edit Profile</span>
                        </Button>
                        <Button variant="outline" size="sm" className="p-2" onClick={() => setLocation('/settings')}>
                          <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </>
                    ) : (
                      // Show follow/following button for other users
                      (() => {
                        const isFollowing = resolverFollowing.includes(userId);
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => followMutation.mutate(userId)}
                            disabled={followMutation.isPending}
                            className={getFollowButtonClass(isFollowing)}
                          >
                            {isFollowing ? "Following" : "Follow"}
                          </Button>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats - Centered Section */}
            <div className="flex justify-center mt-2 pt-2 border-t">
              <div className="w-full max-w-lg">
                <div className="grid grid-cols-4 gap-4">
                  <div 
                    className="text-center cursor-pointer hover:opacity-80 transition-opacity py-2"
                    onClick={() => isOwner && setOpenFollowList("followers")}
                  >
                    <div className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                      {currentUser.followers?.length || 0}
                    </div>
                    <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">Followers</div>
                  </div>
                  <div 
                    className="text-center cursor-pointer hover:opacity-80 transition-opacity py-2"
                    onClick={() => isOwner && setOpenFollowList("following")}
                  >
                    <div className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                      {currentUser.following?.length || 0}
                    </div>
                    <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">Following</div>
                  </div>
                  <div className="text-center py-2">
                    <div className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                      {totalWorkouts}
                    </div>
                    <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">Workouts</div>
                  </div>
                  <div className="text-center py-2">
                    <div className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                      {totalProgress}
                    </div>
                    <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">Progress</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Height / Weight (visible only to the profile owner) - Centered */}
            {isOwner && (
              <div className="flex justify-center mt-2 pb-2">
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Height</span>
                    <span className="font-medium">{currentHeight ? `${currentHeight} in` : '—'}</span>
                    <span className="ml-2 text-xs text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Private</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Weight</span>
                    <span className="font-medium">{currentWeight ? `${currentWeight} lbs` : '—'}</span>
                    <span className="ml-2 text-xs text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Private</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Fitness Goals */}
            {currentUser.fitnessGoals && currentUser.fitnessGoals.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                  Fitness Goals
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentUser.fitnessGoals.map((goal, index) => (
                    <Badge key={index} variant="outline" className="bg-fit-green/10 text-fit-green">
                      <Target className="h-3 w-3 mr-1" />
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none">
            <TabsTrigger value="posts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Posts</span>
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Workouts</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Progress</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="p-0">
            {postsLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse space-y-0">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="rounded-none border-0 border-b">
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Share your fitness journey to get started
                </p>
                <Button className="bg-fit-green hover:bg-fit-green/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>
            ) : (
              <div className="space-y-0">
                {userPosts.map((post) => (
                  <Card key={post.id} className="rounded-none border-0 border-b">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                          <AvatarImage src={currentUser.avatar || ""} />
                          <AvatarFallback className="bg-fit-green text-white text-xs sm:text-sm">
                            {currentUser.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-1 sm:gap-2 mb-1">
                            <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                              {currentUser.name || "User"}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {post.type}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {format(new Date(post.createdAt), "MMM d")}
                            </span>
                          </div>
                          <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 line-clamp-3">
                            {post.caption}
                          </p>
                          {post.images && post.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {post.images.slice(0, 2).map((image, index) => (
                                <OptimizedImage
                                  key={index}
                                  src={image}
                                  alt={post.caption || ""}
                                  width={320}
                                  height={128}
                                  className="rounded-lg h-32 w-full object-cover"
                                  placeholder="blur"
                                />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-red-500">
                              <Heart className="h-4 w-4" />
                              <span>{post.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="workouts" className="p-0">
            <div className="space-y-0">
              {/* Workout filter tabs */}
              <div className="flex space-x-2 p-4 border-b">
                <Button variant="outline" size="sm" className="bg-fit-green text-white border-fit-green">
                  All Workouts
                </Button>
                <Button variant="outline" size="sm">This Week</Button>
                <Button variant="outline" size="sm">This Month</Button>
              </div>

              {/* Sample workout history */}
              <div className="space-y-0">
                <Card className="rounded-none border-0 border-b">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-fit-green rounded-lg flex items-center justify-center">
                          <Dumbbell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Afternoon Chest & Triceps Workout
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(Date.now() - 86400000), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">45:30</span>
                        </div>
                        <div className="text-xs text-gray-500">Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">380</span>
                        </div>
                        <div className="text-xs text-gray-500">Calories</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Dumbbell className="w-4 h-4 text-green-500" />
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">15/18</span>
                        </div>
                        <div className="text-xs text-gray-500">Sets</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Exercises:</span> Bench Press, Incline Dumbbell Press, Tricep Dips, Close-Grip Push-ups
                    </div>
                  </CardContent>
                </Card>

                {/* Placeholder for when workout is shared to feed */}
                <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 rounded-none border-x-0">
                  <CardContent className="p-6 text-center">
                    <Dumbbell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your completed workouts will appear here
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Complete a workout session to see your history
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="p-0">
            <ProgressInsightsTab userId={userId} isOwner={isOwner} />
          </TabsContent>
        </Tabs>

        {/* Edit Profile Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about yourself..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State or Location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (in)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Height in inches" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (lbs)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Weight in lbs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-fit-green hover:bg-fit-green/90"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}