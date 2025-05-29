import React from "react";
import { Input } from "@/components/ui/input";
import { ButtonT } from "@/components/ui/ButtonT";
import { Label } from "@/components/ui/label";

interface AssignmentFormViewProps {
  formData: {
    description: string;
    solution: string;
    courseId: string;
    lessonId: string;
    subLessonId: string;
  };
  courses: { id: string; name: string }[];
  lessons: { id: string; title: string }[];
  subLessons: { id: string; title: string }[];
  errors: Record<string, string>;
  isLoading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelect: (field: string, value: string) => void;
  handleCancel: () => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function AssignmentFormView({
  formData,
  courses,
  lessons,
  subLessons,
  errors,
  isLoading,
  handleInputChange,
  handleSelect,
  handleCancel,
  handleSubmit,
}: AssignmentFormViewProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-8 bg-white px-8 py-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-800">
          Add Assignment
        </h1>
        <div className="flex items-center space-x-4">
          <ButtonT variant="Secondary" onClick={handleCancel}>
            Cancel
          </ButtonT>
          <ButtonT variant="primary" onClick={(e) => handleSubmit(e as any)}>
            {isLoading ? "Creating..." : "Create"}
          </ButtonT>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        className="bg-white mx-10 px-24 py-14 rounded-2xl space-y-6"
      >
        {/* Course */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="block font-medium text-[16px] mb-2">Course</Label>
            <select
              value={formData.courseId}
              onChange={(e) => handleSelect("courseId", e.target.value)}
              className="w-full border p-2 rounded-md text-[16px]"
            >
              <option value="">Place Holder</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="text-red-500 text-sm mt-1">{errors.courseId}</p>
            )}
          </div>
        </div>

        {/* Lesson + Sub-lesson */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-[16px] mb-2">Lesson</Label>
            <select
              value={formData.lessonId}
              onChange={(e) => handleSelect("lessonId", e.target.value)}
              className="w-full border p-2 rounded-md text-[16px]"
              disabled={!formData.courseId}
            >
              <option value="">Place Holder</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            {errors.lessonId && (
              <p className="text-red-500 text-sm mt-1">{errors.lessonId}</p>
            )}
          </div>

          <div>
            <Label className="text-[16px] mb-2">Sub-lesson</Label>
            <select
              value={formData.subLessonId}
              onChange={(e) => handleSelect("subLessonId", e.target.value)}
              className="w-full border p-2 rounded-md text-[16px]"
              disabled={!formData.lessonId}
            >
              <option value="">Place Holder</option>
              {subLessons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            {errors.subLessonId && (
              <p className="text-red-500 text-sm mt-1">
                {errors.subLessonId}
              </p>
            )}
          </div>
        </div>

        <hr className="my-6 border-gray-300" />

        {/* Assignment detail */}
        <h2 className="text-[20px] font-semibold text-[#646D89]">
          Assignment detail
        </h2>

        <div>
          <Label className="text-[16px] mb-2">Assignment *</Label>
          <Input
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter assignment description"
            minLength={5}
            maxLength={300}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <Label className="text-[16px] mb-2">Solution *</Label>
          <Input
            name="solution"
            value={formData.solution}
            onChange={handleInputChange}
            placeholder="Enter solution"
            maxLength={500}
          />
          {errors.solution && (
            <p className="text-red-500 text-sm mt-1">{errors.solution}</p>
          )}
        </div>
      </form>
    </>
  );
}
