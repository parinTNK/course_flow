import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Download } from 'lucide-react';

interface FileUploadProps {
  onFileUpdate: (fileUrl: string | null, fileName: string | null) => void;
  existingFileUrl?: string | null;
  existingFileName?: string | null;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpdate,
  existingFileUrl,
  existingFileName,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    'application/pdf'
  ];

  const maxSizeInBytes = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF files are allowed.');
      return;
    }

    if (file.size > maxSizeInBytes) {
      setError('File size must be less than 10MB.');
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use the simpler API endpoint
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Upload failed';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      onFileUpdate(result.url, result.fileName);
      setUploadProgress(100);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = async () => {
    if (existingFileUrl && existingFileUrl.includes('supabase')) {
      try {
        // Use the API endpoint to delete the file
        const response = await fetch(`/api/admin/upload-file?fileUrl=${encodeURIComponent(existingFileUrl)}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const result = await response.json();
          console.error('Error deleting file:', result.error);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
    
    onFileUpdate(null, null);
  };

  const handleDownload = () => {
    if (existingFileUrl) {
      window.open(existingFileUrl, '_blank');
    }
  };

  if (existingFileUrl && existingFileName) {
    return (
      <div className="w-[240px] h-[240px] relative flex flex-col items-center justify-center rounded-lg p-4 text-center bg-[#F6F7FC] border border-gray-200">
        <div className="flex flex-col items-center justify-center space-y-3">
          <FileText className="w-12 h-12 text-blue-500" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 break-words">
              {existingFileName}
            </p>
            <p className="text-xs text-gray-500 mt-1">PDF File</p>
          </div>
          
          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200"
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={handleRemoveFile}
          disabled={disabled}
          className="absolute top-1 right-2 w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 z-10 disabled:opacity-50"
          title="Remove file"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf"
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
      />
      
      <div
        className={`w-[240px] h-[240px] border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-[#F6F7FC] hover:bg-gray-50'
        } ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-600">Uploading...</p>
            <p className="text-xs text-gray-500">{uploadProgress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <FileText className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-sm text-blue-500 font-medium">Upload PDF</p>
            <p className="text-xs text-gray-500 mt-1">Max 10MB</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
