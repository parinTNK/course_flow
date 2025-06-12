"use client";

import { DraftProvider } from "@/app/context/draftContext";
import { LearningProvider } from "@/components/learning/context/LearningContext";
import { ProgressProvider } from "@/components/learning/context/ProgressContext";
import CourseContent from "./CourseContent";

export default function CourseLearningPage() {
  return (
    <DraftProvider>
      <LearningProvider>
        <ProgressProvider>
          <CourseContent />
        </ProgressProvider>
      </LearningProvider>
    </DraftProvider>
  );
}