import { z } from 'zod';

export const CreateBundleSchema = z.object({
  name: z
    .string()
    .min(1, 'Bundle name is required')
    .max(255, 'Bundle name must be less than 255 characters')
    .trim(),
    
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform(val => val || ''),
    
  detail: z
    .string()
    .max(5000, 'Detail must be less than 5000 characters')
    .optional()
    .transform(val => val || ''),
    
  price: z
    .number()
    .min(0, 'Price must be positive')
    .max(999999, 'Price must be less than 999,999')
    .optional()
    .default(0),
    
  courses: z
    .array(z.string().min(1, 'Course ID cannot be empty')) // เปลี่ยนจาก uuid เป็น string validation แบบง่าย
    .max(50, 'Maximum 50 courses per bundle')
    .optional()
    .default([])
});

// Update Bundle Schema - ปรับให้รองรับ ID format ที่หลากหลาย
export const UpdateBundleSchema = z.object({
  id: z.string().min(1, 'Bundle ID is required'), // เปลี่ยนจาก uuid เป็น string validation แบบง่าย
    
  name: z
    .string()
    .min(1, 'Bundle name is required')
    .max(255, 'Bundle name must be less than 255 characters')
    .trim()
    .optional(),
    
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
    
  detail: z
    .string()
    .max(5000, 'Detail must be less than 5000 characters')
    .optional(),
    
  price: z
    .number()
    .min(0, 'Price must be positive')
    .max(999999, 'Price must be less than 999,999')
    .optional()
});

// Get Bundles Query Schema
export const GetBundlesQuerySchema = z.object({
  status: z
    .enum(['active', 'inactive'])
    .optional()
    .default('active'),
    
  page: z
    .string()
    .optional()
    .default('1')
    .transform(val => parseInt(val))
    .pipe(z.number().min(1, 'Page must be greater than 0')),
    
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(val => parseInt(val))
    .pipe(z.number().min(1).max(100, 'Limit must be between 1 and 100'))
});

// Bundle ID Param Schema - ปรับให้รองรับ ID format ที่หลากหลาย
export const BundleIdSchema = z.object({
  id: z.string().min(1, 'Bundle ID is required') // เปลี่ยนจาก uuid เป็น string validation แบบง่าย
});

// แล้วเพิ่ม flexible ID validation สำหรับกรณีที่ต้องการ
export const FlexibleBundleIdSchema = z.object({
  id: z.string()
    .min(1, 'Bundle ID is required')
    .refine(
      (val) => {
        // รองรับทั้ง UUID และ format อื่นๆ
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const customIdRegex = /^[a-zA-Z0-9\-_]+$/; // รองรับ alphanumeric, dash, underscore
        
        return uuidRegex.test(val) || customIdRegex.test(val);
      },
      {
        message: 'Invalid ID format'
      }
    )
});

// Export types
export type CreateBundleInput = z.infer<typeof CreateBundleSchema>;
export type UpdateBundleInput = z.infer<typeof UpdateBundleSchema>;
export type GetBundlesQuery = z.infer<typeof GetBundlesQuerySchema>;
export type BundleIdParam = z.infer<typeof BundleIdSchema>;
export type FlexibleBundleIdParam = z.infer<typeof FlexibleBundleIdSchema>;