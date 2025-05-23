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
    id: number | null;
    name: string;
    subLessons: SubLesson[];
  }>({
    id: null,
    name: '',
    subLessons: [{ id: Date.now(), name: '', videoUrl: '' }] // Use Date.now() for unique initial ID
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
      subLessons: [{ id: Date.now(), name: '', videoUrl: '' }]
    });
    setIsAddLessonView(true);
  };

  const handleSaveNewLesson = () => {
    if (!currentEditingLesson.name.trim()) {
      toastError('Lesson name is required');
      return;
    }
    const hasEmptySubLesson = currentEditingLesson.subLessons.some(sl => !sl.name.trim());
    if (hasEmptySubLesson) {
      toastError('All sub-lesson names are required');
      return;
    }
    if (currentEditingLesson.id === null) { // New lesson
      const newId = lessons.length > 0 ? Math.max(...lessons.map(l => l.id)) + 1 : 1;
      setLessons([...lessons, { ...currentEditingLesson, id: newId }]);
      toastSuccess('Lesson added successfully');
    } else { // Editing existing lesson
      setLessons(lessons.map(lesson =>
        lesson.id === currentEditingLesson.id ? { ...currentEditingLesson } : lesson
      ));
      toastSuccess('Lesson updated successfully');
    }
    setIsAddLessonView(false);
  };

  const handleCancelAddLesson = () => setIsAddLessonView(false);

  const handleAddSubLesson = () => {
    const newId = currentEditingLesson.subLessons.length > 0
      ? Math.max(...currentEditingLesson.subLessons.map(sl => sl.id)) + 1
      : 1;
    // Ensure newId is unique, fallback to Date.now() if max is not reliable (e.g. after deletions)
    const uniqueNewId = currentEditingLesson.subLessons.find(sl => sl.id === newId) ? Date.now() : newId;

    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: [...prev.subLessons, { id: uniqueNewId, name: '', videoUrl: '' }]
    }));
  };

  const handleRemoveSubLesson = (idToRemove: number) => {
    if (currentEditingLesson.subLessons.length <= 1) {
      toastError('You need at least one sub-lesson');
      return;
    }
    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: prev.subLessons.filter(sl => sl.id !== idToRemove)
    }));
  };

  const handleSubLessonNameChange = (id: number, newName: string) => {
    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: prev.subLessons.map(sl =>
        sl.id === id ? { ...sl, name: newName } : sl
      )
    }));
  };

  const handleEditLesson = (id: number) => {
    const lessonToEdit = lessons.find((lesson) => lesson.id === id);
    if (lessonToEdit) {
      setCurrentEditingLesson({ ...lessonToEdit });
      setIsAddLessonView(true);
    }
  };

  const handleDeleteLesson = (id: number) => {
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
  };
};
