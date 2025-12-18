'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/supabase/client'; // Assuming this helper exists
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Corrected handleSubmit signature for JavaScript
  const handleSubmit = async (e) => { // Removed React.FormEvent type
    e.preventDefault();
    setLoading(true);
    try {
      // Sign in using the Supabase helper
      const { data, error } = await signIn(email, password);

      if (error) throw error; // Throw Supabase error if login fails

      if (data.user) {
        toast.success('Login successful! Checking profile...');

        // If Supabase login is successful, get the profile from YOUR backend
        // to check onboarding status
        const userProfile = await apiClient.getCurrentUser(); // Uses token automatically

        if (userProfile.data && userProfile.data.is_onboarded) {
          router.push('/dashboard'); // Go to dashboard if onboarded
        } else {
          router.push('/onboarding'); // Go to onboarding if not yet onboarded
        }
      } else {
         // Should not happen if signIn doesn't throw, but good to handle
         throw new Error("Login succeeded but no user data received.");
      }
    } catch (error) { // Removed type 'any'
      console.error("Login error:", error);
      // Try to get a more specific error message
      const message = error.response?.data?.detail || error.message || 'Login failed. Please check your credentials.';
      toast.error(String(message)); // Ensure message is a string
    } finally {
      setLoading(false);
    }
  };

  // The rest of the return (...) JSX remains exactly the same as you provided
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            QuizCraft AI
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Login to continue learning
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Sign In
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password" // Ensure this route exists or remove
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link
            href="/signup"
            className="block w-full text-center border border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium py-3 rounded-lg transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}