'use client';

import React, { useState } from 'react';
import PromoCodeFormView from '../../components/PromoCodeFormView';
import { useRouter } from 'next/navigation';
import axios from 'axios';

function CreatePromoCode() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State สำหรับฟอร์ม
  const [formData, setFormData] = useState({
    code: '',
    min_purchase_amount: '',
    discount_type: 'percent',
    discount_value: '',
    course_ids: [], // เปลี่ยนจาก ['all'] เป็น [] เปล่า
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleDiscountTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      discount_type: type,
      discount_value: '',
    }));
  };

  const handleCoursesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      course_ids: [e.target.value],
    }));
  };

  const handleCancel = () => {
    router.back();
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setErrorMsg(null);

  // เตรียมข้อมูลสำหรับ API
  const isAllCourses = formData.course_ids.includes('all');
  const payload: any = {
    code: formData.code.trim(),
    min_purchase_amount: Number(formData.min_purchase_amount) || 0,
    discount_type: formData.discount_type, // 'fixed' หรือ 'percent'
    discount_value:
      formData.discount_type === 'fixed'
        ? Number(formData.discount_value) || 0
        : 0,
    discount_percentage:
      formData.discount_type === 'percent'
        ? Number(formData.discount_value) || 0
        : 0,
    is_all_courses: isAllCourses,
  };

  if (!isAllCourses) {
    payload.course_ids = formData.course_ids;
  }

  try {
    const res = await axios.post('/api/promocodes/create', payload);

    // ถ้าสำเร็จ
    setIsLoading(false);
    // router.push('/admin/dashboard/promo-codes');
  } catch (err: any) {
    setIsLoading(false);
    setErrorMsg(
      err?.response?.data?.error || err.message || 'Unknown error'
    );
  }
};

  console.log('formData:', formData);

  return (
    <div className="bg-gray-100 flex-1 pb-10">
      <PromoCodeFormView
        formData={formData}
        setFormData={setFormData} // เพิ่มบรรทัดนี้
        isLoading={isLoading}
        handleInputChange={handleInputChange}
        handleDiscountTypeChange={handleDiscountTypeChange}
        handleCoursesChange={handleCoursesChange}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}

export default CreatePromoCode;
