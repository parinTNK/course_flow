import React from "react";
import Image from "next/image";
import { FullAssignment} from "@/types/Assignments";

interface AssignmentRowProps {
  assignment: FullAssignment;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
}

const AssignmentRow: React.FC<AssignmentRowProps> = ({
  assignment,
  index,
  onEdit,
  onDelete,
  formatDate,
}) => {
  return (
    <tr key={assignment.id} className="hover:bg-gray-50 transition">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{index}</td>

      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {assignment.description || "Untitled"}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {assignment.course_name || "-"}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {assignment.lesson_name || "-"}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {assignment.sub_lesson_name || "-"}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {formatDate(assignment.created_at)}
      </td>

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