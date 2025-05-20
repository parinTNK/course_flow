"use client";

import { useEffect, useState } from "react";
import { useLearning } from "./context/LearningContext";
import { useAuth } from "@/app/context/authContext";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LoadingSpinner from "@/app/admin/components/LoadingSpinner";
import { useCustomToast } from "@/components/ui/CustomToast";
import { getBangkokISOString } from "@/lib/bangkokTime";

export default function Assignment() {
  const { currentLesson, setCurrentLesson } = useLearning();
  const { user } = useAuth();
  const { courseId } = useParams();
  const { success, error } = useCustomToast();

  const [assignment, setAssignment] = useState<any>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<"pending" | "submitted">("pending");
  const [assignmentAnswer, setAssignmentAnswer] = useState("");
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFirstSubLessonIfNeeded = async () => {
      if (currentLesson?.id || !courseId || typeof courseId !== "string") return;

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
        .select("id, answer, created_at, updated_at")
        .eq("user_id", user.user_id)
        .eq("assignment_id", assignment.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking submission:", error);
        return;
      }

      if (data && data.answer && data.answer.trim() !== "") {
        setAssignmentStatus("submitted");
        setAssignmentAnswer(data.answer);
        setSubmittedAt(data.updated_at); 
      } else {
        setAssignmentStatus("pending");
        setAssignmentAnswer("");
        setSubmittedAt(null);
      }
    };


    checkExistingSubmission();
  }, [user?.user_id, assignment?.id]);

  const handleSubmit = async () => {
  const now = getBangkokISOString();
  try {
    if (!user?.user_id) return;

    if (!assignment?.id) {
      error("Assignment not found");
      return;
    }

    if (!assignmentAnswer.trim()) {
      error("Answer is required", "Please type your answer before submitting.");
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
        .insert([{
          assignment_id: assignment.id,
          user_id: user.user_id,
          answer: assignmentAnswer,
          status: "submitted",
          grade: null,
          created_at: now,
          updated_at: now,
          submission_date: now,
        }]);

      if (insertError) throw insertError;
    }

    setAssignmentStatus("submitted");
    setSubmittedAt(now);
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
      setSubmittedAt(null);
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

  return (
    <div className="mt-8 p-6 border rounded-lg bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Assignment</h2>
        <span className={`px-3 py-1 rounded-full text-sm ${assignmentStatus === "submitted" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
          {assignmentStatus === "submitted" ? "Submitted" : "Pending"}
        </span>
      </div>

      <p className="mb-4">{assignment.description || "No Assignment"}</p>

      {assignmentStatus === "pending" ? (
        <>
          <textarea
            className="w-full p-3 border rounded-lg mb-4 min-h-[120px]"
            value={assignmentAnswer}
            onChange={(e) => setAssignmentAnswer(e.target.value)}
            placeholder="Answer..."
          />
          <div className="flex justify-between items-center">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={handleSubmit}
            >
              Send Assignment
            </button>
            <span className="text-sm text-gray-500">Assign within 2 days</span>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2">Your Answer:</p>
            <p className="text-gray-700 whitespace-pre-line">{assignmentAnswer}</p>
            {submittedAt && (
              <p className="text-xs text-gray-500 mt-2">Update At: {new Date(submittedAt).toLocaleString()}</p>
            )}
          </div>

          {assignment.solution && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="font-medium text-green-700 mb-2">Answer Key:</p>
              <p className="text-green-800 whitespace-pre-line">{assignment.solution}</p>
            </div>
          )}

          <button
            onClick={handleReset}
            className="mt-2 px-4 py-2 text-sm border border-orange-500 text-orange-500 rounded hover:bg-red-50"
          >
            Reset Answer
          </button>
        </div>
      )}
    </div>
  );
}
