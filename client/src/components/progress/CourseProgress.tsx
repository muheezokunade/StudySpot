import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Course {
  id: number;
  code: string;
  title: string;
  description?: string;
  level?: string;
  faculty?: string;
  semester?: string;
}

interface CourseMaterial {
  id: number;
  title: string;
  type: string;
}

interface ProgressEntry {
  id: number;
  userId: number;
  courseId: number;
  materialId: number | null;
  completed: boolean;
  score: number | null;
  timestamp: string;
  course?: Course;
  material?: CourseMaterial;
}

interface CourseWithMaterials {
  course: Course;
  materials: CourseMaterial[];
  progress: ProgressEntry[];
}

const CourseProgress: React.FC = () => {
  const [coursesWithMaterials, setCoursesWithMaterials] = useState<CourseWithMaterials[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch enrolled courses
      const enrollmentsResponse = await axios.get('/api/enrollments');
      const enrolledCourses = enrollmentsResponse.data.enrollments.map(
        (enrollment: any) => enrollment.course
      );

      // Fetch progress data
      const progressResponse = await axios.get('/api/progress');
      const progressData = progressResponse.data.progress;

      // Organize data by course
      const courseData: CourseWithMaterials[] = await Promise.all(
        enrolledCourses.map(async (course: Course) => {
          // Fetch materials for this course
          const materialsResponse = await axios.get(`/api/course/${course.id}/materials`);
          const materials = materialsResponse.data.materials;

          // Filter progress entries for this course
          const courseProgress = progressData.filter(
            (entry: ProgressEntry) => entry.courseId === course.id
          );

          return {
            course,
            materials,
            progress: courseProgress
          };
        })
      );

      setCoursesWithMaterials(courseData);
      
      if (courseData.length > 0 && !selectedCourseId) {
        setSelectedCourseId(courseData[0].course.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load progress data');
      console.error('Error loading progress data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgress = async (courseId: number, materialId: number, completed: boolean) => {
    try {
      await axios.post('/api/progress', {
        courseId,
        materialId,
        completed
      });
      
      // Refresh data
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update progress');
      console.error('Error updating progress:', err);
    }
  };

  const calculateCourseProgress = (courseId: number): number => {
    const courseData = coursesWithMaterials.find(c => c.course.id === courseId);
    
    if (!courseData || courseData.materials.length === 0) {
      return 0;
    }
    
    const completedMaterials = courseData.progress.filter(p => p.completed).length;
    return Math.round((completedMaterials / courseData.materials.length) * 100);
  };

  const isMaterialCompleted = (courseId: number, materialId: number): boolean => {
    const courseData = coursesWithMaterials.find(c => c.course.id === courseId);
    
    if (!courseData) {
      return false;
    }
    
    const progressEntry = courseData.progress.find(
      p => p.materialId === materialId && p.completed
    );
    
    return !!progressEntry;
  };

  if (isLoading && coursesWithMaterials.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (coursesWithMaterials.length === 0) {
    return (
      <div className="w-full p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
        <p className="text-yellow-600 dark:text-yellow-400">
          You're not enrolled in any courses yet. Enroll in courses to track your progress.
        </p>
      </div>
    );
  }

  const selectedCourse = coursesWithMaterials.find(c => c.course.id === selectedCourseId);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6">My Course Progress</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {coursesWithMaterials.map(({ course }) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedCourseId === course.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {course.code}
            </button>
          ))}
        </div>
      </div>
      
      {selectedCourse && (
        <div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{selectedCourse.course.title}</h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {calculateCourseProgress(selectedCourse.course.id)}% Complete
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${calculateCourseProgress(selectedCourse.course.id)}%` }}
              ></div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedCourse.course.description}</p>
          </div>
          
          <h4 className="text-lg font-semibold mb-4">Course Materials</h4>
          
          {selectedCourse.materials.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No materials available for this course yet.</p>
          ) : (
            <div className="space-y-4">
              {selectedCourse.materials.map(material => (
                <div 
                  key={material.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex justify-between items-center"
                >
                  <div>
                    <h5 className="font-medium">{material.title}</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type: {material.type}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <a 
                      href={`/materials/${material.id}`}
                      className="px-3 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 rounded-md text-sm hover:bg-blue-200 dark:hover:bg-blue-900/80 transition-colors"
                    >
                      View
                    </a>
                    
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isMaterialCompleted(selectedCourse.course.id, material.id)}
                        onChange={(e) => updateProgress(
                          selectedCourse.course.id,
                          material.id,
                          e.target.checked
                        )}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                      <span className="ms-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                        {isMaterialCompleted(selectedCourse.course.id, material.id) ? 'Completed' : 'Mark as complete'}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseProgress; 