import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import financialBg from "@assets/generated_images/Financial_dashboard_background_94fa23b9.png";
import dynamicBg from "@assets/generated_images/Dynamic_financial_dashboard_d084f2c3.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    username: "",
  });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      window.location.href = "/dashboard";
    }
  }, [user, isLoading]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Form validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateLoginForm = () => {
    const errors: Record<string, string> = {};
    
    if (!loginForm.email) {
      errors.email = "Email is required";
    } else if (!validateEmail(loginForm.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!loginForm.password) {
      errors.password = "Password is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = () => {
    const errors: Record<string, string> = {};
    
    if (!registerForm.firstName) {
      errors.firstName = "First name is required";
    }
    
    if (!registerForm.lastName) {
      errors.lastName = "Last name is required";
    }
    
    if (!registerForm.email) {
      errors.email = "Email is required";
    } else if (!validateEmail(registerForm.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!registerForm.password) {
      errors.password = "Password is required";
    } else if (!validatePassword(registerForm.password)) {
      errors.password = "Password must be at least 6 characters long";
    }
    
    if (!registerForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) {
      return;
    }
    loginMutation.mutate({ email: loginForm.email, password: loginForm.password });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegisterForm()) {
      return;
    }
    registerMutation.mutate({
      email: registerForm.email,
      password: registerForm.password,
      firstName: registerForm.firstName,
      lastName: registerForm.lastName,
      username: registerForm.username || registerForm.firstName.toLowerCase(),
    });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    if (!validateEmail(forgotPasswordEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate password reset (in real app, this would call an API)
    toast({
      title: "Password Reset Sent",
      description: "If an account with that email exists, you'll receive password reset instructions.",
    });
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome to SendWise</h1>
            <p className="text-muted-foreground mt-2">
              Your smart financial companion for household expense management
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginForm.email}
                        onChange={(e) => {
                          setLoginForm({ ...loginForm, email: e.target.value });
                          if (formErrors.email) {
                            setFormErrors({ ...formErrors, email: "" });
                          }
                        }}
                        data-testid="input-login-email"
                        className={formErrors.email ? "border-red-500" : ""}
                      />
                      {formErrors.email && (
                        <p className="text-sm text-red-500">{formErrors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginForm.password}
                          onChange={(e) => {
                            setLoginForm({ ...loginForm, password: e.target.value });
                            if (formErrors.password) {
                              setFormErrors({ ...formErrors, password: "" });
                            }
                          }}
                          data-testid="input-login-password"
                          className={formErrors.password ? "border-red-500 pr-10" : "pr-10"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {formErrors.password && (
                        <p className="text-sm text-red-500">{formErrors.password}</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    data-testid="button-google-login"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  {/* Forgot Password Modal */}
                  {showForgotPassword && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Reset Password</h3>
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                          <div>
                            <Label htmlFor="forgot-email">Email Address</Label>
                            <Input
                              id="forgot-email"
                              type="email"
                              placeholder="Enter your email"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button type="submit" className="flex-1">
                              Send Reset Link
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowForgotPassword(false);
                                setForgotPasswordEmail("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Sign up to start managing your household finances
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-firstName">First Name</Label>
                        <Input
                          id="register-firstName"
                          placeholder="First name"
                          value={registerForm.firstName}
                          onChange={(e) =>
                            setRegisterForm({ ...registerForm, firstName: e.target.value })
                          }
                          data-testid="input-register-firstName"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-lastName">Last Name</Label>
                        <Input
                          id="register-lastName"
                          placeholder="Last name"
                          value={registerForm.lastName}
                          onChange={(e) =>
                            setRegisterForm({ ...registerForm, lastName: e.target.value })
                          }
                          data-testid="input-register-lastName"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username (Optional)</Label>
                      <Input
                        id="register-username"
                        placeholder="Choose a username"
                        value={registerForm.username}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, username: e.target.value })
                        }
                        data-testid="input-register-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email *</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={registerForm.email}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, email: e.target.value })
                        }
                        data-testid="input-register-email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password *</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password (min 6 characters)"
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, password: e.target.value })
                        }
                        data-testid="input-register-password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirmPassword">Confirm Password *</Label>
                      <Input
                        id="register-confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerForm.confirmPassword}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                        }
                        data-testid="input-register-confirmPassword"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    data-testid="button-google-register"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign up with Google
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Dynamic Hero section */}
      <div 
        className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(168, 85, 247, 0.2)), url(${dynamicBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              {i % 3 === 0 && <div className="w-4 h-4 bg-blue-400 rounded-full blur-sm"></div>}
              {i % 3 === 1 && <div className="w-6 h-6 bg-purple-400 rounded-full blur-sm"></div>}
              {i % 3 === 2 && <div className="w-3 h-3 bg-cyan-400 rounded-full blur-sm"></div>}
            </div>
          ))}
        </div>
        
        {/* Mouse parallax effect */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.3), transparent 70%)'
          }}
        ></div>
        
        {/* Gradient overlay with pulse animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/20 animate-pulse"></div>
        
        <div className="max-w-md text-center relative z-10">
          {/* Animated logo with glow effect */}
          <div className="mx-auto mb-8 w-32 h-32 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
            <div className="absolute inset-2 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full animate-pulse flex items-center justify-center shadow-2xl">
              <svg className="w-16 h-16 text-white animate-bounce" viewBox="0 0 24 24" fill="currentColor" style={{ animationDuration: '2s' }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            {/* Glow rings */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30 animate-ping"></div>
            <div className="absolute -inset-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full opacity-20 animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-6 animate-pulse drop-shadow-lg">
            Smart Financial Management
          </h2>
          <p className="text-lg text-white dark:text-gray-100 leading-relaxed mb-8 drop-shadow-md font-medium">
            Track expenses, manage budgets, collaborate with family members, and achieve your financial goals with our intelligent household finance platform.
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3 transform hover:scale-105 transition-all duration-300 hover:bg-white/10 rounded-lg p-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white dark:text-gray-100 font-medium drop-shadow-md">Multi-wallet support for different purposes</span>
            </div>
            <div className="flex items-center space-x-3 transform hover:scale-105 transition-all duration-300 hover:bg-white/10 rounded-lg p-2" style={{ animationDelay: '0.2s' }}>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse shadow-lg" style={{ animationDelay: '0.5s' }}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white dark:text-gray-100 font-medium drop-shadow-md">Team collaboration with role-based access</span>
            </div>
            <div className="flex items-center space-x-3 transform hover:scale-105 transition-all duration-300 hover:bg-white/10 rounded-lg p-2" style={{ animationDelay: '0.4s' }}>
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse shadow-lg" style={{ animationDelay: '1s' }}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white dark:text-gray-100 font-medium drop-shadow-md">Advanced budgeting and financial analytics</span>
            </div>
          </div>
          
          {/* Floating currency symbols */}
          <div className="absolute top-10 right-10 text-4xl opacity-20 animate-bounce text-green-400">💰</div>
          <div className="absolute bottom-20 left-10 text-3xl opacity-20 animate-bounce text-blue-400" style={{ animationDelay: '1s' }}>📊</div>
          <div className="absolute top-1/2 right-20 text-2xl opacity-20 animate-bounce text-purple-400" style={{ animationDelay: '2s' }}>💳</div>
        </div>
      </div>
    </div>
  );
}