"use client";

import React, { useCallback } from "react";
import { FiPlus } from "react-icons/fi";
import { useRouter } from "next/navigation";
import SearchBar from "../../components/SearchBar";
import AssignmentsTable from "../../components/AssignmentsTable";
import Pagination from "../../components/Pagination";
import { useAssignmentsContext, AssignmentsProvider } from "../../context/AssignmentsContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import { ButtonT } from "@/components/ui/ButtonT";

export function AssignmentsPageContent() {
  const router = useRouter();

  const {
    assignments,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    handleDeleteAssignment,
    currentPage,
    totalPages,
    setCurrentPage,
  } = useAssignmentsContext();

  const handleAddAssignment = useCallback(() => {
    router.push("/admin/dashboard/create-assignments");
  }, [router]);

  const handleEditAssignment = useCallback((id: string) => {
    router.push(`/admin/dashboard/edit-assignments/${id}`);
  }, [router]);

  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })} ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return dateString;
    }
  }, []);

  return (
    <div className="bg-gray-100 flex flex-col flex-1 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 bg-white px-4 sm:px-8 py-6 border-b-3 border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-800">Assignments</h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search assignments..."
            className="w-full sm:w-64 md:w-72"
          />
          <ButtonT
            onClick={handleAddAssignment}
            className="w-full sm:w-auto px-4 py-2 flex justify-center items-center gap-3"
          >
            <FiPlus size={20} />
            <span>Add Assignment</span>
          </ButtonT>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-8 pb-8 overflow-y-auto">
        {isLoading && <LoadingSpinner text="Loading assignments..." size="md" />}
        {error && (
          <div className="text-center py-10 text-red-600 bg-red-100 p-4 rounded-md">
            Error: {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            {assignments.length > 0 ? (
              <AssignmentsTable
                assignments={assignments}
                onEditAssignment={handleEditAssignment}
                onDeleteAssignment={handleDeleteAssignment}
                formatDate={formatDate}
                isLoading={isLoading}
                currentPage={currentPage}
              />
            ) : (
              <div className="px-6 py-10 text-center text-gray-500 bg-white shadow-md rounded-lg">
                No assignments found.
              </div>
            )}
          </>
        )}

        {assignments.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  return (
    <AssignmentsProvider>
      <AssignmentsPageContent />
    </AssignmentsProvider>
  );
}