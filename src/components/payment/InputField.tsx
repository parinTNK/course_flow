import {forwardRef} from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  className?: string;
};

const InputField = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, ...props }, ref) => (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        ref={ref}
        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white ${
          error ? "border-red-500" : ""
        }`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
);

export default InputField;
