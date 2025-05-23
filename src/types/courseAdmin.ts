export interface SubLesson {
  id: number;
  name: string;
  videoUrl?: string;
}

export interface Lesson {
  id: number;
  name: string;
  subLessons: SubLesson[];
}

export interface CourseFormData {
  name: string;
  price: string;
  total_learning_time: string;
  summary: string;
  detail: string;
  promo: {
    isActive: boolean;
    promoCode: string;
    minimumPurchase: string;
    discountType: string;
    discountAmount: string;
  };
}
