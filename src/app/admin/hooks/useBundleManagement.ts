import { useState, useEffect } from 'react';
import { BundleWithDetails } from '@/types/bundle';
import { useCustomToast } from '@/components/ui/CustomToast';
import { supabase } from '@/lib/supabaseClient';

export const useBundleManagement = () => {
  const [bundles, setBundles] = useState<BundleWithDetails[]>([]);
  const [filteredBundles, setFilteredBundles] = useState<BundleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { success, error: toastError } = useCustomToast();

  useEffect(() => {
    fetchBundles();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBundles(bundles);
    } else {
      const filtered = bundles.filter(
        (bundle) =>
          bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bundle.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBundles(filtered);
    }
    setCurrentPage(1);
  }, [bundles, searchTerm]);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      console.log("📦 Fetching bundles from Supabase...");

      // ดึง bundles พื้นฐานก่อน
      const { data: bundlesData, error: bundlesError } = await supabase
        .from('bundles')
        .select('*')
        .order('created_at', { ascending: false });

      if (bundlesError) {
        console.error("❌ Error fetching bundles:", bundlesError);
        throw bundlesError;
      }

      console.log("✅ Bundles fetched:", bundlesData?.length || 0);

      // ดึง bundle_courses แยก
      const { data: bundleCoursesData, error: coursesError } = await supabase
        .from('bundle_courses')
        .select(`
          bundle_id,
          course_id,
          courses (
            id,
            name,
            price,
            image_url,
            lessons_count,
            status
          )
        `);

      if (coursesError) {
        console.error("⚠️ Error fetching bundle courses:", coursesError);
        // ไม่ throw error เพราะอาจไม่มี courses
      }

      console.log("📚 Bundle courses fetched:", bundleCoursesData?.length || 0);

      // รวมข้อมูล - แก้ไขการจัดการ price
      const formattedBundles = bundlesData?.map(bundle => {
        const bundleCourses = bundleCoursesData?.filter(bc => bc.bundle_id === bundle.id) || [];
        const courses = bundleCourses.map(bc => bc.courses).filter(Boolean) || [];
        
        // แก้ไขการคำนวณ coursesPrice
        const coursesPrice = courses.reduce((total, course) => {
          // ตรวจสอบ price อย่างปลอดภัย
          const coursePrice = course && typeof course === 'object' && 'price' in course 
            ? (course.price as number) || 0 
            : 0;
          return total + coursePrice;
        }, 0);
        
        return {
          ...bundle,
          courses_count: courses.length,
          courses_total_price: coursesPrice,
          discount_amount: coursesPrice - (bundle.price || 0),
          discount_percentage: coursesPrice > 0 ? 
            Math.round(((coursesPrice - (bundle.price || 0)) / coursesPrice) * 100) : 0,
          total_learning_time: 0,
          total_lessons: 0,
          courses: courses
        } as BundleWithDetails;
      }) || [];

      setBundles(formattedBundles);
      console.log("✅ Bundles formatted and set");

    } catch (error) {
      console.error('💥 Error fetching bundles:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toastError('Failed to fetch bundles', errorMessage);
      setBundles([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete ผ่าน API route
  const handleDelete = async (bundleId: string) => {
    try {
      console.log("🗑️ Attempting to delete bundle via API:", bundleId);

      const response = await fetch(`/api/admin/bundle-delete/${bundleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("📡 Delete response status:", response.status);
      console.log("📡 Delete response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Delete API error:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Delete API response:", result);

      if (result.success) {
        // อัปเดต state
        setBundles(bundles.filter((bundle) => bundle.id !== bundleId));
        success(
          'Bundle deleted successfully',
          'The bundle has been removed from the system.'
        );
        return true;
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('💥 Delete error:', error);
      toastError(
        'Failed to delete bundle',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return false;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString)
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        .replace(',', '');
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  return {
    bundles,
    filteredBundles,
    loading,
    searchTerm,
    currentPage,
    setSearchTerm,
    setCurrentPage,
    handleDelete,
    formatDate,
    refetchBundles: fetchBundles,
  };
};