import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Loader2,
  User,
  Mail,
  Lock,
  ArrowRight,
  Brain,
  BookOpen,
  MessageSquare,
  Volume2,
  Check,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { createUser, loginUser, signInWithGoogle } from '../lib/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    label: 'Contains uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'Contains lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: 'Contains number',
    test: (password) => /[0-9]/.test(password),
  },
];

export default function AuthForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPasswordChecker, setShowPasswordChecker] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    if (isSignUp) {
      const allRequirementsMet = passwordRequirements.every((req) =>
        req.test(formData.password)
      );
      if (!allRequirementsMet) {
        setError('Please meet all password requirements');
        return;
      }
  
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }
  
    setIsLoading(true);
  
    try {
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }
  
      if (isSignUp) {
        const result = await createUser({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        
        if (result.success) {
          // Redirect to email verification page instead of logging in
          navigate('/verify-email');
        } else {
          setError(result.error || 'Failed to create account');
        }
      } else {
        const result = await loginUser(formData.email, formData.password);
        if (result.success && result.user) {
          // Remove the email verification check for login
          localStorage.setItem('userId', result.user.id);
          localStorage.setItem('userName', result.user.name);
          navigate('/dashboard');
        } else {
          setError(result.error || 'Invalid email or password');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordStrengthChecker = () => (
    <AnimatePresence>
      {showPasswordChecker && isSignUp && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 z-50"
        >
          <div className="relative">
            <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Password Requirements
            </h4>
            <div className="space-y-2">
              {passwordRequirements.map((req, index) => {
                const isMet = req.test(formData.password);
                return (
                  <motion.div
                    key={req.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`p-0.5 rounded-full ${
                        isMet ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      {isMet ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        isMet ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {req.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-400 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-indigo-400 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute inset-0 bg-grid-indigo-500/[0.025] dark:bg-grid-indigo-400/[0.05] bg-[size:20px_20px]"></div>
      </div>

      <div className="w-full max-w-5xl mx-4 relative">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row relative min-h-[600px]">
            <AnimatePresence mode="wait">
              {!isSignUp ? (
                <>
                  {/* Login Form Panel */}
                  <motion.div
                    key="login-form"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.5 }}
                    className="w-full md:w-1/2 p-8 md:p-12"
                  >
                    {/* Login form content */}
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Welcome Back
                      </h2>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Sign in to continue your learning journey
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Google Sign-in Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          setIsLoading(true);
                          setError('');
                          try {
                            const result = await signInWithGoogle();
                            if (result.success && result.user) {
                              localStorage.setItem('userId', result.user.id);
                              localStorage.setItem('userName', result.user.name || '');
                              navigate('/dashboard');
                            } else {
                              setError(result.error || 'Failed to sign in with Google');
                            }
                          } catch (err) {
                            console.error('Google sign in error:', err);
                            setError('Failed to sign in with Google');
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 p-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <img 
                          src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
                          alt="Google"
                          className="w-5 h-5"
                        />
                        Sign in with Google
                      </button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm -mt-2">
                          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with email</span>
                        </div>
                      </div>

                      <div className="relative group mt-6">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          required
                          placeholder="Email address"
                          className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>

                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={passwordVisible ? 'text' : 'password'}
                          required
                          placeholder="Password"
                          className="w-full pl-10 pr-10 py-2.5 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      <div className="flex justify-end">
                        <Link
                          to="/forgot-password"
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
                        >
                          {error}
                        </motion.div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white p-3 text-sm font-semibold hover:from-indigo-500 hover:to-purple-500 dark:hover:from-indigo-400 dark:hover:to-purple-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300"
                      >
                        <span className="relative flex items-center justify-center gap-2">
                          {isLoading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                          ) : (
                            <>
                              Sign in
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </span>
                      </button>
                    </form>
                  </motion.div>

                  {/* Login Info Panel */}
                  <motion.div
                    key="login-info"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                    className="w-full md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-800 dark:to-purple-900 p-8 md:p-12 text-white relative overflow-hidden"
                  >
                    {/* Login info content */}
                    <div className="absolute inset-0">
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage:
                            "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')",
                        }}
                      ></div>
                    </div>

                    <div className="relative z-10">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="text-center mb-12"
                      >
                        <Brain className="w-20 h-20 mx-auto mb-6 animate-float" />
                        <h2 className="text-3xl font-bold mb-4">New to EduCare AI?</h2>
                        <p className="text-indigo-100 mb-8">
                          Join us and experience the future of learning
                        </p>
                        <button
                          onClick={() => setIsSignUp(true)}
                          className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors transform hover:scale-105 duration:200"
                        >
                          Create Account
                        </button>
                      </motion.div>

                      {/* Features section */}
                      <div className="space-y-8">
                        <motion.div
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-start gap-4"
                        >
                          <BookOpen className="w-6 h-6 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold mb-1">Smart Document Analysis</h3>
                            <p className="text-indigo-100 text-sm">
                              Upload your study materials and let our AI create comprehensive
                              summaries
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="flex items-start gap-4"
                        >
                          <MessageSquare className="w-6 h-6 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold mb-1">Interactive Learning</h3>
                            <p className="text-indigo-100 text-sm">
                              Chat with AI to get instant answers and explanations
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="flex items-start gap-4"
                        >
                          <Volume2 className="w-6 h-6 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold mb-1">Audio Learning</h3>
                            <p className="text-indigo-100 text-sm">
                              Convert your study materials into engaging audio content
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* Signup Info Panel */}
                  <motion.div
                    key="signup-info"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.5 }}
                    className="w-full md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-800 dark:to-purple-900 p-8 md:p-12 text-white relative overflow-hidden"
                  >
                    <div className="absolute inset-0">
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage:
                            "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')",
                        }}
                      ></div>
                    </div>

                    <div className="relative z-10">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="text-center mb-12"
                      >
                        <Brain className="w-20 h-20 mx-auto mb-6 animate-float" />
                        <h2 className="text-3xl font-bold mb-4">Already a Member?</h2>
                        <p className="text-indigo-100 mb-8">
                          Sign in to continue your learning journey
                        </p>
                        <button
                          onClick={() => setIsSignUp(false)}
                          className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors transform hover:scale-105 duration:200"
                        >
                          Sign In
                        </button>
                      </motion.div>

                      <div className="space-y-8">
                        <motion.div
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-start gap-4"
                        >
                          <Brain className="w-6 h-6 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold mb-1">AI-Powered Learning</h3>
                            <p className="text-indigo-100 text-sm">
                              Experience the future of education with our advanced AI technology
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="flex items-start gap-4"
                        >
                          <BookOpen className="w-6 h-6 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold mb-1">Personalized Study Materials</h3>
                            <p className="text-indigo-100 text-sm">
                              Get customized summaries and study guides tailored to your needs
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="flex items-start gap-4"
                        >
                          <MessageSquare className="w-6 h-6 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold mb-1">24/7 Learning Support</h3>
                            <p className="text-indigo-100 text-sm">
                              Get instant help and answers whenever you need them
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Signup Form */}
                  <motion.div
                    key="signup-form"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                    className="w-full md:w-1/2 p-8 md:p-12"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Create Account
                      </h2>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Join us to unlock the full potential of AI-powered learning
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Google Sign-up Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          setIsLoading(true);
                          setError('');
                          try {
                            const result = await signInWithGoogle();
                            if (result.success && result.user) {
                              localStorage.setItem('userId', result.user.id);
                              localStorage.setItem('userName', result.user.name || '');
                              navigate('/dashboard');
                            } else {
                              setError(result.error || 'Failed to sign up with Google');
                            }
                          } catch (err) {
                            console.error('Google sign in error:', err);
                            setError('Failed to sign up with Google');
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 p-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <img 
                          src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
                          alt="Google"
                          className="w-5 h-5"
                        />
                        Sign up with Google
                      </button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm -mt-2">
                          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with email</span>
                        </div>
                      </div>

                      <div className="relative group mt-6">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          required
                          placeholder="Full name"
                          className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          required
                          placeholder="Email address"
                          className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>

                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={passwordVisible ? 'text' : 'password'}
                          required
                          placeholder="Password"
                          className="w-full pl-10 pr-10 py-2.5 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          onFocus={() => setShowPasswordChecker(true)}
                          onBlur={() => setShowPasswordChecker(false)}
                        />
                        <button
                          type="button"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                        <PasswordStrengthChecker />
                      </div>

                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={confirmPasswordVisible ? 'text' : 'password'}
                          required
                          placeholder="Confirm password"
                          className={`w-full pl-10 pr-10 py-2.5 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all ${
                            formData.confirmPassword &&
                            formData.password !== formData.confirmPassword
                              ? 'border-red-300 dark:border-red-700'
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {confirmPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                        {formData.confirmPassword &&
                          formData.password !== formData.confirmPassword && (
                            <p className="absolute -bottom-5 left-0 text-xs text-red-500 dark:text-red-400">
                              Passwords do not match
                            </p>
                          )}
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
                        >
                          {error}
                        </motion.div>
                      )}

                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        By registering, you agree to our{' '}
                        <Link to="/terms" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                          Privacy Policy
                        </Link>
                      </p>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white p-3 text-sm font-semibold hover:from-indigo-500 hover:to-purple-500 dark:hover:from-indigo-400 dark:hover:to-purple-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300"
                      >
                        <span className="relative flex items-center justify-center gap-2">
                          {isLoading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                          ) : (
                            <>
                              Create Account
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </span>
                      </button>

                      <div className="text-center md:hidden">
                        <button
                          type="button"
                          onClick={() => setIsSignUp(false)}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          Already have an account? Sign in
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}