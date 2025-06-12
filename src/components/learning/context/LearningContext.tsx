"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  question: string;
  start_date: string;
  end_date: string;
  lesson_id: string;
  sub_lesson_id: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  submission_date: string;
  status: string;
  grade: number;
}

interface SubLesson {
  id: string;
  title: string;
  video_url: string;
  order_no: number;
  content?: string;
  is_completed?: boolean;
  assignment?: Assignment;
  submission?: Submission;
  mux_asset_id?: string;
  is_ready?: boolean;
  duration?: number;
}

interface LearningContextType {
  currentLesson: SubLesson | null;
  setCurrentLesson: (lesson: SubLesson) => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: ReactNode }) {
  const [currentLesson, setCurrentLesson] = useState<SubLesson | null>(null);

  return (
    <LearningContext.Provider value={{ currentLesson, setCurrentLesson }}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error("useLearning ต้องถูกใช้ภายใน LearningProvider");
  }
  return context;
}

