import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Users, Target, Crown } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-fit-green/10 to-fit-blue/10 dark:from-fit-green/5 dark:to-fit-blue/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-2">
            <Dumbbell className="w-8 h-8 text-fit-green" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FitConnect</h1>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-fit-green hover:bg-fit-green/90"
          >
            Sign In
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Transform Your
            <span className="text-fit-green"> Fitness Journey</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect with fitness enthusiasts, share workouts, track progress, and achieve your goals with the power of community.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-fit-green hover:bg-fit-green/90 text-lg px-8 py-3"
          >
            Get Started Free
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-fit-green mx-auto mb-4" />
              <CardTitle>Social Fitness</CardTitle>
              <CardDescription>
                Connect with like-minded fitness enthusiasts and share your journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Follow friends and trainers</li>
                <li>• Share workout achievements</li>
                <li>• Get motivation from community</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Target className="w-12 h-12 text-fit-green mx-auto mb-4" />
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                Monitor your fitness journey with detailed analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Photo progress tracking</li>
                <li>• AI-powered insights</li>
                <li>• Performance analytics</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Crown className="w-12 h-12 text-fit-green mx-auto mb-4" />
              <CardTitle>Expert Guidance</CardTitle>
              <CardDescription>
                Connect with certified trainers and nutritionists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Verified professionals</li>
                <li>• Personalized coaching</li>
                <li>• Expert meal plans</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Your Fitness Journey?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Join thousands of users who are already transforming their lives with FitConnect
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-fit-green hover:bg-fit-green/90 text-lg px-8 py-3"
          >
            Sign In with Replit
          </Button>
        </div>
      </div>
    </div>
  );
}