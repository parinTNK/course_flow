"use client";

import { useLearning } from "./context/LearningContext";

export default function LessonContent() {
  const { currentLesson } = useLearning();

  // ในกรณีที่ยังไม่มีบทเรียนที่เลือก
  if (!currentLesson) {
    return null;
  }

  return (
    <div className="prose max-w-none">
      {currentLesson.content && (
        <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
      )}
    </div>
  );
}