'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ButtonT } from '@/components/ui/ButtonT'
import { useCustomToast } from '@/components/ui/CustomToast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MdOutlineDragIndicator } from 'react-icons/md'

// SubLesson interface
interface SubLesson {
  id: number;
  name: string;
  videoFile?: File;
  videoUrl?: string;
}

// SortableItem component
function SortableSubLessonItem({ subLesson, onRemove, onNameChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: subLesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="bg-[#F6F7FC] rounded-lg p-6 mb-4 relative"
    >
      {/* Drag handle */}
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
      
      {/* Sub-lesson name */}
      <div className="mb-4 ml-7">
        <label className="block text-sm font-medium mb-1">
          Sub-lesson name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          placeholder="Enter sub-lesson name"
          value={subLesson.name}
          onChange={e => onNameChange(subLesson.id, e.target.value)}
        />
      </div>
      
      {/* Video upload */}
      <div className="ml-7">
        <label className="block text-sm font-medium mb-1">
          Video <span className="text-red-500">*</span>
        </label>
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <div className="flex flex-col items-center justify-center h-28 relative">
            <div className="text-center">
              <div className="w-8 h-8 mb-2 flex items-center justify-center text-blue-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 7V17M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-blue-500 text-sm">Upload Video</p>
            </div>
            <input
              type="file"
              accept="video/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AddLessonPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  const courseName = searchParams.get('courseName') || 'Service Design Essentials/Introduction'
  const { success: toastSuccess, error: toastError } = useCustomToast()
  
  // State for lesson name
  const [lessonName, setLessonName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({ lessonName: '' })
  
  // State for managing sub-lessons
  const [subLessons, setSubLessons] = useState<SubLesson[]>([
    { id: 1, name: '' }
  ])
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Function to add a new sub-lesson
  const handleAddSubLesson = () => {
    const newId = subLessons.length > 0 ? Math.max(...subLessons.map(sl => sl.id)) + 1 : 1
    setSubLessons([...subLessons, { id: newId, name: '' }])
  }
  
  // Function to remove a sub-lesson
  const handleRemoveSubLesson = (idToRemove: number) => {
    if (subLessons.length > 1) {
      setSubLessons(subLessons.filter(sl => sl.id !== idToRemove))
    } else {
      toastError('You need at least one sub-lesson')
    }
  }
  
  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setSubLessons((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Function to handle sub-lesson name change
  const handleSubLessonNameChange = (id, newName) => {
    setSubLessons(prev => 
      prev.map(sl => sl.id === id ? { ...sl, name: newName } : sl)
    )
  }
  
  // Form validation
  const validateForm = () => {
    const newErrors = { lessonName: '' }
    let isValid = true
    
    if (!lessonName.trim()) {
      newErrors.lessonName = 'Lesson name is required'
      isValid = false
    }
    
    // Check if all sub-lessons have names
    const emptySubLesson = subLessons.find(sl => !sl.name.trim())
    if (emptySubLesson) {
      toastError('All sub-lesson names are required')
      isValid = false
    }
    
    setErrors(newErrors)
    return isValid
  }
  
  // Handle form submission
  const handleCreateLesson = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      // Prepare the lesson data to send back to the main page
      const newLesson = {
        id: Date.now(), // Temporary ID, will be replaced by the real DB ID
        name: lessonName,
        subLessons: subLessons.map(sl => ({
          id: sl.id,
          name: sl.name,
          videoUrl: sl.videoUrl || ''
        }))
      }
      
      // Use URL to pass data back (for demo purposes)
      // In a real app, you'd likely use a state management solution or context
      const encodedLesson = encodeURIComponent(JSON.stringify(newLesson))
      router.push(`/admin/dashboard/create-courses?newLesson=${encodedLesson}`)
      
    } catch (error) {
      toastError('Failed to create lesson')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div>
              <div className="text-sm text-gray-500">
                Course: '{courseName}'
              </div>
              <h1 className="text-xl font-medium">Add Lesson</h1>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <ButtonT
              variant="Secondary"
              onClick={() => router.back()}
            >
              Cancel
            </ButtonT>
            <ButtonT
              variant="primary"
              onClick={handleCreateLesson}
            >
              Create
            </ButtonT>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Lesson Name */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-1">
              Lesson name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-4 py-2 border ${errors.lessonName ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              placeholder="Enter lesson name"
              value={lessonName}
              onChange={(e) => setLessonName(e.target.value)}
            />
            {errors.lessonName && (
              <p className="text-red-500 text-xs mt-1">{errors.lessonName}</p>
            )}
          </div>

          {/* Sub-Lessons */}
          <div>
            <h2 className="text-lg font-medium mb-4">Sub-Lesson</h2>
            
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={subLessons.map(sl => sl.id)}
                strategy={verticalListSortingStrategy}
              >
                {subLessons.map((subLesson) => (
                  <SortableSubLessonItem
                    key={subLesson.id}
                    subLesson={subLesson}
                    onRemove={handleRemoveSubLesson}
                    onNameChange={handleSubLessonNameChange}
                  />
                ))}
              </SortableContext>
            </DndContext>
            
            {/* Add Sub-lesson button */}
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
  )
}