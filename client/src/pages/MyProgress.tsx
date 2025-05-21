import React from 'react';
import CourseProgress from '../components/progress/CourseProgress';

const MyProgress: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Learning Progress</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Track your progress across all enrolled courses. Mark materials as completed as you go through them.
      </p>
      
      <CourseProgress />
    </div>
  );
};

export default MyProgress; 