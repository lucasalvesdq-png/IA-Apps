export type KnowledgeLevel = 'iniciante' | 'intermediário' | 'avançado';

export interface Subject {
  name: string;
  level: KnowledgeLevel;
  progress: number; // 0 to 100
}

export interface UserProfile {
  name: string;
  targetExam: string;
  subjects: Subject[];
  onboarded: boolean;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  type?: 'text' | 'exercise';
  exercise?: Exercise;
}

export interface Exercise {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface StudySession {
  id: string;
  date: string;
  subject: string;
  performance: number; // 0 to 100
  duration: number; // minutes
}

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
}
