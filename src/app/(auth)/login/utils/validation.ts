
export function validateEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email format";
    }
    return null;
  }
  
  export function validatePassword(password: string): string | null {
    if (!password || password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;
  }