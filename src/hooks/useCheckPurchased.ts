
"use client"
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/app/context/authContext";

export function useCheckPurchased(courseId: string) {
  const { user } = useAuth();
  const [alreadyPurchased, setAlreadyPurchased] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || !courseId) return;

    const checkPurchased = async () => {
      try {
        const res = await axios.get(
          `/api/users/${user.user_id}/subscription?courseId=${courseId}`
        );
        setAlreadyPurchased(res.data.purchased);
      } catch (err) {
        setAlreadyPurchased(false);
      }
    };

    checkPurchased();
  }, [user, courseId]);

  return alreadyPurchased;
}
