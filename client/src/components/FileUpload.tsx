import React, { useState, useRef } from "react";
import { FiUpload, FiFile, FiX, FiCheck } from "react-icons/fi";

interface FileUploadProps {
  onUpload: (file: File, title: string) => Promise<void>;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || 
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setSelectedFile(file);
        // Prefill title with filename (without extension)
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setTitle(fileName);
      } else {
        setUploadError("Only PDF and DOCX files are allowed");
      }
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || 
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setSelectedFile(file);
        // Prefill title with filename (without extension)
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setTitle(fileName);
      } else {
        setUploadError("Only PDF and DOCX files are allowed");
      }
    }
  };
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setTitle("");
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      setUploadError("Please select a file and provide a title");
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      await onUpload(selectedFile, title);
      setUploadSuccess(true);
      // Reset form after 2 seconds
      setTimeout(() => {
        setSelectedFile(null);
        setTitle("");
        setUploadSuccess(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 2000);
    } catch (error) {
      setUploadError("Failed to upload file. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 transition-all ${
          isDragging 
            ? "border-blue-500 bg-blue-50" 
            : selectedFile 
              ? "border-green-500 bg-green-50"
              : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.docx"
          onChange={handleFileInputChange}
        />
        
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center py-4">
            <FiUpload className="text-4xl text-gray-400 mb-2" />
            <p className="text-gray-600 text-center mb-2">
              Drag and drop your PDF or DOCX file here, or click to browse
            </p>
            <button
              type="button"
              onClick={openFileSelector}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Browse Files
            </button>
          </div>
        ) : (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <FiFile className="text-2xl text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="flex-shrink-0 text-gray-500 hover:text-red-500"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        )}
      </div>
      
      {selectedFile && (
        <div className="mt-4">
          <label htmlFor="document-title" className="block text-sm font-medium text-gray-700 mb-1">
            Document Title
          </label>
          <input
            type="text"
            id="document-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a title for your document"
          />
        </div>
      )}
      
      {uploadError && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {uploadError}
        </div>
      )}
      
      {selectedFile && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !title.trim()}
            className={`w-full py-2 px-4 rounded-md text-white font-medium flex items-center justify-center
              ${
                isUploading || !title.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : uploadSuccess
                    ? "bg-green-600"
                    : "bg-blue-600 hover:bg-blue-700"
              }
            `}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : uploadSuccess ? (
              <>
                <FiCheck className="mr-2" />
                Uploaded Successfully
              </>
            ) : (
              "Upload Document"
            )}
          </button>
        </div>
      )}
    </div>
  );
} 