import React from 'react';
import { ButtonT } from '@/components/ui/ButtonT';
import { Lesson, SubLesson } from '@/types/courseAdmin'; // Assuming SubLesson is also in types
import { DndContext, closestCenter, DragEndEvent }
from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSubLessonItem } from './SortableSubLessonItem'; // Adjusted import

interface LessonFormViewProps {
  courseName: string;
  currentEditingLesson: { 
    id: number | string | null; 
    name: string; 
    title?: string; // Add database field name
    subLessons: SubLesson[] 
  };
  setCurrentEditingLessonName: (name: string) => void;
  handleSaveNewLesson: () => void;
  handleCancelAddLesson: () => void;
  handleAddSubLesson: () => void;
  handleRemoveSubLesson: (id: number | string) => void;
  handleSubLessonNameChange: (id: number | string, newName: string) => void;
  handleDragEndSubLessons: (event: DragEndEvent) => void;
  dndSensors: any; // Type properly
}

export const LessonFormView: React.FC<LessonFormViewProps> = ({
  courseName, currentEditingLesson, setCurrentEditingLessonName,
  handleSaveNewLesson, handleCancelAddLesson, handleAddSubLesson,
  handleRemoveSubLesson, handleSubLessonNameChange, handleDragEndSubLessons, dndSensors
}) => {
  return (
    <div className="bg-white min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={handleCancelAddLesson} className="mr-4 text-gray-500 hover:text-gray-700">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <div className="text-sm text-gray-500">Course: '{courseName}'</div>
              <h1 className="text-xl font-medium">
                {currentEditingLesson.id === null ? 'Add Lesson' : 'Edit Lesson'}
              </h1>
            </div>
          </div>
          <div className="flex space-x-2">
            <ButtonT variant="Secondary" onClick={handleCancelAddLesson}>Cancel</ButtonT>
            <ButtonT variant="primary" onClick={handleSaveNewLesson}>
              {currentEditingLesson.id === null ? 'Create' : 'Update'}
            </ButtonT>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <label className="block text-sm font-medium mb-1">
              Lesson name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Enter lesson name"
              value={currentEditingLesson.name || currentEditingLesson.title || ''}
              onChange={(e) => {
                setCurrentEditingLessonName(e.target.value);
              }}
            />
          </div>
          <div>
            <h2 className="text-lg font-medium mb-4">Sub-Lesson</h2>
            <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSubLessons}>
              <SortableContext items={currentEditingLesson.subLessons.map(sl => sl.id)} strategy={verticalListSortingStrategy}>
                {currentEditingLesson.subLessons.map((subLesson) => (
                  <SortableSubLessonItem
                    key={subLesson.id}
                    subLesson={subLesson}
                    onRemove={handleRemoveSubLesson}
                    onNameChange={handleSubLessonNameChange}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <button
              type="button"
              onClick={handleAddSubLesson}
              className="mt-4 inline-flex items-center px-4 py-2 border border-orange-500 text-orange-500 rounded-md hover:bg-orange-50"
            >
              + Add Sub-lesson
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
