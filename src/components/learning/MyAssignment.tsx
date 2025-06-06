import React, { useState, useRef } from "react";
import { ButtonT } from "@/components/ui/ButtonT";
import LoadingSpinner from "@/app/admin/components/LoadingSpinner";
import { useCustomToast } from "@/components/ui/CustomToast";
import { useRouter } from "next/navigation";

type MyAssignmentProps = {
  title: string;
  subtitle: string;
  question: string;
  status: "pending" | "submitted" | "in progress" | "overdue";
  answer: string;
  onChangeAnswer: (val: string) => void;
  onSubmit: () => void;
  onReset?: () => void;
  disabled?: boolean;
  courseId: string; 
  subLessonId: string; 
  onAutoSave?: () => void; 
  lastSaved?: Date | null;
  lastSavedAnswer?: string;
  solution?: string; 
};

export default function MyAssignment({
  title,
  subtitle,
  question,
  status,
  answer,
  onChangeAnswer,
  onSubmit,
  onReset,
  disabled = false,
  courseId,
  subLessonId,
  onAutoSave, 
  lastSaved: propLastSaved,
  lastSavedAnswer: propLastSavedAnswer,
  solution, 
}: MyAssignmentProps) {

  const router = useRouter();

  const normalizedStatus = status.replace(" ", "").toLowerCase() as
    | "submitted"
    | "inprogress"
    | "pending"
    | "overdue";

  const statusTextMap: Record<string, string> = {
    submitted: "Submitted",
    inprogress: "In Progress",
    pending: "Pending",
    overdue: "Overdue",
  };

  const statusStyleMap: Record<string, string> = {
    submitted: "bg-green-100 text-green-800",
    inprogress: "bg-[#EBF0FF] text-[#3557CF]",
    pending: "bg-yellow-100 text-yellow-800",
    overdue: "bg-red-100 text-red-800",
  };

  const statusText = statusTextMap[normalizedStatus] ?? "Pending";
  const statusStyle =
    statusStyleMap[normalizedStatus] ?? "bg-gray-100 text-gray-800";

  const {
    error: toastError,
    success: toastSuccess,
    info: toastInfo,
  } = useCustomToast();
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(normalizedStatus);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const handleLocalSubmit = async () => {
    if (!answer.trim()) {
      setLocalError("Answer is required");
      toastError(
        "Answer is required",
        "Please type your answer before submitting."
      );
      setLocalStatus("pending");
      return;
    }
    setLocalError(null);
    setLoading(true);
    try {
      await Promise.resolve(onSubmit());
      setLocalStatus("submitted");
    } finally {
      setLoading(false);
    }
  };

  const handleLocalReset = async () => {
    setLoading(true);
    try {
      await Promise.resolve(onReset?.());
      setLocalStatus("pending");
    } finally {
      setLoading(false);
    }
  };

const handleOpenInCourse = (e: React.MouseEvent) => {
  e.preventDefault();
  router.push(`/course-learning/${courseId}/learning/${subLessonId}`);
};

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalError(null);
    const val = e.target.value;
    onChangeAnswer(val);
    if (val.trim().length === 0) {
      setLocalStatus("pending");
    } else {
      setLocalStatus("inprogress");
    }
  };

  React.useEffect(() => {
    if (normalizedStatus === "submitted") return;
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);

    if (answer === propLastSavedAnswer) {
      setAutoSaveStatus("idle");
      return;
    }

    if (!answer.trim()) {
      setAutoSaveStatus("idle");
      return;
    }

    setAutoSaveStatus("idle");
    autoSaveTimeout.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        if (onAutoSave) {
          await Promise.resolve(onAutoSave());
        }
        setAutoSaveStatus("saved");
        toastInfo?.("Auto-saved", "Your answer was auto-saved.");
      } catch (e) {
        setAutoSaveStatus("error");
        toastError("Auto-save failed", "Could not auto-save your answer.");
      }
    }, 30000);

    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    };

  }, [answer, propLastSavedAnswer, normalizedStatus, onAutoSave]);

  React.useEffect(() => {
    setLocalStatus(normalizedStatus);
  }, [normalizedStatus]);

  return (
    <div className="bg-[#E5ECF8] rounded-lg py-4 sm:py-10 flex flex-col gap-0 w-[343px] h-auto sm:w-[1120px]  ">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start px-6 sm:px-[96px] gap-2 sm:gap-0">
        <div>
          <div className="font-medium text-[20px] sm:text-[24px] mb-2 leading-tight">
            {title}
          </div>
          <div className="text-[14px] sm:text-[16px] mb-2 sm:mb-4 text-[#7c88a6]">
            {subtitle}
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-md mb-4 text-[12px] sm:text-[16px] font-medium h-fit max-w-[90px] sm:max-w-[120px] text-center ${
            statusStyleMap[localStatus] ?? "bg-gray-100 text-gray-800"
          }`}
        >
          {statusTextMap[localStatus] ?? "Pending"}
        </span>
      </div>

      <div
        className={`bg-white rounded-lg flex flex-col px-[16px] sm:px-[24px] py-1 gap-1 mx-[16px] lg:mx-[96px] w-[311px] sm:w-[auto] lg:w-[928px] h-auto justify-center border-1 border-[#D6D9E4] `}
      >
        <div className="text-[16px] mt-4 sm:mt-6 font-base">{question}</div>
        {localStatus === "inprogress" && propLastSaved && (
          <div className="flex items-center gap-3 mb-1 min-h-[24px]">
            <span className="text-[#646D89] text-xs">
              Last saved: {new Date(propLastSaved).toLocaleDateString()}{" "}
              {new Date(propLastSaved).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        )}
        {/* Show auto-save status only if saving or error */}
        {(autoSaveStatus === "saving" || autoSaveStatus === "error") &&
          localStatus !== "submitted" && (
            <div className="flex items-center gap-3 mb-1 min-h-[24px]">
              {autoSaveStatus === "saving" && (
                <span className="text-[#3557CF] text-xs">Saving...</span>
              )}
              {autoSaveStatus === "error" && (
                <span className="text-red-500 text-xs">Auto-save failed</span>
              )}
            </div>
          )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Mobile: show readonly answer block if submitted, else textarea */}
          {normalizedStatus === "submitted" ? (
            <div className="block sm:hidden w-full">
              <div className=" text-[#646D89] rounded-lg p-4 min-h-[60px] text-base whitespace-pre-line break-words">
                {answer || (
                  <span className="text-[#bfc6db]">No answer submitted.</span>
                )}
              </div>
            </div>
          ) : null}
          {/* Show textarea on desktop always, and on mobile if not submitted */}
          {(normalizedStatus !== "submitted" || window.innerWidth >= 640) && (
            <>
              <textarea
                className={`w-full p-4 rounded-lg min-h-[120px] sm:mb-6 text-base placeholder:text-[#bfc6db] focus:outline-[#2957c2] resize-none ${
                  normalizedStatus === "submitted"
                    ? "hidden sm:block text-[#9AA1B9] font-normal border-0"
                    : "text-gray-700 border border-[#e0e4ef]"
                }`}
                placeholder="Answer..."
                value={answer}
                onChange={handleTextareaChange}
                disabled={disabled || normalizedStatus === "submitted"}
                style={
                  normalizedStatus === "submitted" ? { fontSize: 16 } : undefined
                }
              />
            </>
          )}
          <div className="flex flex-col items-center gap-2 mb-4 sm:mb-0">
            {localError && (
              <div className="text-red-500 text-sm mb-1">{localError}</div>
            )}
            {loading ? (
              <div className="flex items-center justify-center min-w-[140px] min-h-[48px]">
                <LoadingSpinner size="sm" text="" />
              </div>
            ) : normalizedStatus === "submitted" && onReset ? (
              <button
                className="w-full border border-orange-500 text-orange-500 hover:bg-red-50 px-10 py-4 rounded-xl font-semibold text-lg transition disabled:opacity-60 shadow-md cursor-pointer"
                disabled={disabled}
                onClick={handleLocalReset}
                style={{ minWidth: 140 }}
              >
                Reset
              </button>
            ) : (
              <ButtonT
                className="w-full bg-[#2957c2] text-white px-10 py-4 rounded-xl font-semibold text-lg transition disabled:opacity-60 shadow-md min-w-[140px]"
                disabled={
                  disabled || normalizedStatus === "submitted" || !answer.trim()
                }
                onClick={handleLocalSubmit}
              >
                Submit
              </ButtonT>
            )}
            <a
              href={`/course-learning/${courseId}/learning/${subLessonId}`}
              className="text-[#2957c2] text-base mt-3 sm:mt-2 w-fit font-semibold cursor-pointer"
              onClick={handleOpenInCourse}
            >
              Open in Course
            </a>
          </div>
        </div>
      </div>
      {/* Show answer key below the white box if submitted and available */}
      {normalizedStatus === "submitted" && solution && (
        <div
          className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 mt-4 mx-[16px] lg:mx-[96px] w-[311px] sm:w-[auto] lg:w-[928px]"
        >
          <button
            className="flex items-center gap-2 font-medium text-green-700 mb-2 text-sm focus:outline-none cursor-pointer"
            onClick={() => setShowSolution((v) => !v)}
            aria-expanded={showSolution}
            aria-controls="answer-key-content"
            type="button"
          >
            <span>
              {showSolution ? "Hide Answer Key" : "Show Answer Key"}
            </span>
            <svg
              className={`transition-transform duration-200 w-4 h-4 ${showSolution ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showSolution && (
            <div
              id="answer-key-content"
              className="text-green-800 whitespace-pre-line text-sm"
            >
              {solution}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
