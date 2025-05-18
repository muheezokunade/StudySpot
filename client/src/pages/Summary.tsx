import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Clock, 
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { Course, CourseMaterial } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const Summary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get courses and materials
  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses'],
  });

  const { data: materialsData, isLoading: isMaterialsLoading } = useQuery({
    queryKey: ['/api/materials'],
  });

  // Get user progress
  const { data: progressData, isLoading: isProgressLoading } = useQuery({
    queryKey: ['/api/progress'],
  });

  const isLoading = isCoursesLoading || isMaterialsLoading || isProgressLoading;

  // Filter courses by search term
  const getFilteredCourses = () => {
    if (!coursesData?.courses) return [];
    
    return coursesData.courses.filter(course => 
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get materials for a course
  const getMaterialsForCourse = (courseId: number) => {
    if (!materialsData?.materials) return [];
    
    return materialsData.materials.filter(material => 
      material.courseId === courseId
    );
  };

  // Calculate course progress
  const getCourseProgress = (courseId: number) => {
    if (!progressData?.progress) return 0;
    
    const courseMaterials = getMaterialsForCourse(courseId);
    if (courseMaterials.length === 0) return 0;
    
    const completedMaterials = progressData.progress.filter(p => 
      p.courseId === courseId && 
      p.materialId && 
      p.completed
    );
    
    return Math.round((completedMaterials.length / courseMaterials.length) * 100) || 0;
  };

  // Get material icon based on type
  const getMaterialIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'video':
        return <Play className="h-5 w-5 text-gray-500" />;
      case 'quiz':
        return <BookOpen className="h-5 w-5 text-gray-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredCourses = getFilteredCourses();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="glass-card p-6 mb-8">
        <h1 className="text-2xl font-bold text-forest-800 mb-2">Summary Success</h1>
        <p className="text-gray-600">Read summarized notes and test your knowledge with quizzes</p>
        
        <div className="mt-6 relative">
          <Input
            type="text"
            placeholder="Search courses or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full sm:w-96"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-6">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-4 w-full max-w-md mb-6" />
              <div className="mb-4">
                <Skeleton className="h-2 w-full mb-2" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(j => (
                  <Skeleton key={j} className="h-48 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCourses.length > 0 ? (
            filteredCourses.map(course => {
              const materials = getMaterialsForCourse(course.id);
              const progress = getCourseProgress(course.id);
              
              return (
                <div key={course.id} className="glass-card p-6">
                  <h2 className="text-xl font-semibold text-forest-800">{course.code}: {course.title}</h2>
                  <p className="text-gray-600 mt-1 mb-4">{course.description || `Study materials and summaries for ${course.title}`}</p>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Course Progress</span>
                      <span className="text-sm font-medium text-forest-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-gray-200" />
                  </div>
                  
                  {materials.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {materials.map(material => (
                        <Card key={material.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="bg-gray-100 p-2 rounded-lg">
                                {getMaterialIcon(material.type)}
                              </div>
                              <span className="text-xs font-medium bg-gray-100 rounded-md px-2 py-0.5 text-gray-600">
                                {material.type}
                              </span>
                            </div>
                            <CardTitle className="text-base mt-2">{material.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {material.content}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center text-xs text-gray-500">
                                {material.duration ? (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>{material.duration}</span>
                                  </>
                                ) : material.pages ? (
                                  <>
                                    <FileText className="h-3 w-3 mr-1" />
                                    <span>{material.pages} pages</span>
                                  </>
                                ) : material.questions ? (
                                  <>
                                    <BarChart3 className="h-3 w-3 mr-1" />
                                    <span>{material.questions} questions</span>
                                  </>
                                ) : null}
                              </div>
                              
                              <Link href={`/summary/${material.id}`}>
                                <a className="text-forest-600 hover:text-forest-800 text-sm flex items-center">
                                  <span>Start</span>
                                  <CheckCircle className="ml-1 h-4 w-4" />
                                </a>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <p className="text-gray-600">No study materials available for this course yet.</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="glass-card p-6 text-center">
              <h2 className="text-xl font-semibold text-forest-800 mb-4">No Courses Found</h2>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `No courses match "${searchTerm}". Try a different search term.` 
                  : "No courses are available at the moment."}
              </p>
              
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  className="text-forest-600 border-forest-600 hover:bg-forest-50"
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Custom Play icon since it's not in the imported icons
const Play = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default Summary;
