"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import MyAssignment from "@/components/learning/MyAssignment";
import { useAuth } from "@/app/context/authContext";
import LoadingSpinner from "../../admin/components/LoadingSpinner";
import { AlertCircle } from "lucide-react";
import Pagination from "../../admin/components/Pagination";
import { useRouter } from "next/navigation";
import { useDraft } from "@/app/context/draftContext";
import NavBar from "@/components/nav";
import { useCustomToast } from "@/components/ui/CustomToast";
import SwipeableAssignmentTabs from "@/components/assignment/SwipeableAssignmentTabs";
import { getBangkokISOString } from "@/lib/bangkokTime";

type Assignment = {
  id: string;
  course_id: string;
  sub_lesson_id?: string;
  title: string;
  description: string;
  solution?: string;
  
  course_name?: string;
  lesson_title?: string;
  sub_lesson_title?: string;
};

type Submission = {
  id: string;
  assignment_id: string;
  user_id: string;
  answer: string;
  status: "pending" | "submitted" | "inprogress" | "overdue";
  submission_date?: string;
  updated_at?: string;
};

type AssignmentWithSubmission = Assignment & {
  submission?: Submission;
};

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "inprogress", label: "In Progress" },
  { key: "submitted", label: "Submitted" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function MyAssignmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<TabKey>("all");
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const ASSIGNMENTS_PER_PAGE = 4;

  const [lastSaved, setLastSaved] = useState<Record<string, Date | null>>({});
  const [lastSavedAnswers, setLastSavedAnswers] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!user?.user_id) {
      setAssignments([]);
      setLastSaved({});
      setLastSavedAnswers({});
      return;
    }
    setLoading(true);
    setError(null);

    axios
      .get(`/api/users/${user.user_id}/submission`)
      .then((res) => {
        const assignmentsWithSubmission: AssignmentWithSubmission[] =
          res.data.data || [];
        console.log(
          "[Fetched assignmentsWithSubmission]:",
          assignmentsWithSubmission
        );

        setAssignments(assignmentsWithSubmission);
        const initialAnswers: Record<string, string> = {};
        const initialLastSaved: Record<string, Date | null> = {};
        assignmentsWithSubmission.forEach((a) => {
          initialAnswers[a.id] = a.submission?.answer || "";
          initialLastSaved[a.id] = a.submission?.updated_at
            ? new Date(a.submission.updated_at)
            : null;
        });
        setAnswers(initialAnswers);
        setLastSaved(initialLastSaved);
        setLastSavedAnswers(initialAnswers);
        clearDrafts();
      })

      .catch((err) => {
        setError(err.message || "Failed to fetch assignments");
      })
      .finally(() => setLoading(false));
  }, [user?.user_id]);

  const draftContext = useDraft();
  const dirtyAssignments = draftContext?.dirtyAssignments ?? new Set();
  const setDirty = draftContext?.setDirty ?? (() => {});
  const clearDrafts = draftContext?.clearDrafts ?? (() => {});
  const router = useRouter();
  const { success, error: toastError } = useCustomToast();

  // Helper to update lastSaved and lastSavedAnswers for a single assignment
  const updateSavedState = (assignmentId: string, answer: string) => {
    setLastSaved((prev) => ({ ...prev, [assignmentId]: new Date() }));
    setLastSavedAnswers((prev) => ({ ...prev, [assignmentId]: answer }));
  };

  const saveDraft = useCallback(async (assignmentId: string, answer: string) => {
    if (!user?.user_id) return;
    // Do not save if answer is empty
    if (answer.trim() === "") return;
    const bangkok = getBangkokISOString();
    const status = "inprogress";
    try {
      const putRes = await axios.put(
        `/api/submission?assignmentId=${assignmentId}&userId=${user.user_id}`,
        {
          answer,
          status,
          updated_at: bangkok,
        }
      );
      if (!putRes.data?.data?.length) {
        await axios.post(`/api/submission`, {
          assignment_id: assignmentId,
          user_id: user.user_id,
          answer,
          status,
          submission_date: bangkok,
        });
      }
      updateSavedState(assignmentId, answer);
    } catch (err) {}
  }, [user?.user_id]);

  const saveAllDrafts = useCallback(async () => {
    if (!user?.user_id || dirtyAssignments.size === 0) return;

    const bangkok = getBangkokISOString();

    const promises = Array.from(dirtyAssignments).map(async (assignmentId) => {
      const answer = answers[assignmentId];
      // Do not save if answer is empty
      if (answer.trim() === "") return;
      const status = "inprogress";
      try {
        const putRes = await axios.put(
          `/api/submission?assignmentId=${assignmentId}&userId=${user.user_id}`,
          {
            answer,
            status,
            updated_at: bangkok,
          }
        );

        if (!putRes.data?.data?.length) {
          await axios.post(`/api/submission`, {
            assignment_id: assignmentId,
            user_id: user.user_id,
            answer,
            status,
            submission_date: bangkok,
          });
        }
        updateSavedState(assignmentId, answer);
      } catch (err) {
        console.error(`[Draft] Failed to save draft for ${assignmentId}`, err);
      }
    });

    await Promise.all(promises);
    clearDrafts();
  }, [dirtyAssignments, answers, user?.user_id, clearDrafts]);

  useEffect(() => {
    const interval = setInterval(() => {
      const hasChanged = Array.from(dirtyAssignments).some(
        (assignmentId) =>
          answers[assignmentId] !== lastSavedAnswers[assignmentId]
      );

      if (dirtyAssignments.size > 0 && hasChanged) {
        saveAllDrafts();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [dirtyAssignments, answers, lastSavedAnswers, saveAllDrafts]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyAssignments.size > 0) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved drafts. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirtyAssignments]);

  const filteredAssignments = assignments.filter((a) => {
    if (tab === "all") return true;
    if (tab === "pending")
      return a.submission?.status === "pending" || !a.submission;
    if (tab === "inprogress") return a.submission?.status === "inprogress";
    if (tab === "submitted") return a.submission?.status === "submitted";
    return true;
  });

  const totalPages = Math.ceil(
    filteredAssignments.length / ASSIGNMENTS_PER_PAGE
  );
  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * ASSIGNMENTS_PER_PAGE,
    currentPage * ASSIGNMENTS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredAssignments.length, totalPages]);

  // Remove immediate save from handleChangeAnswer
  const handleChangeAnswer = (assignmentId: string, val: string) => {
    setAnswers((prev) => {
      if (prev[assignmentId] === val) return prev;
      setDirty(assignmentId, val);
      if (typeof window !== "undefined") {
        window.__draftAnswers ??= {};
        window.__draftAnswers[assignmentId] = val;
      }
      return { ...prev, [assignmentId]: val };
    });
  };

  React.useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {};

    Object.keys(answers).forEach((assignmentId) => {
      // Only auto-save if answer is not empty and has changed
      if (
        answers[assignmentId] !== lastSavedAnswers[assignmentId] &&
        answers[assignmentId] !== undefined &&
        answers[assignmentId].trim() !== ""
      ) {
        if (timers[assignmentId]) clearTimeout(timers[assignmentId]);
        timers[assignmentId] = setTimeout(() => {
          saveDraft(assignmentId, answers[assignmentId]);
        }, 5000);
      }
    });

    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, [answers, lastSavedAnswers, saveDraft]);

  const handleSubmit = async (assignment: AssignmentWithSubmission) => {
    console.log("[Submit] assignment.id:", assignment.id);
    console.log("[Submit] full submission:", assignment.submission);

    if (!user?.user_id) {
      alert("User not logged in.");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [assignment.id]: true }));

    const bangkok = getBangkokISOString();

    try {
      const putRes = await axios.put(
        `/api/submission?assignmentId=${assignment.id}&userId=${user.user_id}`,
        {
          answer: answers[assignment.id] ?? "",
          status: "submitted",
          updated_at: bangkok,
          submission_date: bangkok,
        }
      );

      if (!putRes.data?.data?.length) {
        console.log(
          "[Submit] No existing submission found, creating new one..."
        );
        await axios.post(`/api/submission`, {
          assignment_id: assignment.id,
          user_id: user.user_id,
          answer: answers[assignment.id] ?? "",
          status: "submitted",
          submission_date: bangkok,
        });
      }

      const res = await axios.get(`/api/users/${user.user_id}/submission`);
      setAssignments(res.data.data || []);

      const updatedAnswers: Record<string, string> = {};
      const updatedLastSaved: Record<string, Date | null> = {};
      (res.data.data || []).forEach((a: AssignmentWithSubmission) => {
        updatedAnswers[a.id] = a.submission?.answer || "";
        updatedLastSaved[a.id] = a.submission?.updated_at
          ? new Date(a.submission.updated_at)
          : null;
      });
      setAnswers(updatedAnswers);
      setLastSaved(updatedLastSaved);
      setLastSavedAnswers(updatedAnswers);

      success("Submission Successful", "Your answer has been saved.");
    } catch (err: any) {
      toastError("Submission Failed", err.message || "Failed to submit answer");
    } finally {
      setSubmitting((prev) => ({ ...prev, [assignment.id]: false }));
    }
  };

  const handleReset = async (assignment: AssignmentWithSubmission) => {
    console.log("[Reset] assignment.id:", assignment.id);
    console.log("[Reset] full submission:", assignment.submission);

    if (!user?.user_id) {
      alert("User not logged in.");
      return;
    }

    const bangkok = getBangkokISOString();

    try {
      const putRes = await axios.put(
        `/api/submission?assignmentId=${assignment.id}&userId=${user.user_id}`,
        {
          answer: "",
          status: "pending",
          updated_at: null, // set updated_at to null
        }
      );

      if (!putRes.data?.data?.length) {
        console.log(
          "[Reset] No existing submission found, creating new one..."
        );
        await axios.post(`/api/submission`, {
          assignment_id: assignment.id,
          user_id: user.user_id,
          answer: "",
          status: "pending",
          submission_date: bangkok,
          updated_at: null, // set updated_at to null
        });
      }

      const res = await axios.get(`/api/users/${user.user_id}/submission`);
      setAssignments(res.data.data || []);

      const updatedAnswers: Record<string, string> = {};
      const updatedLastSaved: Record<string, Date | null> = {};
      (res.data.data || []).forEach((a: AssignmentWithSubmission) => {
        updatedAnswers[a.id] = a.submission?.answer || "";
        updatedLastSaved[a.id] = a.submission?.updated_at
          ? new Date(a.submission.updated_at)
          : null;
      });
      setAnswers(updatedAnswers);
      setLastSaved(updatedLastSaved);
      setLastSavedAnswers(updatedAnswers);
      setLastSaved((prev) => ({ ...prev, [assignment.id]: null }));

      success("Answer Cleared", "You can now submit a new answer.");
    } catch (err: any) {
      toastError("Reset Failed", err.message || "Failed to reset answer");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <NavBar navigate={router.push} />
      <main className="flex-1 pt-26 sm:pt-40">
        <div className="flex flex-col gap-6 sm:gap-8 w-full">
          <div className="w-full">
            <div className="flex flex-col w-full max-w-md mx-auto gap-10">
              <h1 className="text-center text-2xl font-semibold">
                My Assignments
              </h1>
              <SwipeableAssignmentTabs tab={tab} setTab={setTab} />
            </div>
          </div>
          <div className="flex flex-col w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <LoadingSpinner text="Loading assignments..." size="md" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-8 flex flex-col items-center shadow-sm">
                  <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                  <span className="text-red-600 font-semibold text-lg mb-1">
                    Unable to load your assignments
                  </span>
                  <span className="text-gray-500 text-sm text-center">
                    {error}
                  </span>
                </div>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center text-gray-400 py-20">
                No assignments found.
              </div>
            ) : (
              <>
                {paginatedAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex justify-center mx-4 lg:mx-40 mb-6"
                  >
                    <MyAssignment
                      title={`Course: ${assignment.course_name}`}
                      subtitle={`${assignment.lesson_title}: ${assignment.sub_lesson_title}`}
                      question={assignment.description}
                      status={
                        assignment.submission?.status === "inprogress"
                          ? "in progress"
                          : assignment.submission?.status ?? "pending"
                      }
                      answer={answers[assignment.id] || ""}
                      onChangeAnswer={(val) =>
                        handleChangeAnswer(assignment.id, val)
                      }
                      onSubmit={() => handleSubmit(assignment)}
                      onReset={
                        assignment.submission &&
                        assignment.submission.status === "submitted"
                          ? () => handleReset(assignment)
                          : undefined
                      }
                      disabled={submitting[assignment.id]}
                      courseId={assignment.course_id}
                      subLessonId={assignment.sub_lesson_id ?? ""}
                      lastSaved={lastSaved[assignment.id]}
                      lastSavedAnswer={lastSavedAnswers[assignment.id]}
                      solution={assignment.solution} 
                    />
                  </div>
                ))}
                <div className="mt-[26px] mb-[50px]">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
