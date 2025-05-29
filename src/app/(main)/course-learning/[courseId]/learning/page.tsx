// /src/app/(main)/course-learning/[courseId]/learning/page.tsx
'use client';  // ✅ Only this one at top

import { useAuth } from "@/app/context/authContext";
import { DraftProvider } from "@/app/context/draftContext";
import { LearningProvider } from "@/components/learning/context/LearningContext";
import { ProgressProvider } from "@/components/learning/context/ProgressContext";
import CourseContent from "./CourseContent";

export default function CourseLearningPage() {
  const { user } = useAuth();

  const saveAllDrafts = async () => {
    const dirtyDrafts = window.__draftAnswers;
    if (!dirtyDrafts || !user) return;

    const savePromises = Object.entries(dirtyDrafts).map(
      async ([assignmentId, answer]) => {
        await fetch(`/api/submission?assignmentId=${assignmentId}&userId=${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer, status: "inprogress" }),
        });
      }
    );

    await Promise.all(savePromises);
  };

  return (
    <DraftProvider value={{ saveAllDrafts }}>
      <LearningProvider>
        <ProgressProvider>
          <CourseContent />
        </ProgressProvider>
      </LearningProvider>
    </DraftProvider>
  );
}
