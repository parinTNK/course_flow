import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomToast } from '@/components/ui/CustomToast';
import { CourseFormData, Lesson } from '@/types/courseAdmin';

const INITIAL_FORM_DATA: CourseFormData = {
  name: '',
  price: '',
  total_learning_time: '',
  summary: '',
  detail: '',
  promo_code_id: null,
  status: 'draft',
  cover_image_url: null,
};

interface UseCourseFormProps {
  courseId?: string;
  initialData?: CourseFormData;
}

export const useCourseForm = (props?: UseCourseFormProps) => {
  const { courseId, initialData } = props || {};
  const isEditMode = !!courseId;
  
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useCustomToast();

  const [formData, setFormData] = useState<CourseFormData>(initialData || INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const coverRef = useRef<HTMLInputElement>(null);

  // Only load from localStorage in create mode (not edit mode)
  useEffect(() => {
    if (!isEditMode) {
      const savedFormData = localStorage.getItem('courseFormData');
      if (savedFormData) {
        try {
          setFormData(JSON.parse(savedFormData));
        } catch (error) {
          console.error('Error parsing saved form data:', error);
        }
      }
    }
  }, [isEditMode]);

  // Only save to localStorage in create mode
  useEffect(() => {
    if (!isEditMode) {
      localStorage.setItem('courseFormData', JSON.stringify(formData));
    }
  }, [formData, isEditMode]);

  // Set cover preview from initial data if available
  useEffect(() => {
    if (initialData?.cover_image_url) {
      setCoverPreview(initialData.cover_image_url);
    }
  }, [initialData]);

  const handleCoverClick = () => coverRef.current?.click();

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 5 * 1024 * 1024) {
      toastError('Cover image must be less than 5 MB');
      return;
    }
    setCoverImageFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : '');
    if (errors.coverImage) setErrors((prev) => { const u = { ...prev }; delete u.coverImage; return u; });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (errors[id]) {
      setErrors((prevErrors) => ({ ...prevErrors, [id]: '' }));
    }
    const keyMap: Record<string, keyof CourseFormData> = {
      'course-name': 'name',
      'price': 'price',
      'learning-time': 'total_learning_time',
      'course-summary': 'summary',
      'course-detail': 'detail',
    };
    const formKey = keyMap[id] || id as keyof CourseFormData;
    setFormData((prevData) => ({ ...prevData, [formKey]: value }));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors['course-name'] = 'Please fill out this field';
    
    // Handle price validation for both string and number types
    const priceValue = typeof formData.price === 'string' ? formData.price.trim() : formData.price;
    if (!priceValue && priceValue !== 0) newErrors['price'] = 'Please fill out this field';
    else {
      const priceNum = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
      if (isNaN(priceNum) || priceNum < 0) newErrors['price'] = 'Please enter a valid price';
    }
    
    // Handle learning time validation for both string and number types
    const timeValue = typeof formData.total_learning_time === 'string' ? 
      formData.total_learning_time.trim() : formData.total_learning_time;
    if (!timeValue && timeValue !== 0) newErrors['learning-time'] = 'Please fill out this field';
    else {
      const timeNum = typeof timeValue === 'string' ? parseInt(timeValue) : timeValue;
      if (isNaN(timeNum) || timeNum <= 0) newErrors['learning-time'] = 'Please enter a valid learning time';
    }
    
    if (!formData.summary.trim()) newErrors['course-summary'] = 'Please fill out this field';
    if (!formData.detail.trim()) newErrors['course-detail'] = 'Please fill out this field';
    
    // Cover validation - only required on new courses or if not already present
    if (!coverImageFile && !formData.cover_image_url) {
      newErrors.coverImage = 'Cover image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNameOnly = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors['course-name'] = 'Please fill out this field';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    e: React.FormEvent, 
    status: 'draft' | 'published', 
    lessons: Lesson[], 
    validateNameOnlyFlag = false
  ) => {
    e.preventDefault();
    const isValid = validateNameOnlyFlag ? validateNameOnly() : validateForm();
    if (!isValid) return;

    setIsLoading(true);
    try {
      // Upload cover image if a new one was selected
      let coverUrl = formData.cover_image_url || '';
      if (coverImageFile) {
        const fd = new FormData();
        fd.append('coverImage', coverImageFile);
        const res = await fetch('/api/admin/upload-cover', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload cover image');
        coverUrl = data.url;
      }

      // Prepare course data for API
      const courseData = {
        ...formData,
        id: courseId, // Include ID for edit mode
        price: typeof formData.price === 'string' && formData.price ? 
          parseFloat(formData.price) : formData.price || 0,
        total_learning_time: typeof formData.total_learning_time === 'string' && formData.total_learning_time ? 
          parseInt(formData.total_learning_time) : formData.total_learning_time || 0,
        status,
        cover_image_url: coverUrl,
        lessons_attributes: lessons.map((lesson, index) => ({
          id: lesson.id,
          name: lesson.name,
          order: index,
          sub_lessons_attributes: lesson.subLessons?.map((subLesson, subIndex) => ({
            id: subLesson.id,
            name: subLesson.name,
            order: subIndex,
            video_url: subLesson.videoUrl || subLesson.video_url || '',
          })) || [],
        })),
      };

      // Determine API endpoint and method based on mode
      const endpoint = isEditMode 
        ? `/api/admin/courses-update/${courseId}`
        : '/api/admin/courses-create';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} course`);

      const successMessage = isEditMode
        ? `Course ${status === 'published' ? 'published' : 'updated'} successfully`
        : `Course ${status === 'published' ? 'published' : 'saved as draft'} successfully`;
      
      toastSuccess(successMessage);
      
      // Clean up localStorage in create mode
      if (!isEditMode) {
        localStorage.removeItem('courseFormData');
        localStorage.removeItem('courseLessons');
      }
      
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} course:`, error);
      toastError(`Failed to ${isEditMode ? 'update' : 'create'} course`, error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isEditMode) {
      localStorage.removeItem('courseFormData');
      localStorage.removeItem('courseLessons');
    }
    router.back();
  };

  return {
    formData,
    setFormData,
    isLoading,
    setIsLoading,
    coverImageFile,
    setCoverImageFile,
    coverPreview,
    setCoverPreview,
    errors,
    setErrors,
    coverRef,
    handleCoverClick,
    handleCoverChange,
    handleInputChange,
    validateForm,
    validateNameOnly,
    handleSubmit,
    handleCancel,
    isEditMode,
  };
};
