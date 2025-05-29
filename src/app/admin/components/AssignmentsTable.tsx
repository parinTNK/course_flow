import React from "react";
import AssignmentRow from "./AssignmentsRow";
import { FullAssignment } from "@/types/Assignments";

interface AssignmentsTableProps {
  assignments: FullAssignment[];
  onEditAssignment: (id: string) => void;
  onDeleteAssignment: (id: string) => void;
  formatDate: (dateString: string) => string;
  isLoading: boolean;
  currentPage: number;
}

const AssignmentsTable: React.FC<AssignmentsTableProps> = ({
  assignments,
  onEditAssignment,
  onDeleteAssignment,
  formatDate,
  isLoading,
  currentPage,
}) => {
  const tableHeaderClasses =
    "px-6 py-3 text-left text-[14px] font-medium text-gray-500 uppercase tracking-wider";
  const assignmentsPerPage = 10;

  if (!isLoading && assignments.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-gray-500 bg-white shadow-md rounded-lg">
        No assignments found.
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-300">
            <tr>
              {["", "Detail", "Course", "Lesson", "Sub-lesson", "Created at", "Action"].map(
                (header, idx) => (
                  <th
                    key={idx}
                    className={`${tableHeaderClasses} ${
                      header === "Action" ? "text-center" : ""
                    }`}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignments.map((assignment, index) => (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                index={(currentPage - 1) * assignmentsPerPage + index + 1}
                onEdit={onEditAssignment}
                onDelete={() => onDeleteAssignment(assignment.id)}
                formatDate={formatDate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignmentsTable;
