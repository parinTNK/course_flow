import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useWishlist(courseId: string, userId?: string) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!userId || !courseId) return;

      const { data } = await supabase
        .from("wishlist")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", userId)
        .single();

      if (data) {
        setIsWishlisted(true);
      }
    };

    fetchWishlist();
  }, [courseId, userId]);

  return { isWishlisted, setIsWishlisted };
}
