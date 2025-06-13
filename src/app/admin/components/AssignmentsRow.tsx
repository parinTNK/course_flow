"use client";

import React from "react";
import Image from "next/image";
import TooltipCell from "./TooltipCell";
import { FullAssignment } from "@/types/Assignments";

interface AssignmentRowProps {
  assignment: FullAssignment;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
}

const AssignmentRow: React.FC<AssignmentRowProps> = ({
  assignment,
  onEdit,
  onDelete,
  formatDate,
}) => {

  return (
    <tr key={assignment.id} className="hover:bg-gray-50 transition">

      {/* Description */}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-[240px] truncate cursor-default">
        {assignment.description || "Untitled"}
      </td>

      {/* Course Name */}
      <TooltipCell text={assignment.course_name} maxWidth="max-w-[180px]" />

      {/* Lesson Name */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 truncate max-w-[160px]">
        {assignment.lesson_name || "-"}
      </td>

      {/* Sub-lesson Name */}
      <TooltipCell text={assignment.sub_lesson_name} maxWidth="max-w-[200px]" />

      {/* Created At */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {formatDate(assignment.updated_at)}
      </td>

      {/* Action */}
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
        <button
          onClick={() => onDelete(assignment.id)}
          className="text-blue-600 hover:text-blue-800 mr-3 transition"
          aria-label="Delete assignment"
        >
          <Image src="/delete.svg" alt="Delete" width={18} height={18} />
        </button>
        <button
          onClick={() => onEdit(assignment.id)}
          className="text-blue-600 hover:text-blue-800 transition"
          aria-label="Edit assignment"
        >
          <Image src="/edit.svg" alt="Edit" width={18} height={18} />
        </button>
      </td>
    </tr>
  );
};

export default AssignmentRow;
