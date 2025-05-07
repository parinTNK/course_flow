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
  
    
    if (!data.name.trim()) {
      errors.push({
        field: 'name',
        message: 'กรุณาระบุชื่อ',
      });
    } else if (data.name.length < 2) {
      errors.push({
        field: 'name',
        message: 'ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร',
      });
    }
  
   
    if (!data.dob) {
      errors.push({
        field: 'dob',
        message: 'กรุณาระบุวันเกิด',
      });
    } else {
      const dobDate = new Date(data.dob);
      const currentDate = new Date();
      let age = currentDate.getFullYear() - dobDate.getFullYear();
      const monthDiff = currentDate.getMonth() - dobDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < dobDate.getDate())) {
        age--;
      }
      
      
      if (dobDate > currentDate) {
        errors.push({
          field: 'dob',
          message: 'วันเกิดไม่สามารถเป็นวันในอนาคต',
        });
      } else if (age < 18) {
        errors.push({
          field: 'dob',
          message: 'คุณต้องมีอายุอย่างน้อย 18 ปี',
        });
      }
    }
  
    
    if (!data.education.trim()) {
      errors.push({
        field: 'education',
        message: 'กรุณาระบุข้อมูลการศึกษา',
      });
    }
  
    
    if (!data.email.trim()) {
      errors.push({
        field: 'email',
        message: 'กรุณาระบุอีเมล',
      });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push({
          field: 'email',
          message: 'กรุณาระบุอีเมลที่ถูกต้อง',
        });
      }
    }
  
    
    if (!data.password) {
      errors.push({
        field: 'password',
        message: 'กรุณาระบุรหัสผ่าน',
      });
    } else if (data.password.length < 6) {
      errors.push({
        field: 'password',
        message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร',
      });
    } else if (!/[A-Z]/.test(data.password)) {
      errors.push({
        field: 'password',
        message: 'รหัสผ่านต้องมีตัวอักษรตัวใหญ่อย่างน้อย 1 ตัว',
      });
    } else if (!/[0-9]/.test(data.password)) {
      errors.push({
        field: 'password',
        message: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว',
      });
    }
  
    return errors;
  }