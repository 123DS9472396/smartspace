import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Eye, EyeOff, Loader2, Mail, Lock, User, Phone, MapPin, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  userType: 'owner' | 'seeker';
  seekerType?: 'farmer' | 'wholesaler' | 'quick_commerce' | 'msme' | 'industrial';
  company?: string;
  location?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, resendVerification, loading } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    userType: 'seeker',
    seekerType: 'farmer',
    company: '',
    location: '',
  });

  const validateLoginForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!loginData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!loginData.password) {
      newErrors.password = 'Password is required';
    } else if (loginData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!registerData.name) newErrors.name = 'Name is required';

    if (!registerData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!registerData.password) {
      newErrors.password = 'Password is required';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!registerData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(registerData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (registerData.userType === 'owner' && !registerData.company) {
      newErrors.company = 'Company name is required for owners';
    }

    if (!registerData.location) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    try {
      const { error, data } = await signIn(loginData.email, loginData.password);

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in",
      });

      // Navigate based on user type
      const userType = data?.user?.user_metadata?.user_type || 'seeker';
      if (userType === 'admin') {
        navigate('/admin');
      } else if (userType === 'owner') {
        navigate('/dashboard');
      } else {
        navigate('/seeker-dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResendVerification = async () => {
    if (!loginData.email) {
      toast({
        title: "Email required",
        description: "Enter your email to resend the verification link.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await resendVerification(loginData.email);
    if (error) {
      toast({
        title: "Resend failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Verification email sent",
      description: "Check your inbox and spam folder.",
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    try {
      const userData: any = {
        name: registerData.name,
        phone: registerData.phone,
        user_type: registerData.userType,
        company: registerData.company || '',
        location: registerData.location || '',
      };

      // Add seeker_type for seekers
      if (registerData.userType === 'seeker' && registerData.seekerType) {
        userData.seeker_type = registerData.seekerType;
      }

      const { error } = await signUp(registerData.email, registerData.password, userData);

      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account",
      });

      setActiveTab('login');
      setLoginData({ email: registerData.email, password: '' });
    } catch (err) {
      console.error('Registration error:', err);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDemoLogin = async (email: string, password: string) => {
    setLoginData({ email, password });

    try {
      const { error, data } = await signIn(email, password);

      if (error) {
        toast({
          title: "Demo login failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Demo login successful!",
        description: "Welcome to SmartSpace",
      });

      // Navigate based on user type from metadata
      const userType = data?.user?.user_metadata?.user_type || 'seeker';
      if (userType === 'admin') {
        navigate('/admin');
      } else if (userType === 'owner') {
        navigate('/dashboard');
      } else {
        navigate('/seeker-dashboard');
      }
    } catch (err) {
      console.error('Demo login error:', err);
      toast({
        title: "Demo login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0c1222 0%, #153366 100%)' }}>
      
      {/* Background pattern layer (Mesh effect) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(at 21% 33%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
            radial-gradient(at 79% 76%, rgba(139, 92, 246, 0.15) 0px, transparent 50%)
          `
        }}
      />

      <div className="w-full max-w-lg z-10 fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-4">
            <Building2 className="h-12 w-12 text-blue-400 pulse" />
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">SmartSpace</span>
          </Link>
          <p className="text-slate-300 text-lg">
            Connect with warehouse spaces across India
          </p>
        </div>

        <Card className="shadow-2xl border border-slate-700/50 backdrop-blur-xl bg-slate-900/90">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-2xl font-bold text-slate-50">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-center text-slate-400">
              {activeTab === 'login'
                ? 'Sign in to your account to continue'
                : 'Join SmartSpace to connect with warehouse spaces'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-800/50">
                <TabsTrigger value="login" className="font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium text-slate-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className={`pl-10 h-11 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && (
                      <Alert variant="destructive" className="py-2 bg-red-950/50 border-red-900">
                        <AlertDescription className="text-sm text-red-300">{errors.email}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium text-slate-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className={`pl-10 pr-10 h-11 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <Alert variant="destructive" className="py-2 bg-red-950/50 border-red-900">
                        <AlertDescription className="text-sm text-red-300">{errors.password}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="remember" className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500" />
                      <Label htmlFor="remember" className="text-sm text-slate-400">Remember me</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                        Forgot password?
                      </Link>
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm text-blue-400 hover:text-blue-300 p-0 h-auto"
                        onClick={handleResendVerification}
                      >
                        Resend verification
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-0">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-sm font-medium text-slate-300">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Enter your full name"
                          value={registerData.name}
                          onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                          className={`pl-10 h-11 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                      </div>
                      {errors.name && (
                        <Alert variant="destructive" className="py-2 bg-red-950/50 border-red-900">
                          <AlertDescription className="text-sm text-red-300">{errors.name}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-sm font-medium text-slate-300">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Enter your email"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          className={`pl-10 h-11 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                      </div>
                      {errors.email && (
                        <Alert variant="destructive" className="py-2 bg-red-950/50 border-red-900">
                          <AlertDescription className="text-sm text-red-300">{errors.email}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-phone" className="text-sm font-medium text-slate-300">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          className={`pl-10 h-11 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                      </div>
                      {errors.phone && (
                        <Alert variant="destructive" className="py-2 bg-red-950/50 border-red-900">
                          <AlertDescription className="text-sm text-red-300">{errors.phone}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-300">Account Type</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${registerData.userType === 'seeker'
                            ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                            : 'border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-600'
                            }`}
                          onClick={() => setRegisterData({ ...registerData, userType: 'seeker' })}
                        >
                          <div className="text-center">
                            <User className="h-6 w-6 mx-auto mb-2" />
                            <div className="font-medium">Space Seeker</div>
                            <div className="text-xs text-slate-500">Looking for warehouse space</div>
                          </div>
                        </div>
                        <div
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${registerData.userType === 'owner'
                            ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                            : 'border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-600'
                            }`}
                          onClick={() => setRegisterData({ ...registerData, userType: 'owner' })}
                        >
                          <div className="text-center">
                            <Building2 className="h-6 w-6 mx-auto mb-2" />
                            <div className="font-medium">Space Owner</div>
                            <div className="text-xs text-slate-500">Offering warehouse space</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {registerData.userType === 'seeker' && (
                      <div className="space-y-2">
                        <Label htmlFor="register-seeker-type" className="text-sm font-medium text-slate-300">
                          Seeker Type *
                        </Label>
                        <select
                          id="register-seeker-type"
                          value={registerData.seekerType || 'farmer'}
                          onChange={(e) => setRegisterData({ ...registerData, seekerType: e.target.value as any })}
                          className="w-full h-11 px-3 py-2 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800/50 text-slate-100"
                        >
                          <option value="farmer">Farmer - Agricultural Storage</option>
                          <option value="wholesaler">Wholesaler - Bulk Distribution</option>
                          <option value="quick_commerce">Quick Commerce - Fast Delivery</option>
                          <option value="msme">MSME - Small Business</option>
                          <option value="industrial">Industrial - Manufacturing</option>
                        </select>
                        <p className="text-xs text-slate-500">Help us personalize your experience</p>
                      </div>
                    )}

                    {registerData.userType === 'owner' && (
                      <div className="space-y-2">
                        <Label htmlFor="register-company" className="text-sm font-medium text-slate-300">
                          Company Name
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                          <Input
                            id="register-company"
                            type="text"
                            placeholder="Enter your company name"
                            value={registerData.company || ''}
                            onChange={(e) => setRegisterData({ ...registerData, company: e.target.value })}
                            className={`pl-10 h-11 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 ${errors.company ? 'border-red-500 focus:ring-red-500' : ''}`}
                          />
                        </div>
                        {errors.company && (
                          <Alert variant="destructive" className="py-2 bg-red-950/50 border-red-900">
                            <AlertDescription className="text-sm text-red-300">{errors.company}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="register-location" className="text-sm font-medium text-slate-300">
                        Location
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                        <Input
                          id="register-location"
                          type="text"
                          placeholder="Enter your city/state"
                          value={registerData.location || ''}
                          onChange={(e) => setRegisterData({ ...registerData, location: e.target.value })}
                          className={`pl-10 h-11 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 ${errors.location ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                      </div>
                      {errors.location && (
                        <Alert variant="destructive" className="py-2 bg-red-950/50 border-red-900">
                          <AlertDescription className="text-sm text-red-300">{errors.location}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="text-sm font-medium text-slate-300">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                          <Input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create password"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            className={`pl-10 pr-10 h-11 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>

                        {/* Password Strength Meter */}
                        <PasswordStrengthMeter password={registerData.password} />

                        {errors.password && (
                          <Alert variant="destructive" className="py-2 bg-red-950/50 border-red-900">
                            <AlertDescription className="text-sm text-red-300">{errors.password}</AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-confirm-password" className="text-sm font-medium text-slate-300">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                          <Input
                            id="register-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                            className={`pl-10 pr-10 h-11 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <Alert variant="destructive" className="py-2 bg-red-950/50 border-red-900">
                            <AlertDescription className="text-sm text-red-300">{errors.confirmPassword}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 pt-4">
                    <input type="checkbox" id="terms" className="mt-0.5 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500" required />
                    <Label htmlFor="terms" className="text-sm text-slate-400 leading-relaxed">
                      I agree to the{' '}
                      <Link to="/terms" className="text-blue-400 hover:text-blue-300">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-blue-400 hover:text-blue-300">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                {activeTab === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  {activeTab === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-4">
                  Quick Demo Access
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => handleDemoLogin('demo.seeker@smartspace.com', 'demo123')}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Seeker Demo
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 bg-green-600 hover:bg-green-700 border-green-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => handleDemoLogin('demo.owner@smartspace.com', 'demo123')}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Owner Demo
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 bg-purple-600 hover:bg-purple-700 border-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => handleDemoLogin('demo.admin@smartspace.com', 'demo123')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Demo
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Secure • Trusted • Fast</p>
          <div className="flex justify-center items-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
