"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AssignmentFormView from "@/app/admin/components/AssignmentFormView";
import { useAssignmentForm } from "@/app/admin/hooks/useAssignmentForm";
import ConfirmationModal from "@/app/admin/components/ConfirmationModal";

export default function EditAssignmentPage() {
  const params = useParams();
  const assignmentId = params.id as string;
  const router = useRouter();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    formData,
    setFormData,
    courses,
    lessons,
    subLessons,
    errors,
    isLoading,
    handleInputChange,
    handleSelect,
    handleCancel,
    handleUpdate,
    handleDeleteAssignment,
  } = useAssignmentForm("edit", assignmentId);

  useEffect(() => {
    const fetchAssignment = async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("description, solution, course_id, lesson_id, sub_lesson_id")
        .eq("id", assignmentId)
        .single();

      if (error || !data) return;

      setFormData({
        description: data.description,
        solution: data.solution,
        courseId: data.course_id,
        lessonId: data.lesson_id,
        subLessonId: data.sub_lesson_id,
      });
    };

    if (assignmentId) fetchAssignment();
  }, [assignmentId, setFormData]);

  return (
    <>
      <AssignmentFormView
        mode="edit"
        formData={formData}
        courses={courses}
        lessons={lessons}
        subLessons={subLessons}
        errors={errors}
        isLoading={isLoading}
        handleInputChange={handleInputChange}
        handleSelect={handleSelect}
        handleCancel={handleCancel}
        handleSubmit={handleUpdate}
        showBackButton={true}
        onBack={() => router.push("/admin/dashboard/assignments")}
        onDelete={() => setShowDeleteModal(true)}
      />

      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          title="Confirmation"
          message="Are you sure you want to delete this assignment?"
          confirmText="Yes, delete"
          cancelText="Cancel"
          onConfirm={handleDeleteAssignment}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
