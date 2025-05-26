import { useState, useEffect } from 'react';
import { useCustomToast } from '@/components/ui/CustomToast';
import { Lesson, SubLesson } from '@/types/courseAdmin';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

export const useLessonManagement = (courseName: string) => {
  const { success: toastSuccess, error: toastError } = useCustomToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isAddLessonView, setIsAddLessonView] = useState(false);
  const [currentEditingLesson, setCurrentEditingLesson] = useState<{
    id: number | string | null;
    name: string;
    title?: string; // Add database field name
    subLessons: SubLesson[];
  }>({
    id: null,
    name: '',
    title: '', // Initialize database field
    subLessons: [{ 
      id: Date.now(), 
      name: '', 
      title: '', // Initialize database field
      videoUrl: '',
      video_url: '' // Initialize database field
    }]
  });

  useEffect(() => {
    const savedLessons = localStorage.getItem('courseLessons');
    if (savedLessons) {
      try {
        setLessons(JSON.parse(savedLessons));
      } catch (error) {
        console.error('Error parsing saved lessons:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('courseLessons', JSON.stringify(lessons));
  }, [lessons]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddLesson = () => {
    if (!courseName.trim()) {
      toastError('Please enter course name before adding lessons');
      return;
    }
    setCurrentEditingLesson({
      id: null,
      name: '',
      title: '', // Add both fields for consistency
      subLessons: [{ 
        id: Date.now(), 
        name: '', 
        title: '', // Add database field name
        videoUrl: '',
        video_url: '' // Add database field name
      }]
    });
    setIsAddLessonView(true);
  };

  const handleSaveNewLesson = () => {
    if (!currentEditingLesson.name.trim()) {
      toastError('Lesson name is required');
      return;
    }
    const hasEmptySubLesson = currentEditingLesson.subLessons.some(sl => !sl.name.trim() && !sl.title?.trim());
    if (hasEmptySubLesson) {
      toastError('All sub-lesson names are required');
      return;
    }
    
    if (currentEditingLesson.id === null) { // New lesson
      // For new lessons, use a temporary ID format with timestamp
      const newId = `temp-${Date.now()}`;
      
      // Prepare subLessons with all the necessary field mappings
      const normalizedSubLessons = currentEditingLesson.subLessons.map(sl => ({
        ...sl,
        // Ensure both frontend and database field names exist
        name: sl.name || sl.title || '',
        title: sl.title || sl.name || '',
        videoUrl: sl.videoUrl || sl.video_url || '',
        video_url: sl.video_url || sl.videoUrl || ''
      }));
      
      setLessons([...lessons, { 
        ...currentEditingLesson, 
        id: newId,
        // Set both for compatibility with different components
        sub_lessons_attributes: normalizedSubLessons,
        subLessons: normalizedSubLessons,
        sub_lessons: normalizedSubLessons
      }]);
      toastSuccess('Lesson added successfully');
    } else { // Editing existing lesson
      // Prepare subLessons with all the necessary field mappings
      const normalizedSubLessons = currentEditingLesson.subLessons.map(sl => ({
        ...sl,
        // Ensure both frontend and database field names exist
        name: sl.name || sl.title || '',
        title: sl.title || sl.name || '',
        videoUrl: sl.videoUrl || sl.video_url || '',
        video_url: sl.video_url || sl.videoUrl || ''
      }));
      
      setLessons(lessons.map(lesson =>
        lesson.id === currentEditingLesson.id ? { 
          ...lesson,
          name: currentEditingLesson.name,
          title: currentEditingLesson.name, // Add title for database consistency
          // Keep the existing structure but update all versions of subLessons
          sub_lessons_attributes: normalizedSubLessons,
          subLessons: normalizedSubLessons,
          sub_lessons: normalizedSubLessons
        } : lesson
      ));
      toastSuccess('Lesson updated successfully');
    }
    setIsAddLessonView(false);
  };

  const handleCancelAddLesson = () => setIsAddLessonView(false);

  const handleAddSubLesson = () => {
    // For new sub-lessons, use a timestamp-based ID to ensure uniqueness
    const newId = Date.now();
    
    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: [...prev.subLessons, { 
        id: newId, 
        name: '', 
        title: '',  // Add database field
        videoUrl: '', 
        video_url: ''  // Add database field
      }]
    }));
  };

  const handleRemoveSubLesson = (idToRemove: number | string) => {
    if (currentEditingLesson.subLessons.length <= 1) {
      toastError('You need at least one sub-lesson');
      return;
    }
    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: prev.subLessons.filter(sl => sl.id !== idToRemove)
    }));
  };

  const handleSubLessonNameChange = (id: number | string, newName: string) => {
    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: prev.subLessons.map(sl =>
        sl.id === id ? { 
          ...sl, 
          name: newName,  // Frontend property
          title: newName  // Database property
        } : sl
      )
    }));
  };

  // Add a method to set both name and title fields for consistency
  const setCurrentEditingLessonName = (newName: string) => {
    setCurrentEditingLesson(prev => ({
      ...prev,
      name: newName,  // Frontend property
      title: newName  // Database property
    }));
  };

  const handleEditLesson = (id: number | string) => {
    const lessonToEdit = lessons.find((lesson) => lesson.id === id);
    if (lessonToEdit) {
      // Get subLessons from any of the possible sources, prioritizing populated ones
      const subLessonsSource = 
        (Array.isArray(lessonToEdit.subLessons) && lessonToEdit.subLessons.length > 0) ? lessonToEdit.subLessons :
        (Array.isArray(lessonToEdit.sub_lessons) && lessonToEdit.sub_lessons.length > 0) ? lessonToEdit.sub_lessons : 
        (Array.isArray(lessonToEdit.sub_lessons_attributes) && lessonToEdit.sub_lessons_attributes.length > 0) ? lessonToEdit.sub_lessons_attributes : 
        [];
      
      // Normalize each subLesson with all field names for consistency
      const normalizedSubLessons = subLessonsSource.map(sl => ({
        ...sl,
        id: sl.id,
        name: sl.name || sl.title || '',
        title: sl.title || sl.name || '',
        videoUrl: sl.videoUrl || sl.video_url || '',
        video_url: sl.video_url || sl.videoUrl || ''
      }));
      
      setCurrentEditingLesson({
        id: lessonToEdit.id,
        name: lessonToEdit.name || lessonToEdit.title || '',
        title: lessonToEdit.title || lessonToEdit.name || '', // Ensure title is also set
        subLessons: normalizedSubLessons
      });
      setIsAddLessonView(true);
    }
  };

  const handleDeleteLesson = (id: number | string) => {
    setLessons(prevLessons => prevLessons.filter((lesson) => lesson.id !== id));
    toastSuccess('Lesson deleted successfully');
  };

  const handleDragEndLessons = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLessons((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  const handleDragEndSubLessons = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        setCurrentEditingLesson(prev => {
            const oldIndex = prev.subLessons.findIndex(item => item.id === active.id);
            const newIndex = prev.subLessons.findIndex(item => item.id === over.id);
            return {
                ...prev,
                subLessons: arrayMove(prev.subLessons, oldIndex, newIndex)
            };
        });
    }
  };

  return {
    lessons,
    setLessons,
    isAddLessonView,
    setIsAddLessonView,
    currentEditingLesson,
    setCurrentEditingLesson,
    sensors,
    handleAddLesson,
    handleSaveNewLesson,
    handleCancelAddLesson,
    handleAddSubLesson,
    handleRemoveSubLesson,
    handleSubLessonNameChange,
    handleEditLesson,
    handleDeleteLesson,
    handleDragEndLessons,
    handleDragEndSubLessons,
    setCurrentEditingLessonName, // Expose the new method
  };
};
