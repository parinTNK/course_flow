import { supabase } from "./supabaseClient";

// ฟังก์ชันตรวจสอบว่ากำลังทำงานในฝั่ง client หรือไม่
const isClient = () => typeof window !== 'undefined';

export const signIn = async (email: string, password: string, forceUserMode = false) => {
  try {
    console.log("Attempting to sign in with email:", email);
    
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log("Sign in response:", {
      success: !!response.data.user,
      error: response.error?.message
    });
    
    if (isClient() && response.data.session && response.data.user) {
      console.log("Storing session in localStorage");
      
      if (forceUserMode) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("isAdmin");
        
        localStorage.setItem("userToken", response.data.session.access_token);
      } else {
        const isAdmin = response.data.user.user_metadata?.role === 'admin';
        
        if (isAdmin) {
          localStorage.setItem("adminToken", response.data.session.access_token);
          localStorage.removeItem("userToken");
          localStorage.setItem("isAdmin", "true");
        } else {
          localStorage.setItem("userToken", response.data.session.access_token);
          localStorage.removeItem("adminToken");
          localStorage.removeItem("isAdmin");
        }
      }
      
      localStorage.setItem("refreshToken", response.data.session.refresh_token);
      localStorage.setItem("expiresAt", String(response.data.session.expires_at));
      
      localStorage.setItem("adminUser", JSON.stringify({
        id: response.data.user.id,
        email: response.data.user.email || "",
        name: response.data.user.user_metadata?.name || "",
        role: response.data.user.user_metadata?.role || ""
      }));
      
      localStorage.setItem("user_uid", response.data.user.id);
    }
    
    return response;
  } catch (error) {
    console.error("Error in signIn function:", error);
    return {
      data: { session: null, user: null },
      error: {
        message: error instanceof Error ? error.message : "Unknown error in signIn",
        status: 500
      }
    };
  }
};

export const signOut = async () => {
  try {
    if (isClient()) {
      console.log("Clearing session from localStorage");
    
      localStorage.removeItem("adminToken");
      localStorage.removeItem("userToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("expiresAt");
      
      localStorage.removeItem("adminUser");
      localStorage.removeItem("user_uid");
      localStorage.removeItem("isAdmin");
      
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_refresh_token");
      localStorage.removeItem("admin_user_id");
      localStorage.removeItem("admin_email");
      localStorage.removeItem("admin_expires_at");
    }
    
    return await supabase.auth.signOut();
  } catch (error) {
    console.error("Error in signOut function:", error);
    return { error: { message: "Failed to sign out", status: 500 } };
  }
};

// signUp 
export const signUp = async (email: string, password: string, userData?: any) => {
  try {
    console.log("Attempting to sign up with email:", email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    
    console.log("Sign up response:", { data, error });
    
    if (error) {
      return { error };
    }
    
    return { data };
  } catch (error) {
    console.error("Error in signUp function:", error);
    return { error: { message: "Failed to sign up", status: 500 } };
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    
    if (!isClient()) {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    }
    // ตรวจสอบทั้ง adminToken และ userToken
    const adminToken = localStorage.getItem("adminToken");
    const userToken = localStorage.getItem("userToken");
    
    // ถ้าไม่มี token ใดๆ แสดงว่าไม่ได้ล็อกอิน
    if (!adminToken && !userToken) {
      console.log("No token found in localStorage");
      return false;
    }
    
    // ตรวจสอบการหมดอายุของ token
    const expiresAt = localStorage.getItem("expiresAt");
    if (expiresAt) {
      const expiryTime = parseInt(expiresAt, 10) * 1000; 
      const currentTime = Date.now();
      
      console.log("Token expires at:", new Date(expiryTime).toISOString());
      console.log("Current time:", new Date(currentTime).toISOString());
      
      if (currentTime >= expiryTime) {
        console.log("Token expired, attempting to refresh");
        try {
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error || !data.session) {
            console.error("Failed to refresh session:", error);
            clearAuthTokens();
            return false;
          }
          
          console.log("Session refreshed successfully");
          await updateAuthTokens(data.session);
          return true;
        } catch (err) {
          console.error("Error refreshing session:", err);
          clearAuthTokens();
          return false;
        }
      }
    }

    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

export const isAdmin = async (): Promise<boolean> => {
  try {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      console.log("User is not authenticated");
      return false;
    }
    
    console.log("Checking if user is admin");
    
    // ตรวจสอบจาก adminToken โดยตรง
    if (localStorage.getItem("adminToken")) {
      return true;
    }
    
    // ตรวจสอบจาก isAdmin flag
    if (localStorage.getItem("isAdmin") === "true") {
      return true;
    }
    
    // ตรวจสอบจาก adminUser
    try {
      const adminUserStr = localStorage.getItem("adminUser");
      if (adminUserStr) {
        const adminUser = JSON.parse(adminUserStr);
        if (adminUser.role === 'admin') {
          // อัปเดต adminToken และ isAdmin flag
          const token = localStorage.getItem("userToken");
          if (token) {
            localStorage.setItem("adminToken", token);
            localStorage.removeItem("userToken");
          }
          localStorage.setItem("isAdmin", "true");
          return true;
        }
      }
    } catch (err) {
      console.warn("Error parsing adminUser from localStorage:", err);
    }
    
    // ตรวจสอบจาก Supabase API ถ้าไม่พบข้อมูลใน localStorage
    const { data } = await supabase.auth.getUser();
    const isAdmin = data.user?.user_metadata?.role === 'admin';
    
    // อัปเดต adminToken และ userToken ตามข้อมูลจาก API
    if (isAdmin && localStorage.getItem("userToken")) {
      const token = localStorage.getItem("userToken");
      localStorage.setItem("adminToken", token || "");
      localStorage.removeItem("userToken");
      localStorage.setItem("isAdmin", "true");
    }
    
    console.log("Is admin:", isAdmin);
    return isAdmin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// เพิ่มฟังก์ชันสำหรับเช็คว่าเป็น user ทั่วไป (ไม่ใช่ admin)
export const isRegularUser = async (): Promise<boolean> => {
  try {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return false;
    }
    
    // ตรวจสอบจาก userToken โดยตรง
    if (localStorage.getItem("userToken")) {
      return true;
    }
    
    // ตรวจสอบว่าไม่ใช่ admin
    const admin = await isAdmin();
    return !admin;
  } catch (error) {
    console.error("Error checking regular user status:", error);
    return false;
  }
};

export const refreshToken = async () => {
  try {
    console.log("Attempting to refresh token");
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error("Failed to refresh token:", error);
      if (isClient()) {
        clearAuthTokens();
      }
      return null;
    }
    
    console.log("Token refreshed successfully");
    if (isClient()) {
      await updateAuthTokens(data.session);
    }
    return data.session;
  } catch (err) {
    console.error("Error in refreshToken function:", err);
    if (isClient()) {
      clearAuthTokens();
    }
    return null;
  }
};

const updateAuthTokens = async (session: any) => {
  if (!isClient()) return;
  
  try {
    console.log("Updating auth tokens in localStorage");
    
    // เช็คประเภท token ปัจจุบัน
    const hasUserToken = !!localStorage.getItem("userToken");
    const hasAdminToken = !!localStorage.getItem("adminToken");
    
    // ถ้ามี userToken อยู่แล้ว ให้คงสถานะ userToken ไว้
    if (hasUserToken) {
      localStorage.setItem("userToken", session.access_token);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("isAdmin");
      console.log("Preserved userToken during refresh");
    } 
    // ถ้ามี adminToken อยู่แล้ว ให้คงสถานะ adminToken ไว้
    else if (hasAdminToken) {
      localStorage.setItem("adminToken", session.access_token);
      localStorage.removeItem("userToken");
      localStorage.setItem("isAdmin", "true");
      console.log("Preserved adminToken during refresh");
    } 
    // ถ้าไม่มี token เดิม ให้ตรวจสอบบทบาทแล้วเซ็ต token ตามนั้น
    else {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      const isAdmin = user?.user_metadata?.role === 'admin';
      
      if (isAdmin) {
        localStorage.setItem("adminToken", session.access_token);
        localStorage.removeItem("userToken");
        localStorage.setItem("isAdmin", "true");
      } else {
        localStorage.setItem("userToken", session.access_token);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("isAdmin");
      }
    }
    
    // อัปเดต refresh token และเวลาหมดอายุเสมอ
    localStorage.setItem("refreshToken", session.refresh_token);
    localStorage.setItem("expiresAt", String(session.expires_at));
    
    // อัปเดตข้อมูลผู้ใช้... (ส่วนที่เหลือเหมือนเดิม)
  } catch (error) {
    console.error("Error updating auth tokens:", error);
  }
};

const clearAuthTokens = () => {
  // ลบข้อมูลจาก localStorage เฉพาะเมื่อทำงานในฝั่ง client
  if (!isClient()) return;
  
  try {
    console.log("Clearing auth tokens from localStorage");
    
    // ลบข้อมูลทั้งหมด
    localStorage.removeItem("adminToken");
    localStorage.removeItem("userToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expiresAt");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("user_uid");
    localStorage.removeItem("isAdmin");
    
    // ลบคีย์เก่าด้วย
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user_id");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_expires_at");
  } catch (error) {
    console.error("Error clearing auth tokens:", error);
  }
};

// เพิ่มฟังก์ชันสำหรับตรวจสอบข้อมูล token
export const getTokenInfo = () => {
  if (!isClient()) return null;
  
  try {
    const adminToken = localStorage.getItem("adminToken");
    const userToken = localStorage.getItem("userToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const expiresAt = localStorage.getItem("expiresAt");
    
    let tokenType = "none";
    let activeToken = null;
    
    if (adminToken) {
      tokenType = "admin";
      activeToken = adminToken;
    } else if (userToken) {
      tokenType = "user";
      activeToken = userToken;
    }
    
    // ตรวจสอบการหมดอายุ
    let expiryInfo = null;
    if (expiresAt) {
      const expiryTime = parseInt(expiresAt, 10) * 1000;
      const currentTime = Date.now();
      const timeRemaining = expiryTime - currentTime;
      
      expiryInfo = {
        expiryDate: new Date(expiryTime).toLocaleString(),
        timeRemainingMs: timeRemaining,
        timeRemainingMinutes: Math.floor(timeRemaining / (1000 * 60)),
        isExpired: currentTime >= expiryTime
      };
    }
    
    return {
      hasAdminToken: !!adminToken,
      hasUserToken: !!userToken,
      activeToken: activeToken ? {
        type: tokenType,
        value: activeToken.substring(0, 10) + "..."
      } : null,
      tokenType: tokenType,
      hasRefreshToken: !!refreshToken,
      expiry: expiryInfo
    };
  } catch (error) {
    console.error("Error getting token info:", error);
    return null;
  }
};

// ฟังก์ชันสำหรับตรวจสอบข้อมูลผู้ใช้
export const getUserInfo = () => {
  if (!isClient()) return null;
  
  try {
    // ดึงข้อมูลจาก adminUser
    const adminUserStr = localStorage.getItem("adminUser");
    const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
    
    // ดึง user_uid
    const userId = localStorage.getItem("user_uid");
    
    // ตรวจสอบประเภทผู้ใช้จาก token
    const adminToken = localStorage.getItem("adminToken");
    const userToken = localStorage.getItem("userToken");
    
    let userType = "unknown";
    if (adminToken) {
      userType = "admin";
    } else if (userToken) {
      userType = "regular";
    }
    
    return {
      user: adminUser,
      userId: userId,
      isAdmin: userType === "admin",
      userType: userType,
      tokenType: adminToken ? "adminToken" : userToken ? "userToken" : "none"
    };
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
};
