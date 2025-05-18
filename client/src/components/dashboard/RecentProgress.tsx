import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { UserProgress } from '@/types';
import ProgressCard from './ProgressCard';
import { Skeleton } from '@/components/ui/skeleton';

const RecentProgress: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/progress'],
  });

  // Format progress data for display
  const formatProgressItems = (progress: UserProgress[]) => {
    return progress.map(item => {
      // Determine the type based on what the progress is tracking
      let type: 'quiz' | 'exam' | 'summary' = 'summary';
      if (item.examId) type = 'exam';
      else if (item.materialId && item.material?.type === 'Quiz') type = 'quiz';

      // Format the timestamp
      const date = new Date(item.timestamp);
      const timeAgo = getTimeAgo(date);

      return {
        id: item.id,
        title: item.course ? `${item.course.code}: ${item.material?.title || item.exam?.title || 'Activity'}` : 'Course Activity',
        timestamp: timeAgo,
        score: item.score || 0,
        type
      };
    });
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 3600;
    if (interval > 24) {
      interval = Math.floor(interval / 24);
      return interval === 1 ? 'Yesterday' : `${interval} days ago`;
    }
    if (interval > 1) {
      return `${Math.floor(interval)} hours ago`;
    }
    
    interval = seconds / 60;
    if (interval > 1) {
      return `${Math.floor(interval)} minutes ago`;
    }
    
    return 'Just now';
  };

  const recentProgress = data?.progress ? formatProgressItems(data.progress).slice(0, 3) : [];

  if (isLoading) {
    return (
      <div className="glass-card p-6 col-span-1 md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 col-span-1 md:col-span-2">
        <h2 className="text-xl font-semibold text-forest-800 mb-4">Your Recent Progress</h2>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
          <p>Failed to load your recent progress. Please try again later.</p>
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
    <div className="glass-card p-6 col-span-1 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-forest-800">Your Recent Progress</h2>
        <Link href="/profile">
          <div className="text-forest-600 text-sm hover:text-forest-800 font-medium cursor-pointer">View All</div>
        </Link>
      </div>
      
      {recentProgress.length > 0 ? (
        <div className="space-y-4">
          {recentProgress.map((item) => (
            <ProgressCard
              key={item.id}
              title={item.title}
              timestamp={item.timestamp}
              score={item.score}
              type={item.type}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-600">You haven't made any progress yet. Start learning to see your progress here!</p>
          <Link href="/exam-prep">
            <div className="mt-4 inline-block text-forest-600 hover:text-forest-800 font-medium cursor-pointer">
              Start with Exam Prep
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentProgress;
