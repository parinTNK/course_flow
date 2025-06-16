import React from "react";

type Props = {
  detail?: string;
};

export default function CourseDetailSection({ detail }: Props) {
  if (!detail) return null;

  const paragraphs = detail.split("\n\n");

  return (
    <div className="my-12">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 ">Course Detail</h2>
      <div className="prose max-w-none text-gray-600 break-words">
        {paragraphs.map((para, idx) => (
          <p key={idx} className="mb-4 whitespace-pre-line text-sm sm:text-base">
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}
