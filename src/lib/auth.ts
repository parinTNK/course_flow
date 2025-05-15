import { supabase } from "./supabaseClient";

// ฟังก์ชันตรวจสอบว่ากำลังทำงานในฝั่ง client หรือไม่
const isClient = () => typeof window !== 'undefined';

export const signIn = async (email: string, password: string, forceUserMode = false) => {
  try {
    console.log("Attempting to sign in with email:", email);
    
    // เรียก API เพียงครั้งเดียว
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log("Sign in response:", {
      success: !!response.data.user,
      error: response.error?.message
    });
    
    // ถ้าเกิด error ให้ return เลย
    if (response.error) {
      return response;
    }
    
    // จัดการกับ localStorage เฉพาะในฝั่ง client
    if (isClient() && response.data.session && response.data.user) {
      console.log("Storing session in localStorage");
      
      // เก็บข้อมูล token ไว้ใน localStorage
      // อัพเดท supabase_auth_token ซึ่งเป็น default ที่ supabase ใช้
      localStorage.setItem('supabase_auth_token', JSON.stringify({
        access_token: response.data.session.access_token,
        refresh_token: response.data.session.refresh_token,
        expires_at: response.data.session.expires_at
      }));
      
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
    const result = await supabase.auth.signOut();
    
    if (isClient()) {
      console.log("Clearing session from localStorage");
      
      // ลบ supabase token
      localStorage.removeItem('supabase_auth_token');
      
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
    
    return result;
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
    // เช็คกับ Supabase ก่อนเสมอเพื่อให้แน่ใจว่ามี session ที่ valid
    const { data } = await supabase.auth.getSession();
    
    // ถ้ามี session ถือว่า authenticated
    if (data.session) {
      return true;
    }
    
    // ถ้าไม่มี session ในฝั่ง supabase แต่อยู่ในฝั่ง client
    if (isClient()) {
      // ตรวจสอบทั้ง adminToken และ userToken
      const adminToken = localStorage.getItem("adminToken");
      const userToken = localStorage.getItem("userToken");
      
      if (adminToken || userToken) {
        // มี token แต่ไม่มี session ใน supabase
        // ลองทำการ refresh
        return await attemptTokenRefresh();
      }
    }
    
    // ไม่มี session และไม่มี token ใน localStorage
    return false;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

async function attemptTokenRefresh(): Promise<boolean> {
  try {
    // ใช้ supabase built-in refresh
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error("Failed to refresh token:", error);
      // ลบ token ที่ไม่ถูกต้องออก
      clearAuthTokens();
      return false;
    }
    
    console.log("Session refreshed successfully");
    // อัพเดท token ใน localStorage
    if (isClient()) {
      await updateAuthTokens(data.session);
    }
    return true;
  } catch (err) {
    console.error("Error refreshing token:", err);
    clearAuthTokens();
    return false;
  }
}


export const isAdmin = async (): Promise<boolean> => {
  try {
    // ตรวจสอบการล็อกอินก่อน
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      console.log("User is not authenticated");
      return false;
    }
    
    // เช็คจาก localStorage ก่อน (เร็วกว่า)
    if (isClient()) {
      if (localStorage.getItem("isAdmin") === "true") {
        return true;
      }
      
      // เช็คจาก adminUser object
      const adminUserStr = localStorage.getItem("adminUser");
      if (adminUserStr) {
        try {
          const adminUser = JSON.parse(adminUserStr);
          if (adminUser.role === 'admin') {
            return true;
          }
        } catch (err) {
          console.warn("Error parsing adminUser from localStorage:", err);
        }
      }
    }
    
    // เช็คกับ Supabase API
    const { data } = await supabase.auth.getUser();
    return data.user?.user_metadata?.role === 'admin';
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// ฟังก์ชันสำหรับเช็คว่าเป็น user ทั่วไป (ไม่ใช่ admin)
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
    
    // อัพเดท supabase_auth_token ก่อน
    localStorage.setItem('supabase_auth_token', JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at
    }));
    
    // เช็คประเภท token ปัจจุบัน
    const hasUserToken = !!localStorage.getItem("userToken");
    const hasAdminToken = !!localStorage.getItem("adminToken");
    
    // ส่วนที่เหลือคงเดิม
    if (hasUserToken) {
      localStorage.setItem("userToken", session.access_token);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("isAdmin");
      console.log("Preserved userToken during refresh");
    } else if (hasAdminToken) {
      localStorage.setItem("adminToken", session.access_token);
      localStorage.removeItem("userToken");
      localStorage.setItem("isAdmin", "true");
      console.log("Preserved adminToken during refresh");
    } else {
      // ตรวจสอบบทบาทจาก session
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
    
    // อัพเดท refresh token และเวลาหมดอายุ
    localStorage.setItem("refreshToken", session.refresh_token);
    localStorage.setItem("expiresAt", String(session.expires_at));
    
    // อัพเดทข้อมูลผู้ใช้ (คุณสามารถเพิ่มโค้ดเพิ่มเติมตรงนี้ได้)
  } catch (error) {
    console.error("Error updating auth tokens:", error);
  }
};

const clearAuthTokens = () => {
  if (!isClient()) return;
  
  try {
    console.log("Clearing auth tokens from localStorage");
    
    // ลบ supabase token ด้วย
    localStorage.removeItem('supabase_auth_token');
    
    // ลบข้อมูลอื่นๆ
    localStorage.removeItem("adminToken");
    localStorage.removeItem("userToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expiresAt");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("user_uid");
    localStorage.removeItem("isAdmin");
    
    // ลบคีย์เก่า
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user_id");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_expires_at");
  } catch (error) {
    console.error("Error clearing auth tokens:", error);
  }
};

// ฟังก์ชันสำหรับตรวจสอบข้อมูล token
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
