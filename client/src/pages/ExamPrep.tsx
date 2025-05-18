import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  CalendarDays, 
  Clock, 
  BookOpen, 
  FileText, 
  Search,
  ChevronRight
} from 'lucide-react';
import { Exam, Course } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ExamPrep: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [examType, setExamType] = useState<'all' | 'e-exam' | 'pop'>('all');
  
  // Get exams and courses
  const { data: examsData, isLoading: isExamsLoading } = useQuery({
    queryKey: ['/api/exams'],
  });

  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses'],
  });

  // Filter and group exams by type and date
  const prepareExamData = () => {
    if (!examsData?.exams || !coursesData?.courses) return { upcoming: [], past: [] };
    
    const now = new Date();
    const exams = examsData.exams.map(exam => {
      const course = coursesData.courses.find(c => c.id === exam.courseId);
      return { ...exam, course };
    });
    
    // Filter by search term and exam type
    const filteredExams = exams.filter(exam => {
      const courseMatch = exam.course && (
        exam.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.course.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const titleMatch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = examType === 'all' || 
        (examType === 'e-exam' && exam.type.toLowerCase().includes('e-exam')) ||
        (examType === 'pop' && exam.type.toLowerCase().includes('pen'));
      
      return (courseMatch || titleMatch) && typeMatch;
    });
    
    // Sort by date and split into upcoming and past
    const upcoming = filteredExams
      .filter(exam => new Date(exam.date!) > now)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
    
    const past = filteredExams
      .filter(exam => !exam.date || new Date(exam.date) <= now)
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    
    return { upcoming, past };
  };

  const { upcoming, past } = prepareExamData();
  const isLoading = isExamsLoading || isCoursesLoading;

  // Format date for display
  const formatExamDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  // Calculate days until exam
  const getDaysUntil = (dateString: string) => {
    const examDate = new Date(dateString);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const diffTime = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  // Get status color based on exam date
  const getStatusColor = (dateString: string) => {
    const daysUntil = getDaysUntil(dateString);
    if (daysUntil === 'Today') return 'bg-red-500';
    if (daysUntil === 'Tomorrow') return 'bg-red-500';
    if (parseInt(daysUntil) <= 3) return 'bg-red-500';
    if (parseInt(daysUntil) <= 7) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="glass-card p-6 mb-8">
        <h1 className="text-2xl font-bold text-forest-800 mb-2">Exam Preparation</h1>
        <p className="text-gray-600">Prepare for your E-exams and Pen-on-Paper (PoP) assessments</p>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          <Tabs defaultValue="all" onValueChange={(value) => setExamType(value as 'all' | 'e-exam' | 'pop')}>
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="all">All Exams</TabsTrigger>
              <TabsTrigger value="e-exam">E-Exams</TabsTrigger>
              <TabsTrigger value="pop">PoP Exams</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </div>
          
          <div className="glass-card p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Exams Section */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-forest-800 mb-4">Upcoming Exams</h2>
            
            {upcoming.length > 0 ? (
              <div className="space-y-4">
                {upcoming.map((exam) => (
                  <div 
                    key={exam.id} 
                    className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 relative"
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(exam.date!)} rounded-l-lg`}></div>
                    <div className="pl-2">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <div>
                          <h3 className="font-medium text-lg text-gray-800">
                            {exam.course?.code}: {exam.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{exam.course?.title}</p>
                        </div>
                        <div className="mt-2 sm:mt-0 flex flex-col sm:items-end">
                          <div className="flex items-center text-forest-700">
                            <CalendarDays className="h-4 w-4 mr-1" />
                            <span className="text-sm">{formatExamDate(exam.date!)}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-1 text-red-500" />
                            <span className="text-sm font-medium text-red-600">
                              {getDaysUntil(exam.date!)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Link href={`/exam-prep/${exam.courseId}`}>
                          <Button variant="outline" size="sm" className="flex items-center text-forest-700 border-forest-200 bg-forest-50 hover:bg-forest-100">
                            <BookOpen className="h-4 w-4 mr-1.5" />
                            Study Materials
                          </Button>
                        </Link>
                        <Link href={`/exam-prep/${exam.courseId}/mock`}>
                          <Button variant="outline" size="sm" className="flex items-center text-forest-700 border-forest-200 bg-forest-50 hover:bg-forest-100">
                            <FileText className="h-4 w-4 mr-1.5" />
                            Practice Questions
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-600">No upcoming exams matching your criteria.</p>
                {searchTerm && (
                  <button
                    className="mt-2 text-forest-600 hover:text-forest-800 font-medium"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Past Exams Section */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-forest-800 mb-4">Past Exams</h2>
            
            {past.length > 0 ? (
              <div className="space-y-4">
                {past.map((exam) => (
                  <div 
                    key={exam.id} 
                    className="bg-white rounded-lg p-5 shadow-sm border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                      <div>
                        <h3 className="font-medium text-lg text-gray-800">
                          {exam.course?.code}: {exam.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{exam.course?.title}</p>
                      </div>
                      {exam.date && (
                        <div className="mt-2 sm:mt-0 flex items-center text-gray-500">
                          <CalendarDays className="h-4 w-4 mr-1" />
                          <span className="text-sm">{formatExamDate(exam.date)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <Link href={`/exam-prep/${exam.courseId}/practice`}>
                        <Button variant="default" size="sm" className="flex items-center bg-forest-600 hover:bg-forest-700">
                          Practice with Past Questions
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-600">No past exams matching your criteria.</p>
                {searchTerm && (
                  <button
                    className="mt-2 text-forest-600 hover:text-forest-800 font-medium"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPrep;
