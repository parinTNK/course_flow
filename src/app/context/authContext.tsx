"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

type UserType = {
  id: string;
  user_id: string;
  full_name: string;
  educational_background: string;
  profile_picture: string;
  date_of_birth: string;
};

type AuthContextType = {
  user: UserType | null;
  loading: boolean;
  error: Error | null;
  authStateChanged: boolean; // New state to track auth changes
  setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  fetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authStateChanged, setAuthStateChanged] = useState(false); // New state

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      // const userToken = localStorage.getItem("userToken") as string;
      // const { data: { user }, error: userError } = await supabase.auth.getUser(userToken);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

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

      if (profileData) {
        const userProfile: UserType = {
          id: profileData.id,
          user_id: user.id,
          full_name: profileData.full_name || "User",
          educational_background:
            profileData.educational_background || "Not provided",
          profile_picture:
            profileData.profile_picture || "/img/defaultProfileImage.png",
          date_of_birth: profileData.date_of_birth || "Not provided",
        };
        setUser(userProfile);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );
      setUser(null);
    } finally {
      setLoading(false);
      setAuthStateChanged(true);
    }
  };

  useEffect(() => {
    fetchUser();

    
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, _session) => {
        fetchUser();
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, authStateChanged, setUser, fetchUser }}
    >
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
