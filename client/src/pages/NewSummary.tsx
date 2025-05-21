import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import { ArrowLeft, Sparkles } from 'lucide-react';

type FormData = {
  courseId: string;
  title: string;
  topic: string;
};

type Course = {
  id: number;
  code: string;
  title: string;
};

interface CoursesResponse {
  courses: Course[];
}

const NewSummary: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuthContext();
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  // Get courses for selection
  const { data: coursesData, isLoading: isCoursesLoading } = useQuery<CoursesResponse>({
    queryKey: ['/api/courses'],
  });

  const saveMaterialMutation = useMutation({
    mutationFn: async (materialData: any) => {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materialData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save summary');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: 'Success!',
        description: 'Summary saved successfully.',
      });
      navigate('/summary');
    },
    onError: (error) => {
      console.error('Error saving summary:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save summary. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsGenerating(true);
      const selectedCourse = coursesData?.courses.find(course => course.id.toString() === data.courseId);
      
      if (!selectedCourse) {
        throw new Error('Invalid course selected');
      }
      
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseCode: selectedCourse.code,
          topic: data.topic,
          title: data.title
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to generate summary');
      }
      
      setGeneratedSummary(result.summary);
      toast({
        title: 'Success!',
        description: 'Summary generated successfully.',
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate summary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSummary = async () => {
    try {
      const courseId = watch('courseId');
      const title = watch('title');
      const topic = watch('topic');
      
      saveMaterialMutation.mutate({
        title: title,
        courseId: parseInt(courseId),
        type: 'Summary',
        description: `Summary for ${topic}`,
        content: generatedSummary
      });
    } catch (error) {
      console.error('Error saving summary:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save summary. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 px-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/summary')}
        className="mb-6 text-forest-600 hover:text-forest-800 hover:bg-forest-50"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Summaries
      </Button>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create a New Summary</CardTitle>
          <CardDescription>
            Generate AI-powered summaries for course topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="courseId">Course</Label>
              {isCoursesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select {...register('courseId', { required: 'Course is required' })}>
                  <SelectTrigger className={errors.courseId ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {coursesData?.courses?.map(course => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.code} - {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.courseId && (
                <p className="text-sm text-red-500">{errors.courseId.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Summary title"
                {...register('title', { required: 'Title is required' })}
                className={errors.title ? 'border-red-300' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="Topic to generate summary for"
                {...register('topic', { required: 'Topic is required' })}
                className={errors.topic ? 'border-red-300' : ''}
              />
              {errors.topic && (
                <p className="text-sm text-red-500">{errors.topic.message}</p>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/summary')}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isGenerating || saveMaterialMutation.isPending}
            className="bg-forest-600 hover:bg-forest-700"
          >
            {isGenerating ? 'Generating...' : 'Generate Summary'}
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
      
      {generatedSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Summary</CardTitle>
            <CardDescription>
              Review the generated summary and save it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: generatedSummary.replace(/\n/g, '<br />') }} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleSaveSummary}
              disabled={saveMaterialMutation.isPending}
              className="bg-forest-600 hover:bg-forest-700"
            >
              {saveMaterialMutation.isPending ? 'Saving...' : 'Save Summary'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default NewSummary; 