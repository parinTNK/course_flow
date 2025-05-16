'use client'
import { ButtonT } from '@/components/ui/ButtonT'
import { PromoCodeSection } from '@/app/admin/components/PromoCodeSection'
import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCustomToast } from '@/components/ui/CustomToast';

function CreateCourse() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

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
    }
  })

  const [coverImageFile, setCoverImageFile] = useState<File|null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')

  const coverRef = useRef<HTMLInputElement>(null)

  const handleCoverClick = () => coverRef.current?.click()
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    // reject files over 5MB
    if (file && file.size > 5 * 1024 * 1024) {
      toastError('Cover image must be less than 5 MB')
      return
    }
    setCoverImageFile(file)
    setCoverPreview(file ? URL.createObjectURL(file) : '')
    if (errors.coverImage) setErrors(prev=>{ const u={...prev}; delete u.coverImage; return u })
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target

    if (errors[id]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [id]: ''
      }))
    }

    setFormData(prevData => ({
      ...prevData,
      [id === 'course-name' ? 'name' :
        id === 'price' ? 'price' :
          id === 'learning-time' ? 'total_learning_time' :
            id === 'course-summary' ? 'summary' :
              id === 'course-detail' ? 'detail' : id]: value
    }))
  }

  // const handlePromoChange = (promoData: any) => {
  //   setFormData(prevData => ({
  //     ...prevData,
  //     promo: {
  //       ...promoData
  //     }
  //   }))
  // }

  const { success: toastSuccess, error: toastError } = useCustomToast();

  // Only validate course name for Draft
  const validateDraft = () => {
    if (!formData.name.trim()) {
      setErrors({ 'course-name': 'Please fill out this field' })
      toastError('Course name is required for draft')
      return false
    }
    return true
  }

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors['course-name'] = 'Please fill out this field'
    }

    if (!formData.price.trim()) {
      newErrors['price'] = 'Please fill out this field'
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      newErrors['price'] = 'Please enter a valid price'
    }

    if (!formData.total_learning_time.trim()) {
      newErrors['learning-time'] = 'Please fill out this field'
    } else if (isNaN(parseInt(formData.total_learning_time)) || parseInt(formData.total_learning_time) <= 0) {
      newErrors['learning-time'] = 'Please enter a valid learning time'
    }

    if (!formData.summary.trim()) {
      newErrors['course-summary'] = 'Please fill out this field'
    }

    if (!formData.detail.trim()) {
      newErrors['course-detail'] = 'Please fill out this field'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateDraft = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors['course-name'] = 'Please fill out this field'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault()

    // Draft: only course-name required
    if (status === 'draft' && !validateDraft()) return
    // Publish: run full validation
    if (status === 'published' && !validateForm()) return

    setIsLoading(true)
    
    try {
      let coverUrl = ''
      if (coverImageFile) {
        const fd = new FormData(); fd.append('coverImage', coverImageFile)
        const res = await fetch('/api/admin/upload-cover', { method:'POST', body: fd })
        const js = await res.json(); if (!res.ok) throw new Error(js.error)
        coverUrl = js.url
      }
      // Prepare data for API
      const courseData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        total_learning_time: formData.total_learning_time ? parseInt(formData.total_learning_time) : 0,
        status,
        cover_image_url: coverUrl,
      }

      const response = await fetch('/api/admin/courses-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create course')
      }

      setSuccess(true)
      if (status === 'draft') {
        toastSuccess('Course saved as draft')
      } else {
        toastSuccess('Course published successfully')
      }
      router.push('/admin/dashboard')

    } catch (err) {
      toastError('An error occurred', 'Unable to create the course. Please try again.', 3000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-100 flex-1 pb-10">
      <div className="flex justify-between items-center mb-8 bg-white px-8 py-6 border-b-3 border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-800">Add Course</h1>
        <div className="flex items-center space-x-4">
          <ButtonT
            variant="Secondary"
            className='w-[149px] h-[32px]'
            onClick={() => router.back()}
          >
            Cancel
          </ButtonT>
          <ButtonT
            variant="primary"
            className='w-[149px] h-[32px]'
            onClick={(e) => handleSubmit(e as React.FormEvent, 'published')}
          >
            {isLoading ? 'Creating...' : 'Create'}
          </ButtonT>
        </div>
      </div>

      <div className='p-8 mx-8 border-b-3 bg-white rounded-2xl'>
        <form className="space-y-6" onSubmit={(e) => handleSubmit(e, 'published')}>
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
            <div onClick={handleCoverClick} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50 cursor-pointer">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-48 object-contain rounded-md"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 w-40">
              <div className="flex flex-col items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <p className="mt-2 text-sm text-blue-500">Upload file</p>
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
  )
}

export default CreateCourse