'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/shared/ui/Button';
import { Card } from '@/components/shared/ui/Card';
import toast from 'react-hot-toast';
import {
  Upload,
  FileText,
  Edit3,
  Settings,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function GeneratePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState('upload');
  const [step, setStep] = useState(1);

  // Form data
  const [file, setFile] = useState(null);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [fileId, setFileId] = useState('');

  // Options
  const [questionType, setQuestionType] = useState('mixed');
  const [difficulty, setDifficulty] = useState('medium');
  const [aiModel, setAiModel] = useState('basic');
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [customInstructions, setCustomInstructions] = useState('');

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam && ['upload', 'topic', 'notes'].includes(modeParam)) {
      setMode(modeParam);
    }
  }, [searchParams]);

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    setFile(selectedFile);
    setUploading(true);
    try {
      const response = await apiClient.uploadFile(selectedFile);
      // Backend returns { data: { id: ... } }
      setFileId(response.data.data.id);
      toast.success('File uploaded successfully!');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (mode === 'upload' && !fileId) {
      toast.error('Please upload a file first');
      return;
    }
    if (mode === 'topic' && !topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    if (mode === 'notes' && !notes.trim()) {
      toast.error('Please enter some notes');
      return;
    }

    // Abort any previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setGenerating(true);
    try {
      const response = await apiClient.generateContent({
        source_type: mode,
        file_id: mode === 'upload' ? fileId : undefined,
        topic: mode === 'topic' ? topic : undefined,
        content: mode === 'notes' ? notes : undefined,
        question_type: questionType,
        difficulty,
        ai_model: aiModel,
        max_questions: maxQuestions,
        custom_instructions: customInstructions || undefined,
      }, controller.signal);
      toast.success('Content generated successfully!');
      router.push(`/lesson/${response.data.id}`);
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError' || error.message === 'canceled') {
        console.log('Generation request aborted by user');
        return;
      }
      console.error("Generation error:", error);
      if (error.code === 'ECONNABORTED') {
        toast.error('Generation timed out. The server is taking too long to respond. Please try again.');
      } else if (error.message === 'Network Error') {
         toast.error('Network error. Please check your connection or backend server status.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to generate content');
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setGenerating(false);
        abortControllerRef.current = null;
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Generate Study Materials
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create personalized quizzes, flashcards, and notes using AI
        </p>
      </div>

      {/* Mode Selection */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Step 1: Choose Your Source
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              id: 'upload',
              icon: Upload,
              title: 'Upload Document',
              description: 'PDF, DOCX, or TXT',
            },
            {
              id: 'topic',
              icon: FileText,
              title: 'Enter Topic',
              description: 'Let AI create content',
            },
            {
              id: 'notes',
              icon: Edit3,
              title: 'Paste Notes',
              description: 'Use your own text',
            },
          ].map((option) => {
            const Icon = option.icon;
            const isSelected = mode === option.id;
            return (
              <button
                key={option.id}
                onClick={() => {
                  setMode(option.id);
                  setStep(1);
                }}
                className={`p-6 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                }`}
              >
                <Icon
                  className={`w-8 h-8 mb-3 mx-auto ${
                    isSelected ? 'text-purple-600' : 'text-gray-400'
                  }`}
                />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Content Input */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Step 2: Provide Content
        </h2>
        {mode === 'upload' && (
          <div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Upload your document
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                PDF, DOCX, or TXT (Max 10MB)
              </p>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.docx,.txt"
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload">
                <Button
                  as="span"
                  loading={uploading}
                  className="cursor-pointer"
                >
                  {file ? 'Change File' : 'Select File'}
                </Button>
              </label>
              {file && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>
        )}
        {mode === 'topic' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter a topic to study
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis, World War II, Python Programming"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && topic.trim()) {
                  setStep(2);
                }
              }}
            />
            {topic && (
              <Button
                onClick={() => setStep(2)}
                className="mt-4"
              >
                Continue
              </Button>
            )}
          </div>
        )}
        {mode === 'notes' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paste or type your notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste your study notes here..."
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
            {notes && (
              <Button
                onClick={() => setStep(2)}
                className="mt-4"
              >
                Continue
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Generation Options */}
      {((mode === 'upload' && fileId) ||
        (mode === 'topic' && step >= 2) ||
        (mode === 'notes' && step >= 2)) && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Step 3: Customize Options
            </h2>
            <Settings className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="mixed">Mixed</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="short_answer">Short Answer</option>
                <option value="fill_in_the_blanks">Fill in the Blanks</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="very_hard">Very Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            {/* AI Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Model
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="basic">Basic (Fast)</option>
                <option value="premium">Premium (Balanced)</option>
                <option value="ultra">Ultra (Most Accurate)</option>
              </select>
            </div>

            {/* Max Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Questions: {maxQuestions}
              </label>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={maxQuestions}
                onChange={(e) => setMaxQuestions(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                <span>5</span>
                <span>20</span>
                <span>40</span>
              </div>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Add any specific requirements or focus areas..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Generate Button */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-4 items-center">
              <Button
                onClick={handleGenerate}
                loading={generating}
                icon={<Sparkles className="w-5 h-5" />}
                size="lg"
                className="w-full md:w-auto"
              >
                Generate Study Materials
              </Button>
              {generating && (
                <Button
                  onClick={() => abortControllerRef.current?.abort()}
                  variant="danger"
                  size="lg"
                  className="w-full md:w-auto"
                >
                  Cancel
                </Button>
              )}
            </div>
            {generating && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                ✨ Generating questions, flashcards, and notes... This may take a moment.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}