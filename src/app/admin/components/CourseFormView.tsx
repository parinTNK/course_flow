import React from 'react';
import { ButtonT } from '@/components/ui/ButtonT';
import { PromoCodeSection } from '@/app/admin/components/PromoCodeSection';
import { CourseFormData, Lesson, PromoCode } from '@/types/courseAdmin'; // Added PromoCode
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableRow } from './SortableRow'; // Adjusted import
import { useRouter } from 'next/navigation';

interface CourseFormViewProps {
  formData: CourseFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  coverPreview: string;
  coverRef: React.RefObject<HTMLInputElement>;
  lessons: Lesson[];
  allPromoCodes: PromoCode[]; // Added
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleCoverClick: () => void;
  handleCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent, status: 'draft' | 'published', validateNameOnlyFlag?: boolean) => void;
  handleCancel: () => void;
  handleAddLesson: () => void;
  handleDeleteLesson: (id: number) => void;
  handleEditLesson: (id: number) => void;
  handleDragEndLessons: (event: DragEndEvent) => void;
  handlePromoCodeChange: (selectedPromoCode: PromoCode | null) => void; // Added
  showError?: (title: string, description?: string) => void; // Added optional showError
  dndSensors: any; // Type properly from @dnd-kit/core if possible
}

export const CourseFormView: React.FC<CourseFormViewProps> = ({
  formData, errors, isLoading, coverPreview, coverRef, lessons, allPromoCodes, // Added allPromoCodes
  handleInputChange, handleCoverClick, handleCoverChange, handleSubmit, handleCancel,
  handleAddLesson, handleDeleteLesson, handleEditLesson, handleDragEndLessons, 
  handlePromoCodeChange, showError, // Added handlePromoCodeChange and showError
  dndSensors
}) => {
  const router = useRouter();
  
  return (
    <>
      <div className="flex justify-between items-center mb-8 bg-white px-8 py-6 border-b-3 border-gray-200">
        <div className="flex items-center">
          <ButtonT 
            variant="ghost" 
            className="w-auto h-auto px-3 py-2 mx-2"
            onClick={() => router.push('/admin/dashboard')}
          >
            ← Back to Courses
          </ButtonT>
          <h1 className="text-3xl font-semibold text-gray-800 ml-4">{formData.id ? 'Edit Course' : 'Add Course'}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <ButtonT variant="Secondary" className="w-[149px] h-[32px]" onClick={handleCancel}>
            Cancel
          </ButtonT>
          <ButtonT
            variant="primary"
            className="w-[149px] h-[32px]"
            onClick={(e) => handleSubmit(e, 'published')}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : formData.id ? 'Update' : 'Create'}
          </ButtonT>
        </div>
      </div>

      <div className="bg-geay-50 flex-1">
        <form className="space-y-6" onSubmit={(e) => handleSubmit(e, 'published')}>
          <div className="bg-white p-8 mx-8 border-b-3 rounded-2xl">
            {/* Course Name */}
            <div className="space-y-2">
              <label htmlFor="course-name" className="block text-sm font-medium">
                Course name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="course-name"
                placeholder="Enter course name"
                className={`w-full px-4 py-2 border rounded-md ${errors['course-name'] ? 'border-red-500' : ''}`}
                value={formData.name}
                onChange={handleInputChange}
              />
              {errors['course-name'] && <p className="text-red-500 text-xs">{errors['course-name']}</p>}
            </div>

            {/* Price & Learning Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <label htmlFor="price" className="block text-sm font-medium">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  placeholder="Enter price"
                  className={`w-full px-4 py-2 border rounded-md ${errors['price'] ? 'border-red-500' : ''}`}
                  value={formData.price}
                  onChange={handleInputChange}
                />
                {errors['price'] && <p className="text-red-500 text-xs">{errors['price']}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="learning-time" className="block text-sm font-medium">
                  Total learning time <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="learning-time"
                  placeholder="Enter total time in minutes"
                  className={`w-full px-4 py-2 border rounded-md ${errors['learning-time'] ? 'border-red-500' : ''}`}
                  value={formData.total_learning_time}
                  onChange={handleInputChange}
                />
                {errors['learning-time'] && <p className="text-red-500 text-xs">{errors['learning-time']}</p>}
              </div>
            </div>
            
            <div className="mt-4">
                <PromoCodeSection 
                  initialPromoCodeId={formData.promo_code_id}
                  allPromoCodes={allPromoCodes}
                  onChange={handlePromoCodeChange}
                  showError={showError} // Pass down showError if you want to use a centralized error display
                />
            </div>


            {/* Course Summary */}
            <div className="space-y-2 mt-4">
              <label htmlFor="course-summary" className="block text-sm font-medium">
                Course summary <span className="text-red-500">*</span>
              </label>
              <textarea
                id="course-summary"
                placeholder="Enter course summary"
                className={`w-full px-4 py-2 border rounded-md h-24 ${errors['course-summary'] ? 'border-red-500' : ''}`}
                value={formData.summary}
                onChange={handleInputChange}
              />
              {errors['course-summary'] && <p className="text-red-500 text-xs">{errors['course-summary']}</p>}
            </div>

            {/* Course Detail */}
            <div className="space-y-2 mt-4">
              <label htmlFor="course-detail" className="block text-sm font-medium">
                Course detail <span className="text-red-500">*</span>
              </label>
              <textarea
                id="course-detail"
                placeholder="Enter course details"
                className={`w-full px-4 py-2 border rounded-md h-36 ${errors['course-detail'] ? 'border-red-500' : ''}`}
                value={formData.detail}
                onChange={handleInputChange}
              />
              {errors['course-detail'] && <p className="text-red-500 text-xs">{errors['course-detail']}</p>}
            </div>

            {/* Cover Image */}
            <div className="space-y-2 mt-4">
              <label className="block text-sm font-medium">
                Cover image <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500">Supported file types: .jpg, .png, .jpeg. Max file size: 5 MB</p>
              <input ref={coverRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleCoverChange} />
              <div onClick={handleCoverClick} className="w-[240px] h-[240px] flex items-center justify-center cursor-pointer rounded-lg p-4 text-center bg-[#F6F7FC]">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-contain rounded-md" />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    <p className="mt-2 text-sm text-blue-500">Upload Image</p>
                  </div>
                )}
              </div>
              {errors.coverImage && <p className="text-red-500 text-xs">{errors.coverImage}</p>}
            </div>

            {/* Video Trailer (Placeholder UI) */}
            <div className="space-y-2 mt-4">
              <label className="block text-sm font-medium">Video Trailer <span className="text-red-500">*</span></label>
              <p className="text-xs text-gray-500">Supported file types: .mp4, .mov, .avi Max file size: 20 MB</p>
              <div className="w-[240px] h-[240px] flex items-center justify-center cursor-pointer rounded-lg p-8 text-center bg-[#F6F7FC]">
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  <p className="mt-2 text-sm text-blue-500">Upload Video</p>
                </div>
              </div>
              {/* Add error display for video trailer if needed */}
            </div>

            {/* Attach File (Placeholder UI) */}
            <div className="space-y-2 mt-4">
              <label className="block text-sm font-medium">Attach File (Optional)</label>
              <div className="w-[180px] h-[180px] flex items-center justify-center cursor-pointer rounded-lg p-6 text-center bg-[#F6F7FC]">
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  <p className="mt-2 text-sm text-blue-500">Upload file</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Section */}
          <div className="bg-white p-8 mx-8 border-b-3 rounded-2xl">
            <div className="flex justify-between items-center">
              <p className="text-[24px] text-[#2A2E3F]">Lesson</p>
              <ButtonT
                variant="primary"
                className={`w-[171px] h-[32px] ${!formData.name.trim() ? 'opacity-50 cursor-not-allowed bg-gray-400 border-gray-400' : ''}`}
                onClick={handleAddLesson}
                disabled={!formData.name.trim() || isLoading}
              >
                + Add Lesson
              </ButtonT>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEndLessons}>
                  <table className="min-w-full divide-y divide-gray-200 overflow-hidden">
                    <thead>
                      <tr>
                        <th scope="col" className="w-12 px-2 py-3 bg-[#E8EAEF] text-left"></th>
                        <th scope="col" className="px-6 py-3 w-3/5 bg-[#E8EAEF] text-left text-sm font-medium text-gray-700">Lesson name</th>
                        <th scope="col" className="px-6 py-3 w-1/4 bg-[#E8EAEF] text-left text-sm font-medium text-gray-700">Sub-lesson</th>
                        <th scope="col" className="px-6 py-3 bg-[#E8EAEF] text-left text-sm font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                        {lessons.length > 0 ? (
                          lessons.map((lesson) => (
                            <SortableRow
                              key={lesson.id}
                              lesson={lesson}
                              onDelete={handleDeleteLesson}
                              onEdit={handleEditLesson}
                            />
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                              No lessons yet. Click "Add Lesson" to create your first lesson.
                            </td>
                          </tr>
                        )}
                      </SortableContext>
                    </tbody>
                  </table>
                </DndContext>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6 px-8">
            <ButtonT
              variant="Secondary"
              className="mr-4 w-[169px]"
              onClick={(e) => handleSubmit(e, 'draft', true)}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Draft'}
            </ButtonT>
          </div>
        </form>
      </div>
    </>
  );
};
