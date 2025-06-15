import { useEffect, useState } from "react";
import { Bundle } from "@/types/bundle";

export function useBundleData(bundleId: string) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [bundleCourses, setBundleCourses] = useState<any[]>([]);
  const [otherBundles, setOtherBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!bundleId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('🔍 Fetching bundle data for ID:', bundleId);
        
        // แก้ API path ให้ถูกต้อง (ตรวจสอบ path ที่แท้จริง)
        const response = await fetch(`/api/bundles/${bundleId}`);
        
        if (!response.ok) {
          console.error('❌ API response not ok:', response.status);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Bundle API response:', result);
        
        // แก้ไข: API ส่ง direct object ไม่มี data wrapper
        if (result && result.id) {
          setBundle(result);
          setBundleCourses(result.courses || []);
          console.log('📚 Courses found:', result.courses?.length || 0);
          console.log('📋 Course details:', result.courses);
        } else if (result.error) {
          console.error('❌ API returned error:', result.error);
          throw new Error(result.error);
        } else {
          console.error('❌ Unexpected response format:', result);
          throw new Error('Bundle not found');
        }

        // ดึง bundles อื่น ๆ
        try {
          const otherBundlesResponse = await fetch(`/api/bundles?limit=6`);
          if (otherBundlesResponse.ok) {
            const otherBundlesData = await otherBundlesResponse.json();
            // กรอง bundle ปัจจุบันออก
            const filteredBundles = otherBundlesData.bundles?.filter((b: any) => b.id !== bundleId) || [];
            setOtherBundles(filteredBundles.slice(0, 6));
            console.log('📦 Other bundles found:', filteredBundles.length);
          }
        } catch (err) {
          console.log('⚠️ Other bundles API not available:', err);
          setOtherBundles([]);
        }
      } catch (err) {
        console.error("💥 Error in useBundleData:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bundleId]);

  return { bundle, bundleCourses, otherBundles, loading };
}