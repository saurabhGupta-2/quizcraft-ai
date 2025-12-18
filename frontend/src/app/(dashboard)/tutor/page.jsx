'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/shared/ui/Card';
import { Button } from '@/components/shared/ui/Button';
import { Loader2, MessageCircle, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSession } from '@/lib/supabase/client';

export default function TutorPage() {
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [profile, setProfile] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await apiClient.tutorProfile();
      setProfile(res.data.profile);
    } catch (error) {
      console.error('[Tutor] Profile load error:', error);
      toast.error(
        error?.response?.data?.detail || 'Failed to load learning profile'
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    // Load profile on first mount
    loadProfile();
  }, []);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    console.log('[Tutor] sending message', {
      messageLength: trimmed.length,
      historyLength: chatHistory.length,
    });

    setSending(true);
    try {
      const res = await apiClient.tutorChat(trimmed, chatHistory);

      // Basic shape validation to avoid UI hangs if backend shape changes
      const incoming = res?.data?.history;
      if (!Array.isArray(incoming)) {
        console.error('[Tutor] Unexpected history shape', incoming);
        toast.error('Tutor response was invalid. Please try again.');
        setSending(false);
        return;
      }

      setChatHistory(incoming);
      setMessage('');
      console.log('[Tutor] response received', {
        historyLength: incoming.length,
      });
    } catch (error) {
      console.error('[Tutor] Chat error:', error);
      toast.error(
        error?.response?.data?.detail || error?.message || 'Failed to chat with tutor'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendStream = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    console.log('[Tutor] streaming send', {
      messageLength: trimmed.length,
      historyLength: chatHistory.length,
    });

    setStreaming(true);
    setSending(true);

    try {
      const session = await getSession();
      const token = session?.access_token;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const stream = await apiClient.tutorChatStream({
        message: trimmed,
        history: chatHistory,
        token,
        apiBase: `${apiBase}/api/v1`,
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let reply = '';
      let localHistory = [...chatHistory, [trimmed, '']];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        const lines = accumulated.split('\n');
        // keep last partial line in accumulator
        accumulated = lines.pop() || '';

        for (const line of lines) {
          const dataPrefix = 'data:';
          if (!line.startsWith(dataPrefix)) continue;
          const data = line.slice(dataPrefix.length).trim();
          if (data === '[DONE]') {
            break;
          }
          reply += data;
          // update last message with incremental reply
          localHistory[localHistory.length - 1][1] = reply;
          setChatHistory([...localHistory]);
        }
      }

      setMessage('');
      console.log('[Tutor] stream completed', { replyLength: reply.length });
    } catch (error) {
      console.error('[Tutor] Stream chat error:', error);
      toast.error(
        error?.response?.data?.detail || error?.message || 'Failed to stream tutor response'
      );
    } finally {
      setStreaming(false);
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending) {
        handleSend();
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Personalized AI Tutor
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Chat with an AI tutor that remembers your learning journey using Mem0.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat column */}
        <Card className="lg:col-span-2 flex flex-col h-[540px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Tutoring Session
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {chatHistory.length === 0 && !sending && (
              <div className="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400 text-sm px-6">
                <p>
                  Introduce yourself and your learning goals. For example:
                  <br />
                  <span className="italic">
                    &quot;Hi! I&apos;m struggling with calculus but I&apos;m good at algebra.
                    I feel anxious about math exams.&quot;
                  </span>
                </p>
              </div>
            )}

            {chatHistory.map(([userMsg, tutorMsg], idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm bg-purple-600 text-white whitespace-pre-wrap">
                    {userMsg}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {tutorMsg}
                  </div>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <form
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (!sending && !streaming) {
                handleSendStream();
              }
            }}
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your tutor anything about your studies..."
              rows={2}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none text-sm"
            />
            <Button
              type="submit"
              disabled={!message.trim() || sending || streaming}
            >
              {sending || streaming ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </Card>

        {/* Profile column */}
        <Card className="flex flex-col h-[540px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Learning Profile
              </h2>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadProfile}
              loading={loadingProfile}
            >
              Refresh
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingProfile && (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading profile...
              </div>
            )}
            {!loadingProfile && (
              <pre className="whitespace-pre-wrap text-xs text-gray-800 dark:text-gray-100 font-mono">
                {profile || 'No learning history yet. Start chatting with your tutor to build your profile.'}
              </pre>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}


