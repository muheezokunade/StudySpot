import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PDFViewer from '../components/materials/PDFViewer';

interface Material {
  id: number;
  courseId: number;
  title: string;
  type: string;
  content: string;
}

interface Course {
  id: number;
  code: string;
  title: string;
}

const MaterialView: React.FC = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (materialId) {
      fetchMaterial(parseInt(materialId));
    }
  }, [materialId]);

  const fetchMaterial = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/materials/${id}/view`);
      setMaterial(response.data.material);
      
      // Fetch course details
      if (response.data.material?.courseId) {
        const courseResponse = await axios.get(`/api/courses/${response.data.material.courseId}`);
        setCourse(courseResponse.data.course);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You must be enrolled in this course to view this material');
      } else {
        setError(err.response?.data?.message || 'Failed to load material');
      }
      console.error('Error loading material:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCompletion = async () => {
    try {
      if (!material) return;
      
      await axios.post('/api/progress', {
        courseId: material.courseId,
        materialId: material.id,
        completed: true
      });
      
      // Show confirmation message
      alert('Material marked as completed!');
    } catch (err: any) {
      console.error('Error marking completion:', err);
      alert('Failed to mark material as completed');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-1" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
          Back
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => navigate('/courses')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Available Courses
          </button>
        </div>
      ) : !material ? (
        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-yellow-600 dark:text-yellow-400">Material not found</p>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            {course && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {course.code} - {course.title}
              </div>
            )}
            <h1 className="text-2xl font-bold">{material.title}</h1>
          </div>
          
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleMarkCompletion}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Mark as Completed
            </button>
          </div>
          
          {materialId && <PDFViewer materialId={parseInt(materialId)} />}
        </div>
      )}
    </div>
  );
};

export default MaterialView; 