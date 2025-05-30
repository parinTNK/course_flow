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

  const handleDeleteAssignment = useCallback((id: string) => {
    setAssignmentToDelete(id);
    setIsConfirmOpen(true);
  }, []);

  const { success, error: toastError } = useCustomToast();

  const confirmDeleteAssignment = useCallback(async () => {
    if (!assignmentToDelete) return;
    try {
      const response = await fetch(`/api/admin/assignments-delete/${assignmentToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete assignment");
      }

      success("Assignment deleted successfully", "The assignment has been removed.");
      fetchAssignments();
    } catch (err) {
      toastError("Failed to delete assignment", (err as Error).message);
    } finally {
      setIsConfirmOpen(false);
      setAssignmentToDelete(null);
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
        title="Delete Assignment"
        message={<span className="text-red-600">Are you sure you want to delete this assignment?</span>}
        confirmText="Yes, delete it"
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
