'use client';

import React, { useState } from 'react';
import PromoCodeFormView from '../../components/PromoCodeFormView';
import { useRouter } from 'next/navigation';

function CreatePromoCode() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // State สำหรับฟอร์ม
  const [formData, setFormData] = useState({
    code: '',
    min_purchase_amount: '',
    discount_type: 'percent',
    discount_value: '',
    course_ids: ['all'], // 'all' หรือ array ของ id
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
    // TODO: call API เพื่อสร้าง promo code
    setIsLoading(false);
    router.push('/admin/dashboard/promo-codes');
  };

  return (
    <div className="bg-gray-100 flex-1 pb-10">
      <PromoCodeFormView
        formData={formData}
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