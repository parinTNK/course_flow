"use client";

import { useEffect, useState, useRef } from "react";
import { useLearning } from "./context/LearningContext";
import { useAuth } from "@/app/context/authContext";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LoadingSpinner from "@/app/admin/components/LoadingSpinner";
import { useCustomToast } from "@/components/ui/CustomToast";
import { getBangkokISOString } from "@/lib/bangkokTime";
import { ButtonT } from "@/components/ui/ButtonT";
import { useDraft } from "@/app/context/draftContext";

export default function Assignment() {
  const { currentLesson, setCurrentLesson } = useLearning();
  const { user } = useAuth();
  const { courseId } = useParams();
  const { success, error } = useCustomToast();

  // --- Draft logic ---
  const { dirtyAssignments, setDirty, clearDrafts } = useDraft?.() || {};
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastSavedAnswer, setLastSavedAnswer] = useState<string>("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  // --- End draft logic ---

  const [assignment, setAssignment] = useState<any>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<
    "pending" | "submitted" | "inprogress"
  >("pending");
  const [assignmentAnswer, setAssignmentAnswer] = useState("");
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFirstSubLessonIfNeeded = async () => {
      if (currentLesson?.id || !courseId || typeof courseId !== "string")
        return;

      const { data, error } = await supabase
        .from("lessons")
        .select("id, course_id, sub_lessons(*)")
        .eq("course_id", courseId)
        .order("order_no", { ascending: true })
        .limit(1)
        .single();

      if (error) {
        console.error("❌ Error fetching first sub-lesson via nested:", error);
        return;
      }

      if (data?.sub_lessons?.length > 0) {
        setCurrentLesson(data.sub_lessons[0]);
      }
    };

    fetchFirstSubLessonIfNeeded();
  }, [courseId, currentLesson?.id, setCurrentLesson]);

  useEffect(() => {
    const fetchAssignmentData = async () => {
      if (!currentLesson?.id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("assignments")
          .select("*")
          .eq("sub_lesson_id", currentLesson.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching assignment:", error);
          return;
        }

        setAssignment(data || null);
      } catch (e) {
        console.error("Assignment fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignmentData();
  }, [currentLesson?.id]);

  useEffect(() => {
    const checkExistingSubmission = async () => {
      if (!user?.user_id || !assignment?.id) return;

      const { data, error } = await supabase
        .from("submissions")
        .select("id, answer, created_at, updated_at, status")
        .eq("user_id", user.user_id)
        .eq("assignment_id", assignment.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking submission:", error);
        return;
      }

      if (data && typeof data.answer === "string") {
        setAssignmentAnswer(data.answer);
        setLastSavedAnswer(data.answer);
        setSubmittedAt(data.updated_at);

        if (data.status === "submitted") {
          setAssignmentStatus("submitted");
          if (data.updated_at) setLastSaved(new Date(data.updated_at));
        } else if (data.status === "inprogress" || data.answer.trim() !== "") {
          setAssignmentStatus("inprogress");
          if (data.updated_at) setLastSaved(new Date(data.updated_at));
        } else {
          setAssignmentStatus("pending");
          setLastSaved(null);
        }
      } else {
        setAssignmentStatus("pending");
        setAssignmentAnswer("");
        setLastSavedAnswer("");
        setSubmittedAt(null);
        setLastSaved(null); // Clear lastSaved when there's no data
      }
    };

    checkExistingSubmission();
  }, [user?.user_id, assignment?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAssignmentAnswer(e.target.value);
    if (assignment?.id) setDirty?.(assignment.id, e.target.value);
    if (assignmentStatus === "submitted") return;
    if (e.target.value.trim() === "") {
      setAssignmentStatus("pending");
    } else {
      setAssignmentStatus("inprogress");
    }
  };

  useEffect(() => {
    if (!assignment?.id || assignmentStatus === "submitted") return;
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);

    if (assignmentAnswer === lastSavedAnswer) {
      setAutoSaveStatus("idle");
      return;
    }

    setAutoSaveStatus("idle");
    autoSaveTimeout.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        if (!user?.user_id) return;
        const now = getBangkokISOString();
        const { data: existing, error: checkError } = await supabase
          .from("submissions")
          .select("id")
          .eq("assignment_id", assignment.id)
          .eq("user_id", user.user_id)
          .single();

        if (checkError && checkError.code !== "PGRST116") throw checkError;

        if (existing) {
          const { error: updateError } = await supabase
            .from("submissions")
            .update({
              answer: assignmentAnswer,
              updated_at: now,
              status: assignmentAnswer.trim() === "" ? "pending" : "inprogress",
            })
            .eq("id", existing.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("submissions")
            .insert([
              {
                assignment_id: assignment.id,
                user_id: user.user_id,
                answer: assignmentAnswer,
                status:
                  assignmentAnswer.trim() === "" ? "pending" : "inprogress",
                grade: null,
                created_at: now,
                updated_at: now,
                submission_date: null,
              },
            ]);
          if (insertError) throw insertError;
        }
        setLastSaved(new Date());
        setLastSavedAnswer(assignmentAnswer);
        setAutoSaveStatus("saved");
        if (
          typeof (success as any) === "function" &&
          (success as any).name === "info"
        ) {
          (success as any)("Auto-saved", "Your answer was auto-saved.");
        } else if ((useCustomToast() as any).info) {
          (useCustomToast() as any).info(
            "Auto-saved",
            "Your answer was auto-saved."
          );
        } else if ((useCustomToast() as any).success) {
          (useCustomToast() as any).success(
            "Auto-saved",
            "Your answer was auto-saved."
          );
        }
      } catch (e) {
        setAutoSaveStatus("error");
        error("Auto-save failed", "Could not auto-save your answer.");
      }
    }, 5000);

    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    };
  }, [assignmentAnswer, assignment?.id, assignmentStatus, user?.user_id]);

  const clearDraftIfAny = () => {
    if (assignment?.id) clearDrafts?.();
  };

  const handleSubmit = async () => {
    const now = getBangkokISOString();
    try {
      if (!user?.user_id) return;

      if (!assignment?.id) {
        error("Assignment not found");
        return;
      }

      if (!assignmentAnswer.trim()) {
        error(
          "Answer is required",
          "Please type your answer before submitting."
        );
        setAssignmentStatus("pending");
        return;
      }

      const { data: existingSubmission, error: checkError } = await supabase
        .from("submissions")
        .select("id")
        .eq("assignment_id", assignment.id)
        .eq("user_id", user.user_id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingSubmission) {
        const { error: updateError } = await supabase
          .from("submissions")
          .update({
            answer: assignmentAnswer,
            updated_at: now,
            submission_date: now,
            status: "submitted",
          })
          .eq("id", existingSubmission.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("submissions")
          .insert([
            {
              assignment_id: assignment.id,
              user_id: user.user_id,
              answer: assignmentAnswer,
              status: "submitted",
              grade: null,
              created_at: now,
              updated_at: now,
              submission_date: now,
            },
          ]);

        if (insertError) throw insertError;
      }

      setAssignmentStatus("submitted");
      setSubmittedAt(now);
      setLastSaved(new Date());
      setLastSavedAnswer(assignmentAnswer);
      clearDraftIfAny();
      success("Submission Successful", "Your answer has been saved.");
    } catch (err) {
      console.error("❌ Submission Error:", err);
      error("Submission Failed", "Please try again or check your input.");
    }
  };

  const handleReset = async () => {
    const now = getBangkokISOString();
    if (!user?.user_id || !assignment?.id) return;

    const { error: resetError } = await supabase
      .from("submissions")
      .update({
        answer: "",
        updated_at: now,
        status: "pending",
      })
      .eq("user_id", user.user_id)
      .eq("assignment_id", assignment.id);

    if (!resetError) {
      setAssignmentStatus("pending");
      setAssignmentAnswer("");
      setLastSaved(new Date());
      setLastSavedAnswer("");
      setSubmittedAt(null);
      clearDraftIfAny();
      success("Answer Cleared", "You can now submit a new answer.");
    } else {
      console.error("❌ Reset error:", resetError);
    }
  };

  if (!courseId || isLoading || !currentLesson?.id) {
    return (
      <div className="mt-8 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!assignment) return null;

  // --- Status tag logic ---
  let statusText = "Pending";
  let statusClass = "bg-yellow-100 text-yellow-800";
  if (assignmentStatus === "submitted") {
    statusText = "Submitted";
    statusClass = "bg-green-100 text-green-800";
  } else if (assignmentStatus === "inprogress") {
    statusText = "In Progress";
    statusClass = "bg-[#EBF0FF] text-[#3557CF]";
  }

  return (
    <div className="mt-8 px-4 py-6 sm:p-6 border rounded-lg bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Assignment</h2>
        <span className={`px-3 py-1 rounded-full text-sm w-fit ${statusClass}`}>
          {statusText}
        </span>
      </div>

      <p className="mb-4 text-sm text-gray-700">
        {assignment.description || "No Assignment"}
      </p>

      {assignmentStatus === "pending" || assignmentStatus === "inprogress" ? (
        <>
          <textarea
            className="w-full p-3 border rounded-lg mb-2 min-h-[120px] text-sm"
            value={assignmentAnswer}
            onChange={handleChange}
            placeholder="Answer..."
          />
          {/* Auto-save status */}
          {(autoSaveStatus === "saving" ||
            (autoSaveStatus === "saved" && lastSaved) ||
            autoSaveStatus === "error" ||
            (assignmentStatus === "inprogress" && lastSaved)) && (
            <div className="flex items-center gap-3 mb-1 min-h-[24px]">
              {autoSaveStatus === "saving" && (
                <span className="text-[#3557CF] text-xs">Saving...</span>
              )}
              {autoSaveStatus === "saved" && lastSaved && (
                <span className="text-[#646D89] text-xs">
                  Last saved: {lastSaved.toLocaleDateString()}{" "}
                  {lastSaved.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              )}
              {/* Always show lastSaved for inprogress */}
              {assignmentStatus === "inprogress" &&
                lastSaved &&
                autoSaveStatus !== "saved" && (
                  <span className="text-[#646D89] text-xs">
                    Last saved: {lastSaved.toLocaleDateString()}{" "}
                    {lastSaved.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                )}
              {autoSaveStatus === "error" && (
                <span className="text-red-500 text-xs">Auto-save failed</span>
              )}
            </div>
          )}
          {autoSaveStatus !== "saving" &&
            !(autoSaveStatus === "saved" && lastSaved) &&
            !(assignmentStatus === "inprogress" && lastSaved) &&
            autoSaveStatus !== "error" && (
              <div style={{ marginBottom: 0, minHeight: 0 }} />
            )}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <ButtonT
              variant="primary"
              className="w-full sm:w-auto"
              onClick={handleSubmit}
              disabled={!assignmentAnswer.trim()}
            >
              Send Assignment
            </ButtonT>
            <span className="text-xs text-gray-500 text-center sm:text-left">
              Assign within 2 days
            </span>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2 text-sm">Your Answer:</p>
            <p className="text-gray-700 whitespace-pre-line text-sm">
              {assignmentAnswer}
            </p>
            {submittedAt && (
              <p className="text-xs text-gray-500 mt-2">
                Updated At: {new Date(submittedAt).toLocaleString()}
              </p>
            )}
          </div>

          {assignment.solution && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="font-medium text-green-700 mb-2 text-sm">
                Answer Key:
              </p>
              <p className="text-green-800 whitespace-pre-line text-sm">
                {assignment.solution}
              </p>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full sm:w-fit mt-2 px-4 py-2 text-sm border border-orange-500 text-orange-500 rounded hover:bg-red-50"
          >
            Reset Answer
          </button>
        </div>
      )}
    </div>
  );
}
