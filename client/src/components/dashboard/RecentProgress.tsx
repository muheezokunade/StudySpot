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
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 col-span-1 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-forest-800">Your Recent Progress</h2>
        <Link href="/profile">
          <a className="text-forest-600 text-sm hover:text-forest-800 font-medium">View All</a>
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
            <a className="mt-4 inline-block text-forest-600 hover:text-forest-800 font-medium">
              Start with Exam Prep
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentProgress;
