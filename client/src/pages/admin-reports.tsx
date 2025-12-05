import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Flag, Trash2, CheckCircle, XCircle, AlertTriangle, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { CURRENT_USER_ID } from "@/lib/constants";
import type { Post, User as UserType, Report } from "@shared/schema";

export default function AdminReports() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(false);

  // Check if current user is admin
  const { data: currentUser, isLoading: userLoading } = useQuery<UserType>({
    queryKey: [`/api/users/${CURRENT_USER_ID}`],
  });

  // Fetch all reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    enabled: !!currentUser?.isAdmin,
  });

  // Fetch all users for reporter info
  const { data: allUsers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });
  const usersMap = Object.fromEntries((allUsers || []).map(u => [u.id, u]));

  // Fetch all posts for reported post info
  const { data: allPosts = [] } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });
  const postsMap = Object.fromEntries((allPosts || []).map(p => [p.id, p]));

  // Dismiss report mutation - dismisses and removes from queue
  const dismissReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      // Delete the report to remove it from the queue
      return apiRequest("DELETE", `/api/reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Report dismissed", description: "The report has been dismissed and removed from the queue." });
      setSelectedReport(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to dismiss report.", variant: "destructive" });
    },
  });

  // Delete report mutation (after taking action)
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return apiRequest("DELETE", `/api/reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Report removed", description: "The report has been removed from the queue." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove report.", variant: "destructive" });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Post deleted", description: "The reported post has been deleted." });
      setShowDeletePostDialog(false);
      // Also remove the report
      if (selectedReport) {
        deleteReportMutation.mutate(selectedReport.id);
      }
      setSelectedReport(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" });
    },
  });

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "reviewed":
        return <Badge className="bg-blue-500">Reviewed</Badge>;
      case "dismissed":
        return <Badge className="bg-gray-500">Dismissed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-4">You don't have permission to view this page.</p>
            <Button onClick={() => setLocation("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingReports = reports.filter(r => r.status === "pending");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/profile")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reported Posts</h1>
            <p className="text-sm text-gray-500">{pendingReports.length} pending reports</p>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {reportsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Flag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports</h3>
              <p className="text-gray-500">All clear! There are no reported posts to review.</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => {
            const reportedPost = postsMap[report.postId];
            const reporter = usersMap[report.reporterId];
            const postAuthor = reportedPost ? usersMap[reportedPost.userId] : null;

            return (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Flag className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{report.reason}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(report.createdAt)}</span>
                          <span>•</span>
                          <span>Reported by {reporter?.name || reporter?.username || "Unknown"}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Reported Post Preview */}
                  {reportedPost ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{postAuthor?.name || "Unknown User"}</span>
                        <Badge variant="outline" className="text-xs">{reportedPost.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {reportedPost.caption}
                      </p>
                      {reportedPost.images && reportedPost.images.length > 0 && (
                        <div className="mt-2">
                          <img 
                            src={reportedPost.images[0]} 
                            alt="Post content" 
                            className="h-20 w-20 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 text-center text-gray-500">
                      Post has been deleted or not found
                    </div>
                  )}

                  {/* Actions */}
                  {report.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => dismissReportMutation.mutate(report.id)}
                        disabled={dismissReportMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Dismiss Report
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowDeletePostDialog(true);
                        }}
                        disabled={!reportedPost}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Post
                      </Button>
                    </div>
                  )}
                  {report.status !== "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteReportMutation.mutate(report.id)}
                        disabled={deleteReportMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Remove from Queue
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Post Confirmation Dialog */}
      <Dialog open={showDeletePostDialog} onOpenChange={setShowDeletePostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reported Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone and will also notify the post author.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeletePostDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedReport) {
                  deletePostMutation.mutate(selectedReport.postId);
                }
              }}
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? "Deleting..." : "Delete Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
