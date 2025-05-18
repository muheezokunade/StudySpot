import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { BookOpen } from 'lucide-react';
import { Exam, Course } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const UpcomingExams: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/exams'],
  });

  const { data: coursesData } = useQuery({
    queryKey: ['/api/courses'],
  });

  // Format exams with their course details and calculated days until exam
  const formatUpcomingExams = (exams: Exam[], courses: Course[]) => {
    return exams
      .filter(exam => exam.date && new Date(exam.date) > new Date())
      .map(exam => {
        const course = courses.find(c => c.id === exam.courseId);
        const daysUntil = calculateDaysUntil(new Date(exam.date as string));
        
        return {
          id: exam.id,
          courseId: exam.courseId,
          code: course?.code || 'Unknown Course',
          title: course?.title || 'Unknown Course',
          description: exam.description,
          date: exam.date as string,
          daysUntil
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3); // Get the 3 nearest upcoming exams
  };

  const calculateDaysUntil = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get status color based on days until exam
  const getStatusColor = (daysUntil: number) => {
    if (daysUntil <= 3) return 'bg-red-500';
    if (daysUntil <= 7) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  // Get text color based on days until exam
  const getTextColor = (daysUntil: number) => {
    if (daysUntil <= 3) return 'text-red-600';
    if (daysUntil <= 7) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const upcomingExams = data?.exams && coursesData?.courses 
    ? formatUpcomingExams(data.exams, coursesData.courses) 
    : [];

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-forest-800 mb-4">Upcoming Exams</h2>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
          <p>Failed to load upcoming exams. Please try again later.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-forest-800">Upcoming Exams</h2>
        <Link href="/exam-prep">
          <div className="text-forest-600 text-sm hover:text-forest-800 font-medium cursor-pointer">View All</div>
        </Link>
      </div>
      
      {upcomingExams.length > 0 ? (
        <div className="space-y-3">
          {upcomingExams.map((exam) => (
            <div 
              key={exam.id} 
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 relative"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(exam.daysUntil)} rounded-l-lg`}></div>
              <div className="pl-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-800">{exam.code}</h3>
                  <span className={`${getTextColor(exam.daysUntil)} text-sm font-medium`}>
                    {exam.daysUntil === 1 ? 'Tomorrow' : `${exam.daysUntil} days`}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{exam.title}</p>
                <div className="flex items-center mt-3">
                  <Link href={`/exam-prep/${exam.courseId}`}>
                    <div className="text-sm bg-forest-50 text-forest-700 px-3 py-1 rounded-md hover:bg-forest-100 transition cursor-pointer inline-flex">
                      <span className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        Study
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-600">No upcoming exams scheduled at the moment.</p>
          <Link href="/exam-prep">
            <div className="mt-4 inline-block text-forest-600 hover:text-forest-800 font-medium cursor-pointer">
              Browse Exam Prep Materials
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default UpcomingExams;
