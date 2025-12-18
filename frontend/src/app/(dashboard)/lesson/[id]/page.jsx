'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useStore } from '@/store';
import { Card } from '@/components/shared/ui/Card';
import { Button } from '@/components/shared/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Play,
  CreditCard,
  RefreshCw,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { setCurrentLesson } = useStore();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showNotes, setShowNotes] = useState(true);

  useEffect(() => {
    if (params.id) {
        loadLesson();
    }
  }, [params.id]);

  const loadLesson = async () => {
    try {
      const response = await apiClient.getLesson(params.id);
      setLesson(response.data);
      setCurrentLesson(response.data);
    } catch (error) {
      toast.error('Failed to load lesson');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteLesson(params.id);
      toast.success('Lesson deleted successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!lesson) {
    return null;
  }

  const studyModes = [
    {
      title: 'Play Quiz',
      description: 'Test your knowledge with interactive questions',
      icon: Play,
      color: 'bg-blue-500',
      action: () => router.push(`/lesson/${lesson.id}/quiz`),
    },
    {
      title: 'Study Flashcards',
      description: 'Review concepts with flashcards',
      icon: CreditCard,
      color: 'bg-green-500',
      action: () => router.push(`/lesson/${lesson.id}/flashcards`),
    },
    {
      title: 'Spaced Repetition',
      description: 'Optimize learning with smart reviews',
      icon: RefreshCw,
      color: 'bg-purple-500',
      action: () => router.push(`/lesson/${lesson.id}/spaced-repetition`),
    },
    {
      title: 'Chat to Lesson',
      description: 'Ask questions about your lesson',
      icon: MessageSquare,
      color: 'bg-orange-500',
      action: () => router.push(`/lesson/${lesson.id}/chat`),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {lesson.title}
          </h1>
          {lesson.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {lesson.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{lesson.questions?.length || 0} Questions</span>
            <span>•</span>
            <span>{lesson.flashcards?.length || 0} Flashcards</span>
            <span>•</span>
            <span>Created {new Date(lesson.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          icon={<Trash2 className="w-4 h-4" />}
        >
          Delete Lesson
        </Button>
      </div>

      {/* Study Modes */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Study Modes
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {studyModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card key={mode.title} hover>
                <button
                  onClick={mode.action}
                  className="w-full text-left space-y-3"
                >
                  <div className={`p-3 ${mode.color} rounded-lg inline-block`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {mode.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {mode.description}
                    </p>
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Study Notes */}
      <Card>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="w-full flex items-center justify-between"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Study Notes
          </h2>
          {showNotes ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {showNotes && lesson.study_notes && (
          <div className="mt-4 prose dark:prose-invert max-w-none">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg whitespace-pre-wrap text-gray-900 dark:text-white">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {(() => {
                  const content = lesson.study_notes.trim();
                  // Try to parse as JSON if it looks like a JSON block or object
                  if (content.startsWith('```json') || content.startsWith('{') || content.startsWith('[')) {
                    try {
                      const cleanContent = content.replace(/```json\n?|```/g, '');
                      const parsed = JSON.parse(cleanContent);
                      
                      // Helper to format JSON object to markdown
                      const formatJsonToMarkdown = (data) => {
                        if (Array.isArray(data)) {
                          return data.map(item => `- ${item}`).join('\n');
                        }
                        if (typeof data === 'object' && data !== null) {
                          return Object.entries(data).map(([key, value]) => {
                            const formattedKey = key.replace(/([A-Z])/g, ' $1').trim(); // camelCase to Title Case
                            const title = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
                            
                            if (Array.isArray(value)) {
                              return `### ${title}\n${value.map(v => `- ${v}`).join('\n')}`;
                            }
                            if (typeof value === 'string') {
                              return `### ${title}\n${value}`;
                            }
                            return `### ${title}\n${JSON.stringify(value)}`;
                          }).join('\n\n');
                        }
                        return String(data);
                      };

                      return formatJsonToMarkdown(parsed);
                    } catch (e) {
                      // If parsing fails, just return cleaned content
                      return content.replace(/```json\n?|```/g, '');
                    }
                  }
                  return content;
                })()}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </Card>

      {/* Questions */}
      <Card>
        <button
          onClick={() => setShowQuestions(!showQuestions)}
          className="w-full flex items-center justify-between"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Questions ({lesson.questions?.length || 0})
          </h2>
          {showQuestions ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {showQuestions && (
          <div className="mt-4 space-y-4">
            {lesson.questions?.map((question, index) => (
              <div
                key={question.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {index + 1}. {question.question_text}
                  </p>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      {question.difficulty}
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                      {question.bloom_level}
                    </span>
                  </div>
                </div>
                {question.options && (
                  <div className="space-y-2 mt-3">
                    {question.options.map((option, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border ${
                          option.is_correct
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <span className="text-sm text-gray-900 dark:text-white">
                          {option.option_text}
                        </span>
                        {option.is_correct && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            ✓ Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {question.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Flashcards */}
      <Card>
        <button
          onClick={() => setShowFlashcards(!showFlashcards)}
          className="w-full flex items-center justify-between"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Flashcards ({lesson.flashcards?.length || 0})
          </h2>
          {showFlashcards ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {showFlashcards && (
          <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lesson.flashcards?.map((flashcard) => (
              <div
                key={flashcard.id}
                className="p-4 bg-linear-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <div className="mb-3">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
                    FRONT
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {flashcard.front}
                  </p>
                </div>
                <div className="pt-3 border-t border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
                    BACK
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {flashcard.back}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
}
