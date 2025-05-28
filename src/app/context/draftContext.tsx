"use client";

import { createContext, useContext, useState } from "react";

type DraftContextType = {
  dirtyAssignments: Set<string>;
  saveAllDrafts?: () => Promise<void>;
  setDirty: (id: string) => void;
  clearDrafts: () => void;
};

const DraftContext = createContext<DraftContextType | null>(null);

export function useDraft() {
  const ctx = useContext(DraftContext);
  return ctx; // allow undefined for optional use
}

export const DraftProvider = ({ children }: { children: React.ReactNode }) => {
  const [dirtyAssignments, setDirtyAssignments] = useState<Set<string>>(new Set());

  const setDirty = (id: string) => {
    setDirtyAssignments((prev) => new Set(prev).add(id));
  };

  const clearDrafts = () => {
    setDirtyAssignments(new Set());
  };

  return (
    <DraftContext.Provider
      value={{
        dirtyAssignments,
        setDirty,
        clearDrafts,
      }}
    >
      {children}
    </DraftContext.Provider>
  );
};
