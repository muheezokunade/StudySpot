import React from 'react';
import { Calendar, File, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { Link } from 'wouter';

interface WelcomeBannerProps {
  upcomingExam?: {
    course: string;
    daysUntil: number;
  };
  onAIChatOpen: () => void;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ upcomingExam, onAIChatOpen }) => {
  const { user } = useAuthContext();

  return (
    <div className="glass-card p-6 mb-8 relative overflow-hidden">
      <div 
        className="absolute inset-0 z-0" 
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&h=400&q=80")', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          opacity: 0.2, 
          filter: 'blur(1px)'
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-forest-800">
              Welcome back, {user?.firstName || 'Student'}!
            </h1>
            <p className="text-gray-600 mt-1">Ready to continue your learning journey?</p>
          </div>
          {upcomingExam && (
            <div className="mt-4 sm:mt-0">
              <div className="rounded-full bg-white bg-opacity-80 backdrop-blur-sm px-4 py-2 text-forest-800 flex items-center shadow-sm">
                <Calendar className="h-5 w-5 mr-2 text-lime-500" />
                <span>{upcomingExam.course} Exam in {upcomingExam.daysUntil} days</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
          <Link href="/summary">
            <Button className="bg-forest-600 text-white px-5 py-2.5 rounded-lg hover:bg-forest-700 transition flex items-center">
              <File className="h-5 w-5 mr-1.5" />
              Resume Learning
            </Button>
          </Link>
          <Link href="/exam-prep">
            <Button variant="outline" className="bg-white text-forest-700 px-5 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center">
              <BookIcon className="h-5 w-5 mr-1.5 text-forest-600" />
              E-Exam Prep
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="bg-white text-forest-700 px-5 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center"
            onClick={onAIChatOpen}
          >
            <MessageCircle className="h-5 w-5 mr-1.5 text-lime-500" />
            Ask AI Tutor
          </Button>
        </div>
      </div>
    </div>
  );
};

// Custom BookIcon to match the design
const BookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export default WelcomeBanner;
