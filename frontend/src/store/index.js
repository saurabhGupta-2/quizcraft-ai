import { create } from 'zustand';

/**
 * @typedef {import('@/types').User} User
 * @typedef {import('@/types').Lesson} Lesson
 */

/**
 * @typedef {object} AppState
 * @property {User | null} user
 * @property {(user: User | null) => void} setUser
 * @property {Lesson | null} currentLesson
 * @property {(lesson: Lesson | null) => void} setCurrentLesson
 * @property {Lesson[]} lessons
 * @property {(lessons: Lesson[]) => void} setLessons
 * @property {boolean} isLoading
 * @property {(loading: boolean) => void} setIsLoading
 * @property {boolean} sidebarOpen
 * @property {(open: boolean) => void} setSidebarOpen
 */

/**
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<AppState>>}
 */
export const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  currentLesson: null,
  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),

  lessons: [],
  setLessons: (lessons) => set({ lessons }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

