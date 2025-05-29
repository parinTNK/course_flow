"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import MyAssignment from "@/components/learning/MyAssignment";
import { useAuth } from "@/app/context/authContext";
import LoadingSpinner from "../../admin/components/LoadingSpinner";
import { AlertCircle } from "lucide-react";
import Pagination from "../../admin/components/Pagination";
import { useRouter } from "next/navigation";
import { useDraft } from '@/app/context/draftContext';
import NavBar from "@/components/nav";
import DraftDialog from "@/components/common/DraftDialog";
import { useCustomToast } from "@/components/ui/CustomToast";
import SwipeableAssignmentTabs from "@/components/assignment/SwipeableAssignmentTabs";
import { getBangkokISOString } from "@/lib/bangkokTime";


type Assignment = {
  id: string;
  course_id: string;
  title: string;
  description: string;
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
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const ASSIGNMENTS_PER_PAGE = 4;

  // Remove global lastSaved, lastSavedAnswers, use per-assignment instead:
  // const [lastSaved, setLastSaved] = useState<string | null>(null);
  // const [lastSavedAnswers, setLastSavedAnswers] = useState<Record<string, string>>({});

  // Per-assignment lastSaved and lastSavedAnswers
  const [lastSaved, setLastSaved] = useState<Record<string, Date | null>>({});
  const [lastSavedAnswers, setLastSavedAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.user_id) {
      setAssignments([]);
      setLastSaved({});
      setLastSavedAnswers({});
      return;
    }
    // Only fetch assignments on first load or when user changes, not on every tab change
    setLoading(true);
    setError(null);

    axios
      .get(`/api/users/${user.user_id}/submission`)
      .then((res) => {
  const assignmentsWithSubmission: AssignmentWithSubmission[] = res.data.data || [];
  console.log("[Fetched assignmentsWithSubmission]:", assignmentsWithSubmission); 

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
  // Only depend on user?.user_id, not tab
  }, [user?.user_id]);


  const { dirtyAssignments, setDirty, clearDrafts } = useDraft();
  const router = useRouter();
  const { success, error: toastError } = useCustomToast();

  // Save all drafts helper (now uses local answers/user)
  const saveAllDrafts = useCallback(async () => {
    if (!user?.user_id || dirtyAssignments.size === 0) return;

    const bangkok = getBangkokISOString();

    const promises = Array.from(dirtyAssignments).map(async (assignmentId) => {
      const answer = answers[assignmentId];
      const status = answer.trim() === "" ? "pending" : "inprogress";
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
        // Update per-assignment lastSaved and lastSavedAnswers
        setLastSaved((prev) => ({ ...prev, [assignmentId]: new Date() }));
        setLastSavedAnswers((prev) => ({ ...prev, [assignmentId]: answer }));
      } catch (err) {
        console.error(`[Draft] Failed to save draft for ${assignmentId}`, err);
      }
    });

    await Promise.all(promises);
    clearDrafts();
  }, [dirtyAssignments, answers, user?.user_id, clearDrafts]);


  // Add modal state for navigation confirmation
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);

  // Helper to clear empty answers and set status to pending before navigation
  const clearEmptyAnswersAndSetPending = async () => {
    if (!user?.user_id) return;
    const bangkok = getBangkokISOString();
    const promises = Object.entries(answers)
      .filter(([assignmentId, val]) => val.trim() === "")
      .map(async ([assignmentId]) => {
        try {
          await axios.put(
            `/api/submission?assignmentId=${assignmentId}&userId=${user.user_id}`,
            {
              answer: "",
              status: "pending",
              updated_at: bangkok,
            }
          );
          setAssignments((prev) =>
            prev.map((a) =>
              a.id === assignmentId
                ? {
                    ...a,
                    submission: {
                      ...(a.submission || {
                        id: "",
                        assignment_id: assignmentId,
                        user_id: user?.user_id || "",
                        answer: "",
                        status: "pending",
                      }),
                      answer: "",
                      status: "pending",
                    },
                  }
                : a
            )
          );
        } catch (err) {
          // Optionally handle error
        }
      });
    await Promise.all(promises);
  };

  // Patch router.push to check for drafts using modal and handle empty answers
  const navigateWithDraftCheck = useCallback(
    async (to: string) => {
      // First, clear empty answers in backend
      await clearEmptyAnswersAndSetPending();
      if (dirtyAssignments.size > 0) {
        setPendingNav(to);
        setShowDraftModal(true);
      } else {
        router.push(to);
      }
    },
    [dirtyAssignments, router, clearEmptyAnswersAndSetPending]
  );

  // Handler for confirming draft save in modal
  const handleConfirmDraftSave = async () => {
    if (pendingNav) {
      await saveAllDrafts();
      setShowDraftModal(false);
      router.push(pendingNav);
      setPendingNav(null);
    }
  };

  // Handler for discarding draft save in modal
  const handleDiscardDraft = () => {
    if (pendingNav) {
      setShowDraftModal(false);
      router.push(pendingNav);
      setPendingNav(null);
    }
  };

  // Auto-save drafts every 30 seconds ONLY if answers changed since last save
useEffect(() => {
  const interval = setInterval(() => {
    const hasChanged = Array.from(dirtyAssignments).some(
      (assignmentId) =>
        answers[assignmentId] !== lastSavedAnswers[assignmentId]
    );

    if (dirtyAssignments.size > 0 && hasChanged) {
      saveAllDrafts(); // Only save when changed
    }
  }, 30000);

  return () => clearInterval(interval);
}, [dirtyAssignments, answers, lastSavedAnswers, saveAllDrafts]);

  // Warn on browser/tab close if drafts exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyAssignments.size > 0) {
        e.preventDefault();
        e.returnValue = "You have unsaved drafts. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirtyAssignments]);

  const filteredAssignments = assignments.filter((a) => {
    if (tab === "all") return true;
    if (tab === "pending") return a.submission?.status === "pending" || !a.submission;
    if (tab === "inprogress") return a.submission?.status === "inprogress";
    if (tab === "submitted") return a.submission?.status === "submitted";
    return true;
  });

  const totalPages = Math.ceil(filteredAssignments.length / ASSIGNMENTS_PER_PAGE);
  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * ASSIGNMENTS_PER_PAGE,
    currentPage * ASSIGNMENTS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredAssignments.length, totalPages]);

  

  // Move dirtyAssignments declaration above any useEffect or function that uses it

const handleChangeAnswer = (assignmentId: string, val: string) => {
  // Only update if changed
  setAnswers((prev) => {
    if (prev[assignmentId] === val) return prev;
    // Only set dirty if the answer actually changed
    setDirty(assignmentId);
    setAssignments((prevAssignments) =>
      prevAssignments.map((a) =>
        a.id === assignmentId && (!a.submission || a.submission.status !== "submitted")
          ? {
              ...a,
              submission: {
                ...(a.submission || {
                  id: "",
                  assignment_id: assignmentId,
                  user_id: user?.user_id || "",
                  answer: "",
                  status: "inprogress",
                }),
                status: "inprogress",
              },
            }
          : a
      )
    );
    return { ...prev, [assignmentId]: val };
  });
};

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
        console.log("[Submit] No existing submission found, creating new one...");
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
          updated_at: bangkok,
        }
      );

      if (!putRes.data?.data?.length) {
        console.log("[Reset] No existing submission found, creating new one...");
        await axios.post(`/api/submission`, {
          assignment_id: assignment.id,
          user_id: user.user_id,
          answer: "",
          status: "pending",
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

      success("Answer Cleared", "You can now submit a new answer.");
    } catch (err: any) {
      toastError("Reset Failed", err.message || "Failed to reset answer");
    }
  };

  // Listen for navigation events from MyAssignment
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail && typeof e.detail === "string") {
        navigateWithDraftCheck(e.detail);
      }
    };
    window.addEventListener("navigateWithDraftCheck", handler);
    return () => window.removeEventListener("navigateWithDraftCheck", handler);
  }, [navigateWithDraftCheck]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Pass navigateWithDraftCheck to NavBar */}
      <NavBar navigate={navigateWithDraftCheck} />
      {/* Draft confirmation modal */}
      <DraftDialog
        open={showDraftModal}
        onOpenChange={setShowDraftModal}
        onConfirm={handleConfirmDraftSave}
        onDiscard={handleDiscardDraft}
      />
      <main className="flex-1 pt-26 sm:pt-40">
        <div className="flex flex-col gap-6 sm:gap-8 w-full">
          <div className="w-full">
            <div className="flex flex-col w-full max-w-md mx-auto gap-10">
              <h1 className="text-center text-2xl font-semibold">
                My Assignments
              </h1>
              {/* Replace static tab buttons with swipeable tabs */}
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
                  <div key={assignment.id} className="flex justify-center mx-4 lg:mx-40 mb-6">
                    <MyAssignment
                      title={assignment.title}
                      subtitle={assignment.description}
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
                      // Pass lastSaved and lastSavedAnswer for this assignment
                      lastSaved={lastSaved[assignment.id]}
                      lastSavedAnswer={lastSavedAnswers[assignment.id]}
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
