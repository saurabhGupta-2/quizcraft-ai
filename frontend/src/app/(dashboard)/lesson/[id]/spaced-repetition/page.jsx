'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/shared/ui/Button';
import { Card } from '@/components/shared/ui/Card';
import toast from 'react-hot-toast';
import { Brain, ChevronRight } from 'lucide-react';

const QUALITY_LEVELS = [
  { value: 0, label: 'Complete Blackout', color: 'bg-red-500' },
  { value: 1, label: 'Wrong, but familiar', color: 'bg-orange-500' },
  { value: 2, label: 'Wrong, but recalled', color: 'bg-yellow-500' },
  { value: 3, label: 'Correct with effort', color: 'bg-blue-500' },
  { value: 4, label: 'Correct with hesitation', color: 'bg-green-500' },
  { value: 5, label: 'Perfect recall', color: 'bg-purple-500' },
];

export default function SpacedRepetitionPage() {
  const params = useParams();
  const router = useRouter();
  const [dueCards, setDueCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (params.id) {
        loadDueCards();
    }
  }, [params.id]);

  const loadDueCards = async () => {
    try {
      const response = await apiClient.getDueFlashcards(params.id);
      if (response.data.length === 0) {
        setCompleted(true);
      } else {
        setDueCards(response.data);
      }
    } catch (error) {
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const currentCard = dueCards[currentIndex];

  const handleRating = async (quality) => {
    if (!currentCard) return;
    try {
      await apiClient.reviewFlashcard(currentCard.id, quality);

      if (currentIndex < dueCards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        setCompleted(true);
        toast.success('All cards reviewed!');
      }
    } catch (error) {
      toast.error('Failed to save review');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (completed || dueCards.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="text-center py-12">
          <Brain className="w-20 h-20 text-purple-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            All Caught Up! 🎉
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            No cards are due for review right now. Come back later!
          </p>
          <Button onClick={() => router.push(`/lesson/${params.id}`)}>
            Back to Lesson
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Spaced Repetition Review
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Card {currentIndex + 1} of {dueCards.length} due for review
        </p>
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / dueCards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <Card className="p-12 text-center min-h-[400px] flex flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mb-4">
            QUESTION
          </p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {currentCard.front}
          </h2>

          {!showAnswer ? (
            <Button onClick={() => setShowAnswer(true)} size="lg">
              Show Answer
            </Button>
          ) : (
            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-2">
                ANSWER
              </p>
              <p className="text-xl text-gray-900 dark:text-white">
                {currentCard.back}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Rating Buttons */}
      {showAnswer && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            How well did you know this?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {QUALITY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => handleRating(level.value)}
                className={`${level.color} text-white p-4 rounded-lg hover:opacity-90 transition-all transform hover:scale-105`}
              >
                <div className="text-2xl font-bold mb-1">{level.value}</div>
                <div className="text-sm">{level.label}</div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
