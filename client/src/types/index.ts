export interface User {
  id: number;
  firstName: string;
  email: string;
  school: string;
  programme?: string;
  studyCenter?: string;
  level?: string;
  referralCode?: string;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  description?: string;
  level?: string;
  faculty?: string;
  semester?: string;
}

export interface CourseMaterial {
  id: number;
  courseId: number;
  title: string;
  type: string;
  content?: string;
  fileUrl?: string;
  duration?: string;
  pages?: number;
  questions?: number;
  createdAt: string;
}

export interface Exam {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  type: string;
  date?: string;
  createdAt: string;
}

export interface Question {
  id: number;
  courseId: number;
  content: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  type?: string;
  difficulty?: string;
}

export interface UserProgress {
  id: number;
  userId: number;
  courseId: number;
  materialId?: number;
  examId?: number;
  score?: number;
  completed: boolean;
  timestamp: string;
  course?: {
    id: number;
    code: string;
    title: string;
  };
  material?: {
    id: number;
    title: string;
    type: string;
  };
  exam?: {
    id: number;
    title: string;
    type: string;
  };
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location?: string;
  type?: string;
  description?: string;
  requirements?: string;
  applicationUrl?: string;
  postedAt: string;
  faculty?: string;
}

export interface ForumAuthor {
  id: number;
  firstName: string;
}

export interface ForumPost {
  id: number;
  userId: number;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  views: number;
  createdAt: string;
  author?: ForumAuthor;
  replyCount?: number;
}

export interface ForumReply {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string;
  author?: ForumAuthor;
}

export interface ChatMessage {
  id: number;
  userId: number;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}

export interface ChatUsage {
  promptsUsed: number;
  promptLimit: number | null;
}

export type SubscriptionTier = 'Free' | 'Premium';

export interface UserProfile extends User {
  subscription: SubscriptionTier;
}

export interface RecentProgressItem {
  id: number;
  type: string;
  title: string;
  timestamp: string;
  score?: number;
  course?: string;
}

export interface UpcomingExam {
  id: number;
  courseId: number;
  code: string;
  title: string;
  description?: string;
  date: string;
  daysUntil: number;
}
