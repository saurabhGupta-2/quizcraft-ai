'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { apiClient } from '@/lib/api/client'; // Correct path includes 'lib'
import { Card } from '@/components/shared/ui/Card';
import { Button } from '@/components/shared/ui/Button';
import {
  Upload,
  FileText,
  Edit3,
  BookOpen,
  TrendingUp,
  Clock,
  Target,
  Award,
  Folder,
  Plus,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, lessons, setLessons } = useStore();
  const [stats, setStats] = useState({
    totalLessons: 0,
    completedQuizzes: 0,
    averageScore: 0,
    studyTime: 0,
  });
  const [loading, setLoading] = useState(true);

  // Folder state
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      created_at: new Date().toISOString(),
    };

    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setIsCreatingFolder(false);
    toast.success('Folder created');
  };

  const handleDeleteFolder = (folderId, e) => {
    e.stopPropagation();
    setFolders(folders.filter((f) => f.id !== folderId));
    if (currentFolder === folderId) {
      setCurrentFolder(null);
    }
    toast.success('Folder deleted');
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load lessons
      const lessonsResponse = await apiClient.getLessons();
      setLessons(lessonsResponse.data);

      // Load performance stats
      const performanceResponse = await apiClient.getPerformance();
      setStats({
        totalLessons: lessonsResponse.data.length,
        completedQuizzes: performanceResponse.data.total_attempts || 0,
        averageScore: performanceResponse.data.average_score || 0,
        studyTime: performanceResponse.data.total_time || 0,
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Upload Document',
      description: 'Generate from PDFs, DOCX, or text files',
      icon: Upload,
      action: () => router.push('/generate?mode=upload'),
      color: 'bg-blue-500',
    },
    {
      title: 'Enter Topic',
      description: 'Let AI create content from any topic',
      icon: FileText,
      action: () => router.push('/generate?mode=topic'),
      color: 'bg-green-500',
    },
    {
      title: 'Paste Notes',
      description: 'Generate from your existing notes',
      icon: Edit3,
      action: () => router.push('/generate?mode=notes'),
      color: 'bg-purple-500',
    },
    {
      title: 'Chat to PDF',
      description: 'Ask questions about your documents',
      icon: BookOpen,
      action: () => router.push('/chat-to-pdf'),
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.full_name}! 👋
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Ready to continue your learning journey?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Lessons</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalLessons}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quizzes Taken</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.completedQuizzes}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {Math.round(stats.averageScore)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Study Time</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {Math.round(stats.studyTime / 60)}m
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} hover>
                <button
                  onClick={action.action}
                  className="w-full text-left space-y-4"
                >
                  <div className={`p-3 ${action.color} rounded-lg inline-block`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {action.description}
                    </p>
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Folders Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Folders
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCreatingFolder(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Folder
          </Button>
        </div>

        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="mb-4 flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder Name"
              className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              autoFocus
            />
            <Button type="submit" size="sm">Create</Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreatingFolder(false)}
            >
              Cancel
            </Button>
          </form>
        )}

        <div className="flex gap-4 overflow-x-auto pb-4">
          <button
            onClick={() => setCurrentFolder(null)}
            className={`shrink-0 px-4 py-2 rounded-lg border transition-colors ${
              !currentFolder
                ? 'bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
            }`}
          >
            All Lessons
          </button>
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => setCurrentFolder(folder.id)}
              className={`group shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                currentFolder === folder.id
                  ? 'bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>{folder.name}</span>
              <button
                onClick={(e) => handleDeleteFolder(folder.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full text-red-500 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Lessons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentFolder ? 'Folder Lessons' : 'Recent Lessons'}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/lessons')}
          >
            View All
          </Button>
        </div>
        {lessons.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No lessons yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first lesson to get started!
              </p>
              <Button onClick={() => router.push('/generate')}>
                Create Lesson
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.slice(0, 6).map((lesson) => (
              <Card key={lesson.id} hover>
                <button
                  onClick={() => router.push(`/lesson/${lesson.id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(lesson.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {lesson.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {lesson.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {lesson.questions?.length || 0} Questions
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {lesson.flashcards?.length || 0} Flashcards
                    </span>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Motivation Section */}
      <Card className="bg-linear-to-r from-purple-500 to-blue-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Keep up the great work!</h3>
            <p className="text-purple-100">
              You're making excellent progress in your learning journey.
            </p>
          </div>
          <Award className="w-16 h-16 opacity-50" />
        </div>
      </Card>
    </div>
  );
}
