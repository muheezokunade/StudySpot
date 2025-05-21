import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CourseCard from '../components/courses/CourseCard';

interface Course {
  id: number;
  code: string;
  title: string;
  description: string;
  level: string;
  faculty: string;
  semester: string;
}

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/courses');
      setCourses(response.data.courses);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load courses');
      console.error('Error loading courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique faculties from courses
  const faculties = [...new Set(courses.map(course => course.faculty).filter(Boolean))];
  
  // Get unique levels from courses
  const levels = [...new Set(courses.map(course => course.level).filter(Boolean))];

  // Filter courses based on search term and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFaculty = !selectedFaculty || course.faculty === selectedFaculty;
    const matchesLevel = !selectedLevel || course.level === selectedLevel;
    
    return matchesSearch && matchesFaculty && matchesLevel;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Available Courses</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button 
            onClick={fetchCourses}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
      
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-end md:space-x-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium mb-1">Search Courses</label>
          <input
            type="text"
            id="search"
            placeholder="Search by title, code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        
        <div className="w-full md:w-48">
          <label htmlFor="faculty" className="block text-sm font-medium mb-1">Faculty</label>
          <select
            id="faculty"
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="">All Faculties</option>
            {faculties.map(faculty => (
              <option key={faculty} value={faculty}>{faculty}</option>
            ))}
          </select>
        </div>
        
        <div className="w-full md:w-48">
          <label htmlFor="level" className="block text-sm font-medium mb-1">Level</label>
          <select
            id="level"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || selectedFaculty || selectedLevel
              ? 'No courses match your search criteria. Try adjusting your filters.'
              : 'No courses available at the moment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <CourseCard 
              key={course.id} 
              course={course} 
              onEnrollmentChange={fetchCourses} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses; 