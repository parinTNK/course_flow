"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { FullAssignment } from "@/types/Assignments";
import ConfirmationModal from "../components/ConfirmationModal";
import { useCustomToast } from "@/components/ui/CustomToast";

interface PaginationData {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface AssignmentsContextType {
  assignments: FullAssignment[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleDeleteAssignment: (id: string) => void;
  fetchAssignments: () => Promise<void>;
  currentPage: number;
  totalPages: number;
  assignmentsPerPage: number;
  setCurrentPage: (page: number) => void;
}

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

export const AssignmentsProvider = ({ children }: { children: ReactNode }) => {
  const [assignments, setAssignments] = useState<FullAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  const assignmentsPerPage = 10;

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: assignmentsPerPage.toString(),
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/assignments-list?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch assignments`);
      }

      const data = await response.json();
      setAssignments(data.assignments);
      setPagination(data.pagination);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, assignmentsPerPage, searchTerm]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const [isSecondConfirmOpen, setIsSecondConfirmOpen] = useState(false);

  const { success, error: toastError } = useCustomToast();

  const handleDeleteAssignment = useCallback((id: string) => {
    setAssignmentToDelete(id);
    setIsConfirmOpen(true);
  }, []);

  // Force Delete Assignment with Submission
  const deleteAssignmentById = useCallback(async () => {
    if (!assignmentToDelete) return;

    try {
      const res = await fetch(`/api/admin/assignments-delete/${assignmentToDelete}/force`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete assignment");
      }

      success("Assignment deleted successfully", "The assignment and its submissions were removed.");
      fetchAssignments();
    } catch (err) {
      toastError("Failed to delete assignment", (err as Error).message);
    } finally {
      setIsSecondConfirmOpen(false);
      setAssignmentToDelete(null);
    }
  }, [assignmentToDelete, fetchAssignments]);

  // Delete Assignment with No submission
  const confirmDeleteAssignment = useCallback(async () => {
    if (!assignmentToDelete) return;

    try {
      const res = await fetch(`/api/admin/assignment-has-submission?id=${assignmentToDelete}`);
      const result = await res.json();

      //modal check submission assignment
      if (result.hasSubmission) {
        setIsSecondConfirmOpen(true);
      } else {
        const response = await fetch(`/api/admin/assignments-delete/${assignmentToDelete}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete assignment");
        }

        success("Assignment deleted successfully", "The assignment has been removed.");
        fetchAssignments();
        setAssignmentToDelete(null);
      }
    } catch (err) {
      toastError("Failed to delete assignment", (err as Error).message);
    } finally {
      setIsConfirmOpen(false);
    }
  }, [assignmentToDelete, fetchAssignments]);

  const contextValue = useMemo(
    () => ({
      assignments,
      isLoading,
      error,
      searchTerm,
      setSearchTerm,
      handleDeleteAssignment,
      fetchAssignments,
      currentPage,
      totalPages: pagination.totalPages,
      assignmentsPerPage,
      setCurrentPage,
    }),
    [assignments, isLoading, error, searchTerm, handleDeleteAssignment, fetchAssignments, currentPage, pagination.totalPages, assignmentsPerPage]
  );

  return (
    <AssignmentsContext.Provider value={contextValue}>
      {children}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setAssignmentToDelete(null);
        }}
        onConfirm={confirmDeleteAssignment}
        title="Confirmation"
        message={<span className="">Are you sure you want to delete this assignment?</span>}
        confirmText={
          <span className="whitespace-nowrap">
            Yes, want to delete the assignment
          </span>
        }
        cancelText={
          <span className="whitespace-nowrap">
            No, keep it
          </span>
        }
        customModalSize="w-fit wax-w-full"
      />

      <ConfirmationModal
        isOpen={isSecondConfirmOpen}
        onClose={() => {
          setIsSecondConfirmOpen(false);
          setAssignmentToDelete(null);
        }}
        onConfirm={deleteAssignmentById}
        title="This assignment has submissions"
        message={
          <span className="text-red-600">
            Are you sure you want to permanently delete this assignment and all related submissions?
          </span>
        }
        confirmText="Yes, delete anyway"
        cancelText="Cancel"
      />
    </AssignmentsContext.Provider>
  );
};

export const useAssignmentsContext = () => {
  const context = useContext(AssignmentsContext);
  if (!context) {
    throw new Error("useAssignmentsContext must be used within an AssignmentsProvider");
  }
  return context;
};
