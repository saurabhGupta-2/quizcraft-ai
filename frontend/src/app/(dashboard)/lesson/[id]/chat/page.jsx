'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/shared/ui/Button';
import { Card } from '@/components/shared/ui/Card';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, MessageSquare, Sparkles } from 'lucide-react';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (params.id) {
        loadLesson();
    }
  }, [params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadLesson = async () => {
    try {
      const response = await apiClient.getLesson(params.id);
      setLesson(response.data);

      // Add welcome message
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hi! I'm here to help you with "${response.data.title}". Ask me anything about this lesson!`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      toast.error('Failed to load lesson');
      router.back();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || !lesson) return;
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const response = await apiClient.chatWithContent(
        input,
        undefined,
        lesson.id
      );
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    'Explain the main concepts',
    'Create a practice question',
    'What are the key takeaways?',
    'How can I remember this better?',
  ];

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Chat: {lesson?.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ask questions about your lesson content
        </p>
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-y-auto mb-4 p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.role === 'assistant' && (
                  <Sparkles className="w-5 h-5 shrink-0 mt-1" />
                )}
                <div className="prose dark:prose-invert max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {(() => {
                      const content = message.content;
                      // Try to parse if it looks like a JSON block
                      if (content.trim().startsWith('```json') || (content.trim().startsWith('{') && content.includes('}'))) {
                        try {
                          const cleanContent = content.replace(/```json\n?|```/g, '');
                          const parsed = JSON.parse(cleanContent);
                          // Helper to format object/array to markdown
                          const formatJsonToMarkdown = (data) => {
                            if (Array.isArray(data)) return data.map(item => `- ${item}`).join('\n');
                            if (typeof data === 'object' && data !== null) {
                              return Object.entries(data).map(([key, value]) => {
                                const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
                                const title = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
                                if (Array.isArray(value)) return `**${title}**\n${value.map(v => `- ${v}`).join('\n')}`;
                                if (typeof value === 'object') return `**${title}**\n${JSON.stringify(value)}`;
                                return `**${title}**: ${value}`;
                              }).join('\n\n');
                            }
                            return String(data);
                          };
                          // If parsed is an object with a "response" key, use that
                          if (parsed.response) return parsed.response;
                          return formatJsonToMarkdown(parsed);
                        } catch (e) {
                          return content;
                        }
                      }
                      return content;
                    })()}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </Card>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              onClick={() => setInput(question)}
              className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask a question about this lesson..."
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          disabled={loading}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          icon={<Send className="w-5 h-5" />}
        />
      </div>
    </div>
  );
}
