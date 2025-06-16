import React from "react";

type Props = {
  attachmentUrl?: string | null;
  courseName?: string;
};

export default function CourseAttachment({ attachmentUrl, courseName }: Props) {
  return (
    <div className="my-12">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Attach File</h2>

      {attachmentUrl ? (
        <a
          href={attachmentUrl}
          download
          className="block bg-blue-50 p-4 rounded-lg max-w-sm hover:bg-blue-100 transition"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded">
              <img src="/file.svg" alt="Document" className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{courseName || "Course"}.pdf</p>
              <p className="text-xs text-gray-500">68 mb</p>
            </div>
          </div>
        </a>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg text-gray-500 max-w-md">
          No attachment file available for this course
        </div>
      )}
    </div>
  );
}
