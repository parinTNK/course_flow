export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface AdminProfile {
  id: string;
  role: string;
  email: string;
}

export interface LoginState {
  loading: boolean;
  error: string | null;
}

export interface AdminLoginResponse {
  success: boolean;
  error?: string | null;
  userId?: string;
  email?: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export interface AdminSessionResponse {
  isAdmin: boolean;
  user?: AdminProfile;
}
