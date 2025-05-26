import React from 'react';
import { MdOutlineDragIndicator } from 'react-icons/md';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SubLesson } from '@/types/courseAdmin';

interface SortableSubLessonItemProps {
  subLesson: SubLesson;
  onRemove: (id: number | string) => void;
  onNameChange: (id: number | string, name: string) => void;
  // Add onVideoChange if implementing video upload per sub-lesson
}

export function SortableSubLessonItem({ subLesson, onRemove, onNameChange }: SortableSubLessonItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: subLesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#F6F7FC] rounded-lg p-6 mb-4 relative"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-grab text-gray-400"
      >
        <MdOutlineDragIndicator size={20} />
      </div>

      <button
        type="button"
        onClick={() => onRemove(subLesson.id)}
        className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
      >
        Delete
      </button>

      <div className="mb-4 ml-7">
        <label className="block text-sm font-medium mb-1">
          Sub-lesson name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          placeholder="Enter sub-lesson name"
          value={subLesson.name || subLesson.title || ''}
          onChange={e => onNameChange(subLesson.id, e.target.value)}
        />
      </div>

      <div className="ml-7">
        <label className="block text-sm font-medium mb-1">
          Video <span className="text-red-500">*</span> {/* Assuming video is required */}
        </label>
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <div className="flex flex-col items-center justify-center h-28 relative">
            {/* Placeholder for video upload UI. Implement as needed. */}
            <div className="text-center">
              <div className="w-8 h-8 mb-2 flex items-center justify-center text-blue-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 7V17M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-blue-500 text-sm">Upload Video</p>
            </div>
            <input
              type="file"
              accept="video/*"
              // onChange={(e) => handleSubLessonVideoChange(subLesson.id, e.target.files?.[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          {/* Display video preview or name if uploaded */}
          {(subLesson.videoUrl || subLesson.video_url) && 
            <p className="text-xs mt-1">{subLesson.videoUrl || subLesson.video_url}</p>
          }
        </div>
      </div>
    </div>
  );
}
