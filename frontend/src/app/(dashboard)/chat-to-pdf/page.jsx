'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/shared/ui/Button';
import { Card } from '@/components/shared/ui/Card';
import toast from 'react-hot-toast';
import { Upload, FileText, Send, Loader2 } from 'lucide-react';
import { getSession } from '@/lib/supabase/client';

export default function ChatToPdfPage() {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState('');
  const [uploading, setUploading] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);

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
      setFileId(response.data.data.id);
      toast.success('File uploaded successfully! You can now ask questions about it.');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload file');
      setFile(null);
      setFileId('');
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!fileId) {
      toast.error('Please upload a document first');
      return;
    }

    const userMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);
    setStreaming(true);

    try {
      console.log('[ChatToPdf] Sending message to chat API (stream)', {
        hasFileId: !!fileId,
        messageLength: trimmed.length,
      });

      const session = await getSession();
      const token = session?.access_token;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const stream = await apiClient.chatWithContentStream({
        message: trimmed,
        fileId,
        lessonId: null,
        token,
        apiBase: `${apiBase}/api/v1`,
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let reply = '';
      let localMessages = [...messages, userMessage, { role: 'assistant', content: '' }];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        const lines = accumulated.split('\n');
        accumulated = lines.pop() || '';

        for (const line of lines) {
          const prefix = 'data:';
          if (!line.startsWith(prefix)) continue;
          const data = line.slice(prefix.length).trim();
          if (data === '[DONE]') {
            break;
          }
          reply += data;
          localMessages[localMessages.length - 1] = { role: 'assistant', content: reply };
          setMessages([...localMessages]);
        }
      }

      console.log('[ChatToPdf] Stream complete', { replyLength: reply.length });
    } catch (error) {
      console.error('[ChatToPdf] Chat error:', error);
      const detail =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to get response';
      toast.error(detail);
    } finally {
      setSending(false);
      setStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending) {
        handleSendMessage();
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Chat to PDF
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Upload a document and ask questions about its content in real time.
        </p>
      </div>

      {/* Upload card */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Step 1: Upload your document
        </h2>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            PDF, DOCX, or TXT (Max 10MB)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This document will be processed so you can chat with its contents.
          </p>
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt"
            className="hidden"
            id="chat-pdf-upload"
            disabled={uploading}
          />
          <label htmlFor="chat-pdf-upload">
            <Button
              as="span"
              loading={uploading}
              className="cursor-pointer"
            >
              {file ? 'Change File' : 'Select File'}
            </Button>
          </label>
          {file && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Selected: {file.name}</span>
            </p>
          )}
        </div>
      </Card>

      {/* Chat section */}
      <Card className="h-[480px] flex flex-col">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Step 2: Ask questions about your document
        </h2>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400 text-sm px-6">
              <p>
                Upload a document above, then start asking questions like
                &nbsp;
                <span className="italic">
                  &quot;Summarize this document&quot;,
                  &nbsp;&quot;What are the main points?&quot;,
                  &nbsp;&quot;Explain section 2 in simple words&quot;.
                </span>
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {(sending || streaming) && (
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
              handleSendMessage();
            }
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              fileId
                ? 'Ask a question about your document...'
                : 'Upload a document first, then ask your question...'
            }
            rows={2}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none text-sm"
          />
          <Button
            type="submit"
            disabled={!input.trim() || !fileId || sending || streaming}
            icon={<Send className="w-4 h-4" />}
          >
            {sending || streaming ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </Card>
    </div>
  );
}


