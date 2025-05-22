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
  promo: {
    isActive: false,
    promoCode: '',
    minimumPurchase: '',
    discountType: '',
    discountAmount: '',
  },
};

export const useCourseForm = () => {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useCustomToast();

  const [formData, setFormData] = useState<CourseFormData>(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedFormData = localStorage.getItem('courseFormData');
    if (savedFormData) {
      try {
        setFormData(JSON.parse(savedFormData));
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('courseFormData', JSON.stringify(formData));
  }, [formData]);

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
    if (!formData.price.trim()) newErrors['price'] = 'Please fill out this field';
    else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) newErrors['price'] = 'Please enter a valid price';
    if (!formData.total_learning_time.trim()) newErrors['learning-time'] = 'Please fill out this field';
    else if (isNaN(parseInt(formData.total_learning_time)) || parseInt(formData.total_learning_time) <= 0) newErrors['learning-time'] = 'Please enter a valid learning time';
    if (!formData.summary.trim()) newErrors['course-summary'] = 'Please fill out this field';
    if (!formData.detail.trim()) newErrors['course-detail'] = 'Please fill out this field';
    // Add cover image validation if needed: if (!coverImageFile) newErrors.coverImage = 'Cover image is required';
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
      let coverUrl = '';
      if (coverImageFile) {
        const fd = new FormData();
        fd.append('coverImage', coverImageFile);
        const res = await fetch('/api/admin/upload-cover', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload cover image');
        coverUrl = data.url;
      }

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

      const response = await fetch('/api/admin/courses-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create course');

      toastSuccess(`Course ${status === 'published' ? 'published' : 'saved as draft'} successfully`);
      localStorage.removeItem('courseFormData');
      localStorage.removeItem('courseLessons'); // Ensure lessons are also cleared
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error('Error creating course:', error);
      toastError('Failed to create course', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem('courseFormData');
    localStorage.removeItem('courseLessons');
    router.back();
  };

  return {
    formData,
    setFormData, // Exposed if direct manipulation is needed, though handleInputChange is preferred
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
  };
};
