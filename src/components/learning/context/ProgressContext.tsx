"use client";
import React, { createContext, useContext, ReactNode, useState, useCallback } from "react";

type ProgressContextType = {
  progressUpdated: boolean;
  refreshProgress: () => void;
  updateLessonStatus: (subLessonId: string, status: string) => void;
  lessonStatusUpdates: Record<string, string>;
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progressUpdated, setProgressUpdated] = useState(false);
  const [lessonStatusUpdates, setLessonStatusUpdates] = useState<Record<string, string>>({});

  const refreshProgress = useCallback(() => {
    setProgressUpdated((prev) => !prev);
  }, []);

  const updateLessonStatus = useCallback((subLessonId: string, status: string) => {
    setLessonStatusUpdates(prev => ({
      ...prev,
      [subLessonId]: status
    }));
    // Also trigger general refresh
    refreshProgress();
  }, [refreshProgress]);

  return (
    <ProgressContext.Provider value={{ 
      progressUpdated, 
      refreshProgress, 
      updateLessonStatus,
      lessonStatusUpdates 
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}
