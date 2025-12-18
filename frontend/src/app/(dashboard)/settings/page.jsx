'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/shared/ui/Button';
import { Card } from '@/components/shared/ui/Card';
import {
  User,
  Bell,
  Lock,
  Moon,
  Sun,
  LogOut,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(false);

  // Mock settings state (replace with actual store/API values later)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    studyReminders: false,
  });
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

  const handleSignOut = async () => {
    try {
      // Clear local storage and state
      localStorage.removeItem('quizcraft_token');
      setUser(null);
      
      // Redirect to login
      router.push('/login');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be lost.')) {
      return;
    }

    try {
      setLoading(true);
      // Assuming there's an endpoint for account deletion, or implement it later
      // await apiClient.deleteAccount(); 
      toast.error('Account deletion is not yet implemented.');
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account preferences and settings
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <User className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Profile Information
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Update your personal details
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={user?.full_name || ''}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Notifications
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage how you receive updates
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Email Notifications
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive updates about your progress
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) =>
                  setNotifications({ ...notifications, email: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Study Reminders
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get reminded to review your flashcards
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.studyReminders}
                onChange={(e) =>
                  setNotifications({ ...notifications, studyReminders: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Lock className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Security
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your account security
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button variant="outline" className="w-full sm:w-auto">
            Change Password
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
            onClick={handleSignOut}
            icon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            loading={loading}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
