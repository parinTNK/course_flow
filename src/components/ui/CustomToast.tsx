import React from 'react';
import { toast } from 'sonner';

type ToastType = 'success' | 'info' | 'error' | 'warning';

interface CustomToastProps {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export const useCustomToast = () => {
  const showToast = ({
    type = 'info',
    title,
    description = '',
    duration = 3000,
  }: CustomToastProps) => {
    const bgColor = 
      type === 'success' ? 'bg-green-500' : 
      type === 'info' ? 'bg-blue-500' : 
      type === 'error' ? 'bg-red-500' : 
      'bg-yellow-500'; // for warning
      
    toast.custom(
      (t) => (
        <CustomToastComponent 
          t={t} 
          title={title} 
          description={description} 
          bgColor={bgColor} 
        />
      ),
      { duration }
    );
  };

  return {
    success: (title: string, description?: string, duration?: number) => 
      showToast({ type: 'success', title, description, duration }),
    info: (title: string, description?: string, duration?: number) => 
      showToast({ type: 'info', title, description, duration }),
    error: (title: string, description?: string, duration?: number) => 
      showToast({ type: 'error', title, description, duration }),
    warning: (title: string, description?: string, duration?: number) => 
      showToast({ type: 'warning', title, description, duration }),
    custom: showToast,
  };
};

interface CustomToastComponentProps {
  t: any;
  title: string;
  description?: string;
  bgColor: string;
}

const CustomToastComponent: React.FC<CustomToastComponentProps> = ({ 
  t, 
  title, 
  description, 
  bgColor 
}) => {
  return (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full ${bgColor} shadow-lg rounded-lg pointer-events-auto flex p-3`}
    >
      <div className="flex items-start w-[500px]">
        <div className="ml-3 flex-1">
          <p className="text-lg font-semibold text-white">{title}</p>
          {description && (
            <p className="mt-1 text-sm text-white opacity-90">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomToastComponent;