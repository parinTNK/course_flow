

import { ValidationResult, UserCredentials } from "../type";

export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return {
      isValid: false,
      errorMessage: "Email is required",
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      errorMessage: "Invalid email format",
    };
  }

  return {
    isValid: true,
    errorMessage: null,
  };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password.trim()) {
    return {
      isValid: false,
      errorMessage: "Password is required",
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      errorMessage: "Password must be at least 6 characters",
    };
  }

  return {
    isValid: true,
    errorMessage: null,
  };
};

export const validateLoginForm = (credentials: UserCredentials): ValidationResult => {
  const { email, password } = credentials;
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }

  return {
    isValid: true,
    errorMessage: null,
  };
};

// For translating Supabase error messages
export const translateAuthError = (errorMessage: string): string => {
  switch (true) {
    case errorMessage.includes("Invalid login"):
      return "Invalid email or password";
    case errorMessage.includes("not authorized"):
    case errorMessage.includes("authorized"):
      return "You are not authorized to access this page";
    case errorMessage.includes("Email not confirmed"):
      return "Please confirm your email before logging in";
    case errorMessage.includes("rate limit"):
      return "Too many login attempts. Please try again later";
    default:
      return "An error occurred. Please try again";
  }
};