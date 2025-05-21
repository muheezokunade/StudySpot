import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CourseMaterial {
  id: number;
  courseId: number;
  title: string;
  type: string;
  content: string;
  fileUrl?: string;
  pages?: number;
}

interface PDFViewerProps {
  materialId: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ materialId }) => {
  const [material, setMaterial] = useState<CourseMaterial | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterial();
  }, [materialId]);

  const fetchMaterial = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/materials/${materialId}/view`);
      setMaterial(response.data.material);
      
      if (response.data.pdfUrl) {
        setPdfUrl(response.data.pdfUrl);
      } else {
        setError('This material does not have an associated PDF file.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load the material');
      console.error('Error loading material:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchMaterial}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!material || !pdfUrl) {
    return (
      <div className="w-full p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-yellow-600 dark:text-yellow-400">No material found or PDF is not available.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">{material.title}</h2>
        {material.content && (
          <p className="text-gray-600 dark:text-gray-300 mb-4">{material.content}</p>
        )}
        {material.pages && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Pages: {material.pages}</p>
        )}
      </div>

      <div className="w-full h-[70vh] border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
        <iframe
          src={pdfUrl}
          title={material.title}
          className="w-full h-full"
          frameBorder="0"
        />
      </div>
    </div>
  );
};

export default PDFViewer; 