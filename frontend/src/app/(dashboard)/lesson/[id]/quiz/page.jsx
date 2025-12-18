'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/shared/ui/Button';
import { Card } from '@/components/shared/ui/Card';
import toast from 'react-hot-toast';
import { Check, X, Clock, Award } from 'lucide-react';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (params.id) {
        loadLesson();
    }
  }, [params.id]);

  const loadLesson = async () => {
    try {
      const response = await apiClient.getLesson(params.id);
      if (!response.data.questions || response.data.questions.length === 0) {
        toast.error('No questions available for this lesson');
        router.back();
        return;
      }
      setLesson(response.data);
      setStartTime(Date.now());
      const startResp = await apiClient.startQuizAttempt(response.data.id);
      setAttemptId(startResp.data.attempt_id);
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Quiz load error:', error);
      toast.error('Failed to load quiz');
      router.back();
    }
  };

  const currentQuestion = lesson?.questions?.[currentIndex];

  const handleAnswer = (answer) => {
    if (!currentQuestion) return;
    setAnswers({ ...answers, [currentQuestion.id]: answer });
  };

  const submitCurrentAnswer = async () => {
    if (!attemptId || !lesson || !currentQuestion) return;
    const userAnswer = answers[currentQuestion.id] || '';
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    if (!userAnswer) {
      toast.error('Please select or enter an answer');
      return;
    }
    try {
      const resp = await apiClient.submitQuestionAnswer({
        attemptId,
        lessonId: lesson.id,
        questionId: currentQuestion.id,
        userAnswer,
        timeTaken,
      });
      setFeedback(resp.data);
      setSubmitted(true);
      toast.success(resp.data.is_correct ? 'Correct!' : 'Incorrect');
    } catch (e) {
      toast.error('Failed to submit answer');
    }
  };

  const handleNext = () => {
    if (currentIndex < (lesson?.questions.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
      setSubmitted(false);
      setFeedback(null);
      setQuestionStartTime(Date.now());
    } else {
      router.push(`/lesson/${lesson.id}`);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSubmitted(false);
      setFeedback(null);
      setQuestionStartTime(Date.now());
    }
  };

  if (!lesson || !currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Question {currentIndex + 1} of {lesson.questions.length}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 inline mr-1" />
            {Math.floor((Date.now() - startTime) / 1000 / 60)}m
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / lesson.questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card className="p-8">
        <div className="flex gap-2 mb-6">
          <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
            {currentQuestion.difficulty}
          </span>
          <span className="text-xs px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
            {currentQuestion.bloom_level}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {currentQuestion.question_text}
        </h2>

        {/* Multiple Choice Options */}
        {currentQuestion.question_type === 'multiple_choice' &&
          currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === option.option_text;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option.option_text)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                          isSelected
                            ? 'border-purple-600 bg-purple-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className="text-gray-900 dark:text-white">
                        {option.option_text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        {/* True/False Options */}
        {currentQuestion.question_type === 'true_false' && (
          <div className="flex gap-4">
            {['True', 'False'].map((option) => {
              const isSelected = answers[currentQuestion.id] === option;
              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`flex-1 p-6 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                  }`}
                >
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Short Answer */}
        {currentQuestion.question_type === 'short_answer' && (
          <textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
          />
        )}

        {feedback && (
          <div className={`mt-6 p-4 rounded-lg border ${feedback.is_correct ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              {feedback.is_correct ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
              <span className="font-semibold">{feedback.is_correct ? 'Correct' : 'Incorrect'}</span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <div className="mb-1">
                Correct answer: <span className="font-medium">{feedback.correct_answer}</span>
              </div>
              {feedback.explanation && <div>{feedback.explanation}</div>}
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        {!submitted ? (
          <Button onClick={submitCurrentAnswer}>Submit Answer</Button>
        ) : (
          <Button onClick={handleNext}>
            {currentIndex === lesson.questions.length - 1 ? 'Finish' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  );
}
