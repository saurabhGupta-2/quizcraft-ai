import axios from 'axios';
import { getSession } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/${API_VERSION}`,
      headers: {
        'Content-Type': 'application/json',
      },
      // Prevent the UI from hanging indefinitely if the backend is unreachable
      timeout: 30000,
      timeoutErrorMessage:
        'Request timed out. Please check your connection or try again.',
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        console.log(`[ApiClient] Request starting: ${config.method?.toUpperCase()} ${config.url}`);
        try {
          const session = await getSession();
          if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
          }
        } catch (error) {
          console.error('[ApiClient] Error getting session:', error);
        }
        return config;
      },
      (error) => {
        console.error('[ApiClient] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Redirect to login if unauthorized
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // --- Routes are now hardcoded based on backend logs ---

  // Auth endpoints (FastAPI usually likes trailing slashes for these)
  async signup(data) {
    return this.client.post('/auth/signup/', data);
  }

  async login(email, password) {
    return this.client.post('/auth/login/', { email, password });
  }

  async onboarding(data) {
    return this.client.post('/auth/onboarding/', data);
  }

  async getCurrentUser() {
    return this.client.get('/auth/me/');
  }

  // Lesson endpoints
  async getLessons(folderId) {
    // Fixed with trailing slash based on earlier logs
    return this.client.get('/lessons/', {
      params: { folder_id: folderId },
    });
  }

  async getLesson(lessonId) {
    // Dynamic routes typically do not have trailing slashes
    return this.client.get(`/lessons/${lessonId}`);
  }

  async createLesson(data) {
    return this.client.post('/lessons/', data);
  }

  async deleteLesson(lessonId) {
    return this.client.delete(`/lessons/${lessonId}`);
  }


  // Generation endpoints
  async generateContent(data, signal) {
    return this.client.post('/generate/', data, {
      timeout: 120000, // Override default: Set to 120 seconds (2 minutes)
      signal, // Allow aborting the request
    });
  }

  // Upload endpoints
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    // --- CORRECTED: Removed trailing slash to match @router.post("/file") ---
    return this.client.post('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Quiz endpoints
  async submitQuiz(data) {
    return this.client.post('/quizzes/submit', data);
  }

  async getPerformance(lessonId) {
    // --- CORRECTED: Removed trailing slash to match logs ---
    return this.client.get('/quizzes/performance', {
      params: { lesson_id: lessonId },
    });
  }

  async startQuizAttempt(lessonId) {
    return this.client.post('/quizzes/start', { lesson_id: lessonId });
  }

  async submitQuestionAnswer({ attemptId, lessonId, questionId, userAnswer, timeTaken }) {
    return this.client.post('/quizzes/answer', {
      attempt_id: attemptId,
      lesson_id: lessonId,
      question_id: questionId,
      user_answer: userAnswer,
      time_taken: timeTaken ?? 0,
    });
  }

  // Flashcard endpoints
  async reviewFlashcard(flashcardId, quality) {
    return this.client.post('/flashcards/review/', {
      flashcard_id: flashcardId,
      quality,
    });
  }

  async getDueFlashcards(lessonId) {
    return this.client.get(`/flashcards/due/${lessonId}`);
  }

  // Folder endpoints
  async getFolders() {
    return this.client.get('/folders/');
  }

  async createFolder(name, parentId) {
    return this.client.post('/folders/', {
      name,
      parent_id: parentId,
    });
  }

  async deleteFolder(folderId) {
    return this.client.delete(`/folders/${folderId}`);
  }

  // Chat endpoints
  async chatWithContent(message, fileId, lessonId) {
    return this.client.post('/chat/', {
      message,
      file_id: fileId,
      lesson_id: lessonId,
    });
  }

  async chatWithContentStream({ message, fileId, lessonId, token, apiBase }) {
    const url = `${apiBase || `${API_URL}/api/${API_VERSION}`}/chat/stream`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        file_id: fileId,
        lesson_id: lessonId,
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Stream request failed with status ${res.status}`);
    }
    return res.body;
  }

  // Tutor endpoints (Mem0 + Gemini)
  async tutorChat(message, history) {
    return this.client.post('/tutor/chat', {
      message,
      history,
    });
  }

  async tutorProfile() {
    return this.client.get('/tutor/profile');
  }

  async tutorChatStream({ message, history, token, apiBase }) {
    const url = `${apiBase || `${API_URL}/api/${API_VERSION}`}/tutor/chat/stream`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Stream request failed with status ${res.status}`);
    }
    return res.body;
  }
}

export const apiClient = new ApiClient();

