export interface ValidationError {
  field: string;
  message: string;
}

export const validateProfileForm = (formData: any, file: File | null): ValidationError[] => {
  const errors: ValidationError[] = [];
  const nameRegex = /^[A-Za-z' -]{3,100}$/;
  const nameSpecialCharRegex = /^[A-Za-z' -]*$/;
  const nameNumberRegex = /^[^0-9]*$/;
  // Add regex to check for both numbers and special characters
  const nameHasNumber = /[0-9]/;
  const nameHasSpecialChar = /[^A-Za-z0-9' -]/;
  const schoolSpecialCharRegex = /^[A-Za-z0-9' -]*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const today = new Date().toISOString().split("T")[0];
  const minAgeDate = new Date();
  minAgeDate.setFullYear(minAgeDate.getFullYear() - 6);
  const minAgeDateString = minAgeDate.toISOString().split("T")[0];

  if (formData.firstName) {
    const hasNumber = nameHasNumber.test(formData.firstName);
    const hasSpecialChar = nameHasSpecialChar.test(formData.firstName);

    if (formData.firstName.length < 2) {
      errors.push({
        field: "firstName",
        message: "Name must be at least 2 characters long",
      });
    }

    if (formData.firstName.length > 100) {
      errors.push({
        field: "firstName",
        message: "Name must not exceed 100 characters",
      });
    }

    if (hasNumber && hasSpecialChar) {
      errors.push({
        field: "firstName",
        message: "Name must not contain both numbers and special characters",
      });
    } else if (hasNumber) {
      errors.push({
        field: "firstName",
        message: "Name must not contain numbers",
      });
    } else if (hasSpecialChar) {
      errors.push({
        field: "firstName",
        message: "Name must not contain special characters like %^&*",
      });
    }
  }

  if (formData.school && !schoolSpecialCharRegex.test(formData.school)) {
    errors.push({
      field: "school",
      message: "School must not contain special characters like %^&*",
    });
  }

  if (formData.email && !emailRegex.test(formData.email)) {
    errors.push({
      field: "email",
      message: "Email must be valid and contain @ and .com",
    });
  }

  if (formData.dob && formData.dob > today) {
    errors.push({
      field: "dob",
      message: "Date of birth cannot be in the future",
    });
  }

  if (formData.dob && formData.dob > minAgeDateString) {
    errors.push({
      field: "dob",
      message: "You must be at least 6 years old",
    });
  }

  if (file && file.size > 5 * 1024 * 1024) {
    errors.push({
      field: "file",
      message: "Image size must not exceed 5MB",
    });
  }

  return errors;
};

export const validateNewEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Email must be valid and contain @ and .com";
  }
  return null;
};
