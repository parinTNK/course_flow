import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useSubscription(courseId: string, userId?: string) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!userId || !courseId) return;

      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("course_id", courseId)
        .eq("user_id", userId)
        .single();

      if (data) {
        setIsSubscribed(true);
      }
    };

    fetchSubscription();
  }, [courseId, userId]);

  return isSubscribed;
}
