import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Settings, Camera, Edit3, MapPin, Calendar, Trophy, Users, Heart, MessageCircle, Share2, MoreHorizontal, Plus, Dumbbell, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { CURRENT_USER_ID } from "@/lib/constants";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/imageUpload";
import type { User as UserType, Post } from "@shared/schema";

const editProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().max(160, "Bio must be under 160 characters"),
  location: z.string().optional(),
  fitnessGoals: z.array(z.string()).default([]),
});

type EditProfileData = z.infer<typeof editProfileSchema>;

export default function Profile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  // Fetch current user data
  const { data: currentUser, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ["/api/users", CURRENT_USER_ID],
    queryFn: () => api.getUserById(CURRENT_USER_ID),
  });

  // Fetch user's posts
  const { data: userPosts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", "user", CURRENT_USER_ID],
    queryFn: () => api.getPostsByUserId(CURRENT_USER_ID),
  });

  // Fetch user's progress entries for stats
  const { data: progressEntries = [] } = useQuery({
    queryKey: ["/api/progress", CURRENT_USER_ID],
    queryFn: () => api.getProgressEntries(CURRENT_USER_ID),
  });

  const form = useForm<EditProfileData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: currentUser?.name || "",
      bio: currentUser?.bio || "",
      location: currentUser?.location || "",
      fitnessGoals: currentUser?.fitnessGoals || [],
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UserType> }) => {
      return api.updateUser(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", CURRENT_USER_ID] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: EditProfileData) => {
      return api.updateUser(CURRENT_USER_ID, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", CURRENT_USER_ID] });
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
          id: currentUser.id, 
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

  const onSubmit = (data: EditProfileData) => {
    updateProfileMutation.mutate(data);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-24 h-24 md:w-32 md:h-32">
                  <AvatarImage src={currentUser.avatar || ""} alt={currentUser.name || ""} />
                  <AvatarFallback className="text-2xl bg-fit-green text-white">
                    {currentUser.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-fit-green hover:bg-fit-green/90 cursor-pointer flex items-center justify-center">
                  <Camera className="h-4 w-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentUser.name || "User"}
                      </h1>
                      {currentUser.isVerified && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <Trophy className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      @{currentUser.username}
                    </p>
                    {currentUser.bio && (
                      <p className="text-gray-700 dark:text-gray-300 mb-3 max-w-md">
                        {currentUser.bio}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      {currentUser.bio && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{currentUser.bio}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {joinDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-4 md:mt-0">
                    <Button
                      onClick={() => setIsEditModalOpen(true)}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </Button>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex space-x-6 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentUser.followers?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentUser.following?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {totalWorkouts}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Workouts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {totalProgress}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Progress</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fitness Goals */}
            {currentUser.fitnessGoals && currentUser.fitnessGoals.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>Posts</span>
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex items-center space-x-2">
              <Dumbbell className="h-4 w-4" />
              <span>Workouts</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Progress</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {postsLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
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
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={currentUser.avatar || ""} />
                          <AvatarFallback className="bg-fit-green text-white text-sm">
                            {currentUser.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {currentUser.name || "User"}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {post.type}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {format(new Date(post.createdAt), "MMM d")}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-3">
                            {post.caption}
                          </p>
                          {post.images && post.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {post.images.slice(0, 2).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt=""
                                  className="rounded-lg h-32 w-full object-cover"
                                />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-red-500">
                              <Heart className="h-4 w-4" />
                              <span>{post.likes}</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-blue-500">
                              <MessageCircle className="h-4 w-4" />
                              <span>{post.comments}</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-green-500">
                              <Share2 className="h-4 w-4" />
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

          <TabsContent value="workouts" className="space-y-4">
            <div className="text-center py-12">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Workout history coming soon
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                View and manage all your workout posts
              </p>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Progress insights coming soon
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Track your fitness journey over time
              </p>
            </div>
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
                        <Input placeholder="City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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