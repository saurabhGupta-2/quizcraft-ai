'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/shared/ui/Card';
import { Button } from '@/components/shared/ui/Button';
import { BookOpen, Search, Plus } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

export default function LessonsPage() {
  const router = useRouter();
  const { lessons, setLessons } = useStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const response = await apiClient.getLessons();
      setLessons(response.data);
    } catch (error) {
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = lessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lesson.description && lesson.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Lessons
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and study your generated lessons
          </p>
        </div>
        <Button onClick={() => router.push('/generate')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Lesson
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search lessons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
        />
      </div>

      {filteredLessons.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No lessons found' : 'No lessons yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Create your first lesson to get started!'}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push('/generate')}>
                Create Lesson
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
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
                    {lesson.questions?.length || lesson.question_count || 0} Questions
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {lesson.flashcards?.length || lesson.flashcard_count || 0} Flashcards
                  </span>
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
