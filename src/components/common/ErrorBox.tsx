import { AlertCircle } from "lucide-react";

const ErrorBox = ({ responseMessage, message }: { responseMessage: string, message: string}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-8 flex flex-col items-center shadow-sm">
    <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
    <span className="text-red-600 font-semibold text-lg mb-1">
      {message}
    </span>
    <span className="text-gray-500 text-sm text-center">{responseMessage}</span>
  </div>
);
export default ErrorBox;
