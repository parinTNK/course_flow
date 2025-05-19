"use client";
import React, { createContext, useContext, ReactNode, useState, useCallback } from "react";

type ProgressContextType = {
  progressUpdated: boolean;
  refreshProgress: () => void;
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progressUpdated, setProgressUpdated] = useState(false);

  const refreshProgress = useCallback(() => {
    // flip ค่า เพื่อให้ useEffect ของ Sidebar trigger
    setProgressUpdated((prev) => !prev);
  }, []);

  return (
    <ProgressContext.Provider value={{ progressUpdated, refreshProgress }}>
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
