'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ButtonT } from '@/components/ui/ButtonT';
import { PromoCodeSection } from '@/app/admin/components/PromoCodeSection';
import { useCustomToast } from '@/components/ui/CustomToast';
import Image from 'next/image';
import { MdOutlineDragIndicator } from 'react-icons/md';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


// เพิ่ม type definitions
interface SubLesson {
  id: number;
  name: string;
  videoUrl?: string;
}

interface Lesson {
  id: number;
  name: string;
  subLessons: SubLesson[];
}

function CreateCourse() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success: toastSuccess, error: toastError } = useCustomToast();

  // State สำหรับข้อมูลหลักของ course
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    total_learning_time: '',
    summary: '',
    detail: '',
    promo: {
      isActive: false,
      promoCode: '',
      minimumPurchase: '',
      discountType: '',
      discountAmount: '',
    },
  });

  // เก็บ lessons ทั้งหมดในหน้านี้แทนที่จะส่งไปบันทึกก่อน
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // State อื่นๆ ที่จำเป็น
  const [isLoading, setIsLoading] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const coverRef = useRef<HTMLInputElement>(null);

  const handleCoverClick = () => coverRef.current?.click();
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    // reject files over 5MB
    if (file && file.size > 5 * 1024 * 1024) {
      toastError('Cover image must be less than 5 MB');
      return;
    }
    setCoverImageFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : '');
    if (errors.coverImage) setErrors((prev) => { const u = { ...prev }; delete u.coverImage; return u; });
  };

  // Function สำหรับการกรอกข้อมูล form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;

    if (errors[id]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: '',
      }));
    }

    setFormData((prevData) => ({
      ...prevData,
      [id === 'course-name' ? 'name' :
        id === 'price' ? 'price' :
          id === 'learning-time' ? 'total_learning_time' :
            id === 'course-summary' ? 'summary' :
              id === 'course-detail' ? 'detail' : id]: value,
    }));
  };

  // เพิ่มฟังก์ชันนี้ก่อนฟังก์ชัน handleAddLesson

const createDraftCourseIfNeeded = async () => {
  // ถ้ามี currentCourseId แล้ว ให้ใช้ค่าเดิม
  if (currentCourseId) return currentCourseId;
  
  try {
    // ตรวจสอบข้อมูลขั้นต่ำที่จำเป็น
    if (!formData.name.trim()) {
      toastError('Please enter course name before adding lessons');
      return null;
    }
    
    // สร้าง draft course
    const draftCourse = {
      name: formData.name,
      price: formData.price ? parseFloat(formData.price) : 0,
      total_learning_time: formData.total_learning_time ? parseInt(formData.total_learning_time) : 0,
      summary: formData.summary || '',
      detail: formData.detail || '',
      status: 'draft'
    };
    
    const response = await fetch('/api/admin/courses-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftCourse)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create draft course');
    }
    
    // บันทึก ID ของ course ที่สร้างใหม่
    const newCourseId = result.data[0].id;
    setCurrentCourseId(newCourseId);
    
    return newCourseId;
  } catch (error) {
    console.error('Error creating draft course:', error);
    toastError('Failed to create draft course');
    return null;
  }
};

  // Function สำหรับการเพิ่ม lesson ใหม่
  const handleAddLesson = async () => {
    // สร้าง draft course ก่อนถ้ายังไม่มี courseId
    const courseId = await createDraftCourseIfNeeded();
    
    if (courseId) {
      const courseNameParam = encodeURIComponent(formData.name || 'Untitled Course');
      router.push(`/admin/dashboard/create-courses/add-lesson?courseId=${courseId}&courseName=${courseNameParam}`);
    }
  };

  // Functions สำหรับการจัดการกับ lessons และ sub-lessons
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);

  // Temp state สำหรับ lesson ที่กำลังแก้ไข/เพิ่มใหม่
  const [currentLesson, setCurrentLesson] = useState<{
    id: number;
    name: string;
    subLessons: SubLesson[];
  }>({
    id: 0,
    name: '',
    subLessons: [{ id: 1, name: '' }],
  });

  // เพิ่ม lesson เข้า state เมื่อบันทึก
  const handleLessonSave = () => {
    if (!currentLesson.name.trim()) {
      toastError('Lesson name is required');
      return;
    }

    // ตรวจสอบว่า sub-lessons ทั้งหมดมีชื่อ
    const hasEmptySubLesson = currentLesson.subLessons.some((sl) => !sl.name.trim());
    if (hasEmptySubLesson) {
      toastError('All sub-lesson names are required');
      return;
    }

    if (currentLessonId === null) {
      // เพิ่มใหม่
      const newId = lessons.length > 0 ? Math.max(...lessons.map((l) => l.id)) + 1 : 1;
      const newLesson = {
        ...currentLesson,
        id: newId,
      };
      setLessons([...lessons, newLesson]);
    } else {
      // แก้ไข
      setLessons(lessons.map((lesson) =>
        lesson.id === currentLessonId ? { ...currentLesson } : lesson
      ));
    }

    setIsLessonModalOpen(false);
    resetCurrentLesson();
  };

  // Reset form สำหรับ lesson ใหม่
  const resetCurrentLesson = () => {
    setCurrentLesson({
      id: 0,
      name: '',
      subLessons: [{ id: 1, name: '' }],
    });
    setCurrentLessonId(null);
  };

  // ฟังก์ชันลบ lesson
  const handleDeleteLesson = (id: number) => {
    setLessons(lessons.filter((lesson) => lesson.id !== id));
  };

  // ฟังก์ชันแก้ไข lesson
  const handleEditLesson = (id: number) => {
    const lessonToEdit = lessons.find((lesson) => lesson.id === id);
    if (lessonToEdit) {
      setCurrentLesson({ ...lessonToEdit });
      setCurrentLessonId(id);
      setIsLessonModalOpen(true);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ฟังก์ชันสำหรับ drag-and-drop reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLessons((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // ฟังก์ชันตรวจสอบความถูกต้องของข้อมูล
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors['course-name'] = 'Please fill out this field';
    }

    if (!formData.price.trim()) {
      newErrors['price'] = 'Please fill out this field';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      newErrors['price'] = 'Please enter a valid price';
    }

    if (!formData.total_learning_time.trim()) {
      newErrors['learning-time'] = 'Please fill out this field';
    } else if (isNaN(parseInt(formData.total_learning_time)) || parseInt(formData.total_learning_time) <= 0) {
      newErrors['learning-time'] = 'Please enter a valid learning time';
    }

    if (!formData.summary.trim()) {
      newErrors['course-summary'] = 'Please fill out this field';
    }

    if (!formData.detail.trim()) {
      newErrors['course-detail'] = 'Please fill out this field';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ฟังก์ชันสำหรับการส่งแบบฟอร์ม
  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let coverUrl = '';

      // Upload cover image if exists
      if (coverImageFile) {
        const fd = new FormData();
        fd.append('coverImage', coverImageFile);
        const res = await fetch('/api/admin/upload-cover', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload cover image');
        coverUrl = data.url;
      }

      // Prepare course data with lessons
      const courseData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        total_learning_time: formData.total_learning_time ? parseInt(formData.total_learning_time) : 0,
        status,
        cover_image_url: coverUrl,
        lessons: lessons.map((lesson, index) => ({
          title: lesson.name,
          order_no: index + 1,
          sub_lessons: lesson.subLessons.map((subLesson, subIndex) => ({
            title: subLesson.name,
            order_no: subIndex + 1,
            video_url: subLesson.videoUrl || '',
          })),
        })),
      };

      // Send the request to create course with lessons
      const response = await fetch('/api/admin/courses-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create course');
      }

      toastSuccess(`Course ${status === 'published' ? 'published' : 'saved as draft'} successfully`);
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Error creating course:', error);
      toastError('Failed to create course', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // เพิ่ม useEffect ในหน้า create-courses/page.tsx เพื่อรับและประมวลผลข้อมูล lesson ที่ส่งกลับมา

  useEffect(() => {
    // ตรวจสอบว่ามีข้อมูล lesson ใหม่ที่ส่งกลับมาหรือไม่
    const newLessonParam = searchParams.get('newLesson');
    
    if (newLessonParam) {
      try {
        // แปลงข้อมูลจาก URL parameter กลับเป็น object
        const newLesson = JSON.parse(decodeURIComponent(newLessonParam));
        
        // ตรวจสอบว่า lesson มี id ซ้ำกับที่มีอยู่หรือไม่
        const existingLesson = lessons.find(l => l.id === newLesson.id);
        
        if (!existingLesson) {
          // เพิ่ม lesson ใหม่เข้าไปใน state
          setLessons(prev => [...prev, newLesson]);
          toastSuccess('Lesson added successfully');
        }
        
        // ลบพารามิเตอร์ออกจาก URL เพื่อไม่ให้เพิ่มซ้ำเมื่อรีเฟรชหน้า
        const url = new URL(window.location.href);
        url.searchParams.delete('newLesson');
        router.replace(url.toString());
      } catch (error) {
        console.error('Error processing new lesson:', error);
      }
    }
  }, [searchParams]);

  // เพิ่มตรงนี้ ในส่วนของ state declarations ต่อจาก state อื่นๆ
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);

  // เพิ่ม useEffect นี้

useEffect(() => {
  // ตรวจสอบว่ามี courseId ใน URL หรือไม่
  const courseIdFromUrl = searchParams.get('courseId');
  if (courseIdFromUrl && courseIdFromUrl !== 'new' && courseIdFromUrl !== currentCourseId) {
    setCurrentCourseId(courseIdFromUrl);
  }
}, [searchParams]);

  // JSX สำหรับหน้า UI
  return (
    <div className="bg-gray-100 flex-1 pb-10">
      <div className="flex justify-between items-center mb-8 bg-white px-8 py-6 border-b-3 border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-800">Add Course</h1>
        <div className="flex items-center space-x-4">
          <ButtonT
            variant="Secondary"
            className="w-[149px] h-[32px]"
            onClick={() => router.back()}
          >
            Cancel
          </ButtonT>
          <ButtonT
            variant="primary"
            className="w-[149px] h-[32px]"
            onClick={(e) => handleSubmit(e as React.FormEvent, 'published')}
          >
            {isLoading ? 'Creating...' : 'Create'}
          </ButtonT>
        </div>
      </div>

      <div className="bg-geay-50 flex-1">
        <form className="space-y-6" onSubmit={(e) => handleSubmit(e, 'published')}>
          <div className="bg-white p-8 mx-8 border-b-3 rounded-2xl">
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
              {errors['course-name'] && (
                <p className="text-red-500 text-xs">{errors['course-name']}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {errors['price'] && (
                  <p className="text-red-500 text-xs">{errors['price']}</p>
                )}
              </div>

              <div className="space-y-2 pb-5">
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
                {errors['learning-time'] && (
                  <p className="text-red-500 text-xs">{errors['learning-time']}</p>
                )}
              </div>
            </div>

            <PromoCodeSection />

            <div className="space-y-2">
              <label htmlFor="course-summary" className="block text-sm font-medium">
                Course summary <span className="text-red-500">*</span>
              </label>
              <textarea
                id="course-summary"
                placeholder="Enter course summary"
                className={`w-full px-4 py-2 border rounded-md h-24 ${errors['course-summary'] ? 'border-red-500' : ''}`}
                value={formData.summary}
                onChange={handleInputChange}
              ></textarea>
              {errors['course-summary'] && (
                <p className="text-red-500 text-xs">{errors['course-summary']}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="course-detail" className="block text-sm font-medium">
                Course detail <span className="text-red-500">*</span>
              </label>
              <textarea
                id="course-detail"
                placeholder="Enter course details"
                className={`w-full px-4 py-2 border rounded-md h-36 ${errors['course-detail'] ? 'border-red-500' : ''}`}
                value={formData.detail}
                onChange={handleInputChange}
              ></textarea>
              {errors['course-detail'] && (
                <p className="text-red-500 text-xs">{errors['course-detail']}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Cover image <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500">
                Supported file types: .jpg, .png, .jpeg. Max file size: 5 MB
              </p>
              <input ref={coverRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleCoverChange} />
              <div onClick={handleCoverClick} className="w-[240px] h-[240px] flex item-center justify-center cursor-pointer rounded-lg p-4 text-center bg-[#F6F7FC] ">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-48 object-contain rounded-md"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="mt-2 text-sm text-blue-500">Upload Image</p>
                  </div>
                )}
              </div>
              {errors.coverImage && <p className="text-red-500 text-xs">{errors.coverImage}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Video Trailer <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500">
                Supported file types: .mp4, .mov, .avi Max file size: 20 MB
              </p>
              <div className="w-[240px] h-[240px] flex item-center justify-center cursor-pointer rounded-lg p-8 text-center bg-[#F6F7FC]">
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <p className="mt-2 text-sm text-blue-500">Upload Video</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Attach File (Optional)
              </label>
              <div className="w-[180px] h-[180px] flex item-center justify-center cursor-pointer rounded-lg p-6 text-center bg-[#F6F7FC]">
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <p className="mt-2 text-sm text-blue-500">Upload file</p>
                </div>
              </div>
            </div>
          </div>
          {/* end create from */}

          <div className="bg-white p-8 mx-8 border-b-3 rounded-2xl">
            <div className="flex justify-between items-center">
              <p className="text-[24px] text-[#2A2E3F]">Lesson</p>
              <ButtonT
                variant="primary"
                className="w-[171px] h-[32px]"
                onClick={() => handleAddLesson()}
              >
                + Add Lesson
              </ButtonT>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table className="min-w-full divide-y divide-gray-200 overflow-hidden">
                    <thead>
                      <tr>
                        {/* Drag handle column - small width */}
                        <th scope="col" className="w-12 px-2 py-3 bg-[#E8EAEF] text-left">
                          {/* Empty for drag icons */}
                        </th>

                        {/* Lesson name column - takes most space */}
                        <th
                          scope="col"
                          className="px-6 py-3 w-3/5 bg-[#E8EAEF] text-left text-sm font-medium text-gray-700"
                        >
                          Lesson name
                        </th>

                        {/* Sub-lesson column - medium width */}
                        <th
                          scope="col"
                          className="px-6 py-3 w-1/4 bg-[#E8EAEF] text-left text-sm font-medium text-gray-700"
                        >
                          Sub-lesson
                        </th>

                        {/* Action column - small fixed width */}
                        <th
                          scope="col"
                          className="px-6 py-3 bg-[#E8EAEF] text-left text-sm font-medium text-gray-700"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      <SortableContext
                        items={lessons.map((l) => l.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {lessons.length > 0 ? (
                          lessons.map((lesson) => (
                            <SortableRow
                              key={lesson.id}
                              lesson={lesson}
                              onDelete={() => handleDeleteLesson(lesson.id)}
                              onEdit={() => handleEditLesson(lesson.id)}
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
          <div className="flex justify-end mt-6">
            <ButtonT
              variant="Secondary"
              className="mr-4 w-[169px]"
              onClick={(e) => handleSubmit(e as React.FormEvent, 'draft')}
            >
              {isLoading ? 'Saving...' : 'Draft'}
            </ButtonT>
          </div>
        </form>
      </div>
    </div>
  );
}

// Component สำหรับแถวที่สามารถลากและวางได้
function SortableRow({ lesson, onDelete, onEdit }) {
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
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-800 mr-3"
          type="button"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800"
          type="button"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default CreateCourse;