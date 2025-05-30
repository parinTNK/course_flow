"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/app/context/authContext";

type DraftContextType = {
  dirtyAssignments: Set<string>;
  setDirty: (id: string) => void;
  clearDrafts: () => void;
  saveAllDrafts: () => Promise<void>;
};

const DraftContext = createContext<DraftContextType | null>(null);

export function useDraft() {
  return useContext(DraftContext);
}

export const DraftProvider = ({ children }: { children: React.ReactNode }) => {
  const [dirtyAssignments, setDirtyAssignments] = useState<Set<string>>(
    new Set()
  );
  const { user } = useAuth();

  useEffect(() => {
    const syncFromWindow = () => {
      const raw =
        typeof window !== "undefined" ? window.__draftAnswers : undefined;
      const ids = raw ? Object.keys(raw) : [];
      setDirtyAssignments(new Set(ids));
    };

    syncFromWindow();
    const interval = setInterval(syncFromWindow, 1000);
    return () => clearInterval(interval);
  }, []);

  const setDirty = (id: string, answer: string) => {
    if (typeof window !== "undefined") {
      if (!window.__draftAnswers) window.__draftAnswers = {};
      window.__draftAnswers[id] = answer;
    }
    setDirtyAssignments((prev) => new Set(prev).add(id));
  };

  const clearDrafts = () => {
    if (typeof window !== "undefined") {
      window.__draftAnswers = {};
    }
    setDirtyAssignments(new Set());
  };

  const saveAllDrafts = async () => {
    const raw =
      typeof window !== "undefined" ? window.__draftAnswers : undefined;
    console.log("✅ draft raw:", raw);
    console.log("✅ current user:", user);

    if (!raw || !user?.user_id) {
      console.warn("⛔ Missing draft data or unauthenticated user");
      return;
    }

    const savePromises = Object.entries(raw).map(([assignmentId, answer]) => {
      console.log("📤 Saving to:", assignmentId, "with userId:", user.user_id);
      return fetch(
        `/api/submission?assignmentId=${assignmentId}&userId=${user.user_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer, status: "inprogress" }),
        }
      );
    });

    await Promise.all(savePromises);
    clearDrafts();
  };

  return (
    <DraftContext.Provider
      value={{
        dirtyAssignments,
        setDirty,
        clearDrafts,
        saveAllDrafts,
      }}
    >
      {children}
    </DraftContext.Provider>
  );
};
