'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/shared/ui/Button';
import { Card } from '@/components/shared/ui/Card';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, RotateCcw, Check } from 'lucide-react';

export default function FlashcardsPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studied, setStudied] = useState(new Set());

  useEffect(() => {
    if (params.id) {
        loadLesson();
    }
  }, [params.id]);

  const loadLesson = async () => {
    try {
      const response = await apiClient.getLesson(params.id);
      setLesson(response.data);
    } catch (error) {
      toast.error('Failed to load flashcards');
      router.back();
    }
  };

  if (!lesson || !lesson.flashcards || lesson.flashcards.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No flashcards available for this lesson.
          </p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const currentCard = lesson.flashcards[currentIndex];
  const progress = ((studied.size / lesson.flashcards.length) * 100).toFixed(0);

  const handleNext = () => {
    if (currentIndex < lesson.flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const markAsStudied = () => {
    setStudied(new Set(studied).add(currentCard.id));
    if (currentIndex < lesson.flashcards.length - 1) {
      handleNext();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {lesson.title} - Flashcards
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-600 dark:text-gray-400">
            Card {currentIndex + 1} of {lesson.flashcards.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Studied: {studied.size} / {lesson.flashcards.length} ({progress}%)
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard */}
      <div className="relative" style={{ minHeight: '400px' }}>
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="cursor-pointer"
          style={{ perspective: '1000px' }}
        >
          <Card
            className={`p-12 text-center transition-all duration-500 min-h-[400px] flex items-center justify-center`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <div style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
              {!isFlipped ? (
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mb-4">
                    FRONT
                  </p>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {currentCard.front}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
                    Click to flip
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)'
                  }}
                >
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-4">
                    BACK
                  </p>
                  <p className="text-xl text-gray-900 dark:text-white leading-relaxed">
                    {currentCard.back}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
                    Click to flip back
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
        {/* Studied Indicator */}
        {studied.has(currentCard.id) && (
          <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full">
            <Check className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          icon={<ChevronLeft className="w-5 h-5" />}
        >
          Previous
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsFlipped(!isFlipped)}
            icon={<RotateCcw className="w-5 h-5" />}
          >
            Flip
          </Button>
          {!studied.has(currentCard.id) && (
            <Button onClick={markAsStudied} icon={<Check className="w-5 h-5" />}>
              Mark as Studied
            </Button>
          )}
        </div>
        <Button
          onClick={handleNext}
          disabled={currentIndex === lesson.flashcards.length - 1}
        >
          Next
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Completion */}
      {studied.size === lesson.flashcards.length && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                🎉 Great job! You've studied all flashcards!
              </h3>
              <p className="text-green-700 dark:text-green-300 mt-1">
                Ready to test your knowledge?
              </p>
            </div>
            <Button onClick={() => router.push(`/lesson/${lesson.id}/quiz`)}>
              Take Quiz
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
