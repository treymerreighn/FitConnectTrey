import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Users, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Link } from "wouter";

export default function Auth() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateRegister = () => {
    const newErrors: Record<string, string> = {};
    
    if (registerFirstName.length < 2 || registerFirstName.length > 50) {
      newErrors.firstName = "First name must be 2-50 characters";
    }
    
    if (registerLastName.length < 2 || registerLastName.length > 50) {
      newErrors.lastName = "Last name must be 2-50 characters";
    }
    
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(registerUsername)) {
      newErrors.username = "Username must be 3-30 chars, alphanumeric & underscore only";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRegisterUsername(val);
    
    if (val.length >= 30) {
      setErrors(prev => ({ ...prev, username: "Character limit reached!" }));
    } else if (/[^a-zA-Z0-9_]/.test(val)) {
      setErrors(prev => ({ ...prev, username: "No special characters!" }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.username;
        return newErrors;
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginUsername || !loginPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      
      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegister()) {
      return;
    }
    
    if (!registerFirstName || !registerLastName || !registerUsername || !registerEmail || !registerPassword || !registerConfirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    if (registerPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: registerFirstName,
          lastName: registerLastName,
          username: registerUsername,
          email: registerEmail,
          password: registerPassword,
          name: `${registerFirstName} ${registerLastName}`
        }),
      });
      
      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: "Password Reset",
      description: "Password reset functionality coming soon.",
    });
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleAppleLogin = () => {
    window.location.href = '/api/auth/apple';
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-700/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row relative z-10">
        {/* Left Side - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-700 via-red-600 to-red-800 p-12 flex-col justify-between relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 border-4 border-white rounded-full" />
            <div className="absolute bottom-40 right-20 w-24 h-24 border-4 border-white rounded-lg rotate-45" />
            <div className="absolute top-1/2 left-1/3 w-16 h-16 border-4 border-white rounded-full" />
          </div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">KRATOS</h1>
            </div>
            <p className="text-white/80 text-lg font-medium">Forge Your Legacy</p>
          </div>
          
          <div className="relative space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Connect with Warriors</h3>
                <p className="text-white/70">Join thousands of fitness warriors on their journey</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Conquer Your Goals</h3>
                <p className="text-white/70">Log workouts, meals, and track your transformation</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">AI-Powered Strength</h3>
                <p className="text-white/70">Get personalized recommendations and analysis</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <p className="text-white/60 text-sm">
              © 2025 KRATOS. All rights reserved.
            </p>
          </div>
        </div>
        
        {/* Right Side - Auth Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-white tracking-tight">KRATOS</h1>
              <p className="text-sm text-gray-400 font-medium">Forge Your Legacy</p>
            </div>
          </div>
          
          <Card className="w-full max-w-md border-0 shadow-2xl bg-zinc-900/90 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-center text-white">
                {activeTab === "login" ? "Welcome Back" : "Get Ready"}
              </CardTitle>
              <CardDescription className="text-center text-gray-400">
                {activeTab === "login" 
                  ? "Sign in to the best fitness app ever" 
                  : "Sign up for the best fitness app ever"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="mb-6">
                  <TabsList className="grid w-full grid-cols-2 rounded-xl bg-zinc-800 p-1 h-auto">
                    <TabsTrigger 
                      value="login" 
                      className="rounded-lg h-8 py-0 text-xs font-medium data-[state=active]:bg-red-600 data-[state=active]:text-white text-zinc-400 transition-all"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register" 
                      className="rounded-lg h-8 py-0 text-xs font-medium data-[state=active]:bg-red-600 data-[state=active]:text-white text-zinc-400 transition-all"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username" className="text-gray-300">Username or Email</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="login-username"
                          type="text"
                          placeholder="Enter your username or email"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-2"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-end !mt-0.5">
                        <button 
                          type="button" 
                          onClick={handleForgotPassword}
                          className="text-[11px] text-red-500 hover:text-red-400 hover:underline transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-600/25"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Sign In
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                {/* Register Tab */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-firstName" className="text-gray-300">First Name</Label>
                        <Input
                          id="register-firstName"
                          type="text"
                          placeholder="First"
                          value={registerFirstName}
                          onChange={(e) => setRegisterFirstName(e.target.value)}
                          className={`bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500 ${errors.firstName ? "border-red-500" : ""}`}
                          required
                        />
                        {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-lastName" className="text-gray-300">Last Name</Label>
                        <Input
                          id="register-lastName"
                          type="text"
                          placeholder="Last"
                          value={registerLastName}
                          onChange={(e) => setRegisterLastName(e.target.value)}
                          className={`bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500 ${errors.lastName ? "border-red-500" : ""}`}
                          required
                        />
                        {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-username" className="text-gray-300">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="register-username"
                          type="text"
                          placeholder="Choose a username"
                          value={registerUsername}
                          onChange={handleUsernameChange}
                          className={`pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500 ${errors.username ? "border-red-500" : ""}`}
                          required
                          maxLength={30}
                        />
                      </div>
                      {errors.username && (
                        <p className="text-xs text-red-500">{errors.username}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-gray-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Enter your email"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-gray-300">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-2"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Must be at least 8 characters with 1 letter and 1 number
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm" className="text-gray-300">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="register-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-2"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-600/25"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating account...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Create Account
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                    
                    <p className="text-xs text-center text-gray-500">
                      By signing up, you agree to our{" "}
                      <Link href="/terms">
                        <a className="text-red-500 hover:text-red-400 hover:underline">Terms of Service</a>
                      </Link>
                      {" "}and{" "}
                      <Link href="/privacy">
                        <a className="text-red-500 hover:text-red-400 hover:underline">Privacy Policy</a>
                      </Link>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
              
              {/* Social Login Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-900 px-2 text-gray-500">or continue with</span>
                </div>
              </div>
              
              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                  onClick={handleAppleLogin}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z"/>
                  </svg>
                  Apple
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
