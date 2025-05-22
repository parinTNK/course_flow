import React from 'react';
import Image from 'next/image';
import { MdOutlineDragIndicator } from 'react-icons/md';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lesson } from '@/types/courseAdmin';

interface SortableRowProps {
  lesson: Lesson;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

export function SortableRow({ lesson, onDelete, onEdit }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50 transition">
      <td className="px-2 py-4 whitespace-nowrap text-center text-sm text-gray-500 align-top">
        <div
          className="flex items-start justify-center cursor-grab pt-2"
          {...attributes}
          {...listeners}
        >
          <MdOutlineDragIndicator size={20} />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {lesson.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {lesson.subLessons.length}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
        <button
          onClick={() => onEdit(lesson.id)}
          className="text-blue-600 hover:text-blue-800 mr-3"
          type="button"
        >
          <Image
            src="/edit.svg"
            alt="Edit"
            width={18}
            height={18}
            className="inline-block"
          />
        </button>
        <button
          onClick={() => onDelete(lesson.id)}
          className="text-red-600 hover:text-red-800"
          type="button"
        >
          <Image
            src="/delete.svg"
            alt="Delete"
            width={18}
            height={18}
            className="inline-block"
          />
        </button>
      </td>
    </tr>
  );
}
