"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabaseClient";

type UserType = {
  id: string;
  user_id: string;
  full_name: string;
  educational_background: string;
  profile_picture: string;
  date_of_birth: string;
  email: string;
  role?: "admin" | "user";
};

type AuthContextType = {
  user: UserType | null;
  loading: boolean;
  error: Error | null;
  setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  fetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUser(null); // Clear previous user before fetching

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error("Error fetching user: " + userError.message);

      if (!user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, user_id, full_name, educational_background, profile_picture, date_of_birth"
        )
        .eq("user_id", user.id)
        .single();

      if (profileError)
        throw new Error("Error fetching profile: " + profileError.message);

      const userProfile: UserType = {
        id: profileData.id,
        user_id: user.id,
        full_name: profileData.full_name || "User",
        educational_background: profileData.educational_background || "Not provided",
        profile_picture: profileData.profile_picture || "/img/defaultProfileImage.png",
        date_of_birth: profileData.date_of_birth || "Not provided",
        email: user.email || "No email", 
        role: user.user_metadata?.role, // Add role from user_metadata
      };
      

      setUser(userProfile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, _session) => {
        fetchUser(); // Automatically refetch user on login/logout
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, error, setUser, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
