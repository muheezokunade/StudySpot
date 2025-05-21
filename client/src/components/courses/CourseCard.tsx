import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: number;
  code: string;
  title: string;
  description: string;
  level: string;
  faculty: string;
  semester: string;
}

interface CourseCardProps {
  course: Course;
  isEnrolled?: boolean;
  onEnrollmentChange?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isEnrolled: initialIsEnrolled, onEnrollmentChange }) => {
  const navigate = useNavigate();
  const [isEnrolled, setIsEnrolled] = useState<boolean>(initialIsEnrolled || false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check authentication status
    checkAuthentication();
    
    // Check enrollment status if not provided
    if (initialIsEnrolled === undefined) {
      checkEnrollmentStatus();
    }
  }, [course.id, initialIsEnrolled]);

  const checkAuthentication = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      console.log('Authentication check response:', response.data);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Not authenticated:', err);
      setIsAuthenticated(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      console.log(`Checking enrollment status for course ${course.id}`);
      const response = await axios.get(`/api/enrollments/${course.id}`);
      console.log('Enrollment status response:', response.data);
      setIsEnrolled(response.data.isEnrolled);
    } catch (err: any) {
      console.error('Error checking enrollment status:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
    }
  };

  const handleEnrollment = async () => {
    if (!isAuthenticated) {
      setError('You must be logged in to enroll in courses');
      alert('Please log in to enroll in courses');
      navigate('/login');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isEnrolled) {
        // Unenroll
        console.log(`Attempting to unenroll from course ${course.id}`);
        const response = await axios.delete(`/api/enrollments/${course.id}`);
        console.log('Unenrollment response:', response.data);
        setIsEnrolled(false);
      } else {
        // Enroll
        console.log(`Attempting to enroll in course ${course.id}`);
        console.log('Request payload:', { courseId: course.id });
        const response = await axios.post('/api/enrollments', { courseId: course.id });
        console.log('Enrollment response:', response.data);
        setIsEnrolled(true);
      }
      
      if (onEnrollmentChange) {
        onEnrollmentChange();
      }
    } catch (err: any) {
      console.error('Enrollment error:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        
        // Handle authentication errors
        if (err.response.status === 401) {
          alert('Your session has expired. Please log in again.');
          navigate('/login');
        }
      }
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{course.code}</p>
        </div>
        <div className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          {course.level || 'All Levels'}
        </div>
      </div>

      {course.description && (
        <p className="text-gray-600 dark:text-gray-300 mt-3 mb-4 text-sm">{course.description}</p>
      )}
      
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {course.faculty && <span className="mr-3">{course.faculty}</span>}
          {course.semester && <span>Semester: {course.semester}</span>}
        </div>
        
        <button
          onClick={handleEnrollment}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isEnrolled
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-100'
              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-100'
          } transition-colors duration-300`}
        >
          {isLoading 
            ? 'Processing...' 
            : isEnrolled 
              ? 'Unenroll' 
              : 'Enroll'
          }
        </button>
      </div>
      
      {!isAuthenticated && (
        <p className="text-amber-500 text-xs mt-2">
          <a href="#" onClick={handleLoginClick} className="underline">Log in</a> to enroll in this course
        </p>
      )}
      
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

export default CourseCard; 