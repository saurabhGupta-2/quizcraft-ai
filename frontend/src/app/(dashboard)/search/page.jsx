'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/shared/ui/Card';
import { BookOpen, Search as SearchIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

export default function SearchPage() {
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Search
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Find your lessons and study materials
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-2xl">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
          autoFocus
        />
      </div>

      {/* Results */}
      {searchQuery && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {filteredLessons.length} Results Found
          </h2>
          
          {filteredLessons.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No matches found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or create a new lesson.
                </p>
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
      )}

      {!searchQuery && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Start typing to search your lessons
        </div>
      )}
    </div>
  );
}
