export interface Course {
  id: string;
  name: string;
  price?: number;
}

export interface PromoCodeFormData {
  code: string;
  min_purchase_amount: string;
  discount_type: string;
  discount_value: string;
  course_ids: string[];
}

export const ALL_COURSES_ID = "all";
export const DISCOUNT_TYPE_FIXED = "Fixed amount";
export const DISCOUNT_TYPE_PERCENT = "Percent";