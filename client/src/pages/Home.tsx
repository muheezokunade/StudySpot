import React from 'react';
import { useQuery } from '@tanstack/react-query';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import RecentProgress from '@/components/dashboard/RecentProgress';
import UpcomingExams from '@/components/dashboard/UpcomingExams';
import CourseMaterials from '@/components/dashboard/CourseMaterials';
import ForumHighlights from '@/components/dashboard/ForumHighlights';
import JobOpportunities from '@/components/dashboard/JobOpportunities';
import { Exam, Course } from '@/types';

interface HomeProps {
  onAIChatOpen: () => void;
}

const Home: React.FC<HomeProps> = ({ onAIChatOpen }) => {
  const { data: examsData } = useQuery({
    queryKey: ['/api/exams'],
  });

  const { data: coursesData } = useQuery({
    queryKey: ['/api/courses'],
  });

  // Get nearest upcoming exam
  const getUpcomingExam = (exams: Exam[], courses: Course[]) => {
    const now = new Date();
    const upcomingExams = exams
      .filter(exam => exam.date && new Date(exam.date) > now)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
    
    if (upcomingExams.length === 0) return null;
    
    const nearestExam = upcomingExams[0];
    const course = courses.find(c => c.id === nearestExam.courseId);
    
    if (!course) return null;
    
    const daysUntil = Math.ceil(
      (new Date(nearestExam.date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      course: course.code,
      daysUntil
    };
  };

  const upcomingExam = examsData?.exams && coursesData?.courses
    ? getUpcomingExam(examsData.exams, coursesData.courses)
    : undefined;

  return (
    <>
      <WelcomeBanner upcomingExam={upcomingExam} onAIChatOpen={onAIChatOpen} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RecentProgress />
        <UpcomingExams />
        <CourseMaterials />
        <ForumHighlights />
      </div>
      
      <JobOpportunities />
    </>
  );
};

export default Home;
