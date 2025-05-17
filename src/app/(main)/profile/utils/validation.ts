export interface ValidationError {
  field: string;
  message: string;
}

export const validateProfileForm = (formData: any, file: File | null): ValidationError[] => {
  const errors: ValidationError[] = [];
  const nameRegex = /^[A-Za-z' -]{3,100}$/;
  const nameSpecialCharRegex = /^[A-Za-z' -]*$/;
  const schoolSpecialCharRegex = /^[A-Za-z0-9' -]*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const today = new Date().toISOString().split("T")[0];
  const minAgeDate = new Date();
  minAgeDate.setFullYear(minAgeDate.getFullYear() - 6);
  const minAgeDateString = minAgeDate.toISOString().split("T")[0];

  if (formData.firstName && formData.firstName.length < 3) {
    errors.push({
      field: "firstName",
      message: "Name must be at least 3 characters long",
    });
  }

  if (formData.firstName && formData.firstName.length > 100) {
    errors.push({
      field: "firstName",
      message: "Name must not exceed 100 characters",
    });
  }

  if (formData.firstName && !nameSpecialCharRegex.test(formData.firstName)) {
    errors.push({
      field: "firstName",
      message: "Name must not contain special characters like %^&*",
    });
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
