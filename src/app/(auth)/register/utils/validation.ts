export interface ValidationError {
  field: string;
  message: string;
}

export function validateRegisterForm(data: {
  name: string;
  dob: string;
  education: string;
  email: string;
  password: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Name validation (aligned with profile)
  const nameHasNumber = /[0-9]/;
  const nameHasSpecialChar = /[^A-Za-z0-9' -]/;

  if (!data.name?.trim()) {
    errors.push({
      field: 'name',
      message: 'please enter your name',
    });
  } else {
    const hasNumber = nameHasNumber.test(data.name);
    const hasSpecialChar = nameHasSpecialChar.test(data.name);

    if (data.name.length < 2) {
      errors.push({
        field: 'name',
        message: 'name must be at least 2 characters long',
      });
    }

    if (data.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'name cannot exceed 100 characters',
      });
    }

    if (hasNumber && hasSpecialChar) {
      errors.push({
        field: 'name',
        message: 'name must not contain both numbers and special characters',
      });
    } else if (hasNumber) {
      errors.push({
        field: 'name',
        message: 'name must not contain numbers',
      });
    } else if (hasSpecialChar) {
      errors.push({
        field: 'name',
        message: 'name must not contain special characters like %^&*',
      });
    }
  }
  
  // Date of birth validation
  if (!data.dob) {
    errors.push({
      field: 'dob',
      message: 'please enter your date of birth',
    });
  } else {
    const dobDate = new Date(data.dob);
    const currentDate = new Date();
    
    // Check if date is valid
    if (isNaN(dobDate.getTime())) {
      errors.push({
        field: 'dob',
        message: 'please enter a valid date of birth',
      });
    } else {
      let age = currentDate.getFullYear() - dobDate.getFullYear();
      const monthDiff = currentDate.getMonth() - dobDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < dobDate.getDate())) {
        age--;
      }
      
      if (dobDate > currentDate) {
        errors.push({
          field: 'dob',
          message: 'please enter a valid date of birth',
        });
      } else if (age < 12) {
        errors.push({
          field: 'dob',
          message: 'you must be at least 12 years old',
        });
      } else if (age > 120) {
        errors.push({
          field: 'dob',
          message: 'please enter a valid date of birth',
        });
      }
    }
  }
  
  // Education validation
  if (!data.education?.trim()) {
    errors.push({
      field: 'education',
      message: 'please enter your educational background',
    });
  } else if (data.education.length > 200) {
    errors.push({
      field: 'education',
      message: 'educational background cannot exceed 200 characters',
    });
  }
  
  // Email validation
  if (!data.email?.trim()) {
    errors.push({
      field: 'email',
      message: 'please enter your email',
    });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push({
        field: 'email',
        message: 'please enter a valid email address',
      });
    } else if (data.email.length > 100) {
      errors.push({
        field: 'email',
        message: 'email cannot exceed 100 characters',
      });
    }
  }
  
  // Password validation
  if (!data.password) {
    errors.push({
      field: 'password',
      message: 'please enter your password',
    });
  } else if (data.password.length < 6) {
    errors.push({
      field: 'password',
      message: 'password must be at least 6 characters long',
    });
  } else if (data.password.length > 100) {
    errors.push({
      field: 'password',
      message: 'password cannot exceed 100 characters',
    });
  } else {
    const passwordChecks = {
      uppercase: /[A-Z]/.test(data.password),
      number: /[0-9]/.test(data.password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(data.password)
    };
    
    if (!passwordChecks.uppercase) {
      errors.push({
        field: 'password',
        message: 'password must contain at least one uppercase letter',
      });
    } else if (!passwordChecks.number) {
      errors.push({
        field: 'password',
        message: 'password must contain at least one number',
      });
    }
    
    else if (!passwordChecks.special) {
      errors.push({
        field: 'password',
        message: 'password must contain at least one special character',
      });
    }
  }
  
  return errors;
}