import React from 'react';
import ExamTimetable from '../components/exams/ExamTimetable';

const ExamSchedule: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Exam Schedule</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage your personal exam schedule for all enrolled courses. You can add, edit, and delete exam entries.
      </p>
      
      <ExamTimetable />
    </div>
  );
};

export default ExamSchedule; 