import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Book, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Course, CourseEnrollment } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CourseEnrollmentProps {
  onlyShowEnrolled?: boolean;
  onEnrollmentChange?: () => void;
}

interface EnrollmentsResponse {
  enrollments: CourseEnrollment[];
}

interface CoursesResponse {
  courses: Course[];
}

const CourseEnrollment: React.FC<CourseEnrollmentProps> = ({ onlyShowEnrolled = false, onEnrollmentChange }) => {
  const { toast } = useToast();
  const [enrollingSemester, setEnrollingSemester] = useState<string>('current');
  const queryClient = useQueryClient();

  // Get available courses
  const { 
    data: coursesData, 
    isLoading: isCoursesLoading 
  } = useQuery<CoursesResponse>({
    queryKey: ['/api/courses'],
  });

  // Get user enrollments
  const { 
    data: enrollmentsData, 
    isLoading: isEnrollmentsLoading 
  } = useQuery<EnrollmentsResponse>({
    queryKey: ['/api/enrollments'],
  });

  // Enroll in course mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to enroll in course');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      toast({
        title: "Success",
        description: "You've been enrolled in the course",
      });
      if (onEnrollmentChange) onEnrollmentChange();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unenroll from course mutation
  const unenrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await fetch(`/api/enrollments/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unenroll from course');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      toast({
        title: "Success",
        description: "You've been unenrolled from the course",
      });
      if (onEnrollmentChange) onEnrollmentChange();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isCoursesLoading || isEnrollmentsLoading;

  // Get enrolled course IDs
  const enrolledCourseIds = enrollmentsData?.enrollments
    ? enrollmentsData.enrollments.filter(e => e.isActive).map(e => e.courseId)
    : [];

  // Filter courses based on enrollment status and semester
  const getDisplayCourses = () => {
    if (!coursesData?.courses) return [];
    
    const filteredCourses = coursesData.courses.filter(course => {
      const isEnrolled = enrolledCourseIds.includes(course.id);
      
      if (onlyShowEnrolled) {
        return isEnrolled;
      }
      
      if (enrollingSemester === 'current') {
        return course.semester === '1'; // Just an example, update based on your semester logic
      }
      
      return true;
    });
    
    return filteredCourses;
  };

  const displayCourses = getDisplayCourses();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="w-full">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!onlyShowEnrolled && (!displayCourses || displayCourses.length === 0)) {
    return (
      <div className="text-center py-8">
        <Book className="h-12 w-12 text-forest-400 mx-auto" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No courses available</h3>
        <p className="mt-1 text-sm text-gray-500">No courses are currently available for enrollment.</p>
      </div>
    );
  }

  if (onlyShowEnrolled && (!displayCourses || displayCourses.length === 0)) {
    return (
      <div className="text-center py-8">
        <Book className="h-12 w-12 text-forest-400 mx-auto" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Not enrolled in any courses</h3>
        <p className="mt-1 text-sm text-gray-500">You are not currently enrolled in any courses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!onlyShowEnrolled && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-forest-800">Course Enrollment</h2>
          <div className="flex space-x-2">
            <Button
              variant={enrollingSemester === 'current' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEnrollingSemester('current')}
            >
              Current Semester
            </Button>
            <Button
              variant={enrollingSemester === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEnrollingSemester('all')}
            >
              All Courses
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayCourses.map(course => {
          const isEnrolled = enrolledCourseIds.includes(course.id);
          
          return (
            <Card key={course.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge 
                    className={isEnrolled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                  >
                    {course.level || '100L'}
                  </Badge>
                  <Badge 
                    className={course.faculty === 'Science' ? "bg-blue-100 text-blue-800" : 
                             course.faculty === 'Computing' ? "bg-purple-100 text-purple-800" :
                             "bg-amber-100 text-amber-800"}
                  >
                    {course.faculty || 'General'}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2">{course.code}: {course.title}</CardTitle>
                <CardDescription className="text-sm">{course.description || `Course materials and resources for ${course.title}`}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="flex items-center">
                    {isEnrolled ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                        <span>Enrolled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-gray-400 mr-1" />
                        <span>Not enrolled</span>
                      </>
                    )}
                  </span>
                  <span className="mx-2">•</span>
                  <span>Semester: {course.semester || '1'}</span>
                </div>
              </CardContent>
              <CardFooter>
                {isEnrolled ? (
                  <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => unenrollMutation.mutate(course.id)}
                    disabled={unenrollMutation.isPending}
                  >
                    Unenroll from Course
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-forest-600 hover:bg-forest-700"
                    onClick={() => enrollMutation.mutate(course.id)}
                    disabled={enrollMutation.isPending}
                  >
                    Enroll in Course
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CourseEnrollment; 