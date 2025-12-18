import Link from 'next/link';
import { BookOpen, Sparkles, Brain, Target } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">QuizCraft AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Learning with
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-blue-600">
              {' '}AI-Powered{' '}
            </span>
            Education
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Generate personalized quizzes, flashcards, and study materials from any content.
            Powered by advanced AI to adapt to your learning style.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/signup"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg"
            >
              Start Learning Free
            </Link>
            <Link
              href="/login"
              className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg hover:bg-purple-50 transition-colors font-semibold text-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Excel
          </h2>
          <p className="text-lg text-gray-600">
            Powerful features designed to enhance your learning experience
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Sparkles,
              title: 'AI-Powered Generation',
              description: 'Generate questions, flashcards, and notes from any content using advanced AI.',
            },
            {
              icon: Brain,
              title: 'Adaptive Learning',
              description: 'Questions adapt to your skill level using Bloom\'s Taxonomy for optimal learning.',
            },
            {
              icon: Target,
              title: 'Spaced Repetition',
              description: 'Smart flashcard review system to maximize retention and long-term memory.',
            },
            {
              icon: BookOpen,
              title: 'Multiple Formats',
              description: 'Upload PDFs, DOCX, or paste notes to generate personalized study materials.',
            },
            {
              icon: BookOpen,
              title: 'Interactive Quizzes',
              description: 'Engage with multiple question types and get instant feedback on your answers.',
            },
            {
              icon: BookOpen,
              title: 'Progress Tracking',
              description: 'Monitor your learning journey with detailed analytics and performance insights.',
            },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="p-3 bg-purple-100 rounded-lg inline-block mb-4">
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-linear-to-r from-purple-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of students and educators using QuizCraft AI
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <BookOpen className="w-8 h-8" />
              <span className="text-2xl font-bold">QuizCraft AI</span>
            </div>
            <p className="text-gray-400">
              © 2025 QuizCraft AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
