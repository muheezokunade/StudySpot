import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import { ArrowLeft, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type FormData = {
  title: string;
  company: string;
  location: string;
  type: string;
  faculty: string;
  description: string;
  requirements: string;
  applicationUrl: string;
};

const NewJob: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  const jobTypes = [
    { id: 'full-time', name: 'Full-time' },
    { id: 'part-time', name: 'Part-time' },
    { id: 'remote', name: 'Remote' },
    { id: 'hybrid', name: 'Hybrid' },
    { id: 'internship', name: 'Internship' },
  ];

  const faculties = [
    { id: 'Science', name: 'Science' },
    { id: 'Arts', name: 'Arts' }, 
    { id: 'Social Sciences', name: 'Social Sciences' },
    { id: 'Computing', name: 'Computing' },
    { id: 'Law', name: 'Law' },
    { id: 'Education', name: 'Education' },
    { id: 'Business', name: 'Business' },
    { id: 'Engineering', name: 'Engineering' },
    { id: 'Health Sciences', name: 'Health Sciences' },
  ];

  const createJobMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create job posting');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: 'Success!',
        description: 'Job posting has been created.',
      });
      navigate('/jobs');
    },
    onError: (error) => {
      console.error('Error creating job:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create job. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: FormData) => {
    createJobMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto my-8 px-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/jobs')}
        className="mb-6 text-forest-600 hover:text-forest-800 hover:bg-forest-50"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Jobs
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Post a New Job</CardTitle>
          <CardDescription>
            Create a new job opportunity for NOUN students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="Enter job title"
                {...register('title', { required: 'Job title is required' })}
                className={errors.title ? 'border-red-300' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Enter company name"
                {...register('company', { required: 'Company name is required' })}
                className={errors.company ? 'border-red-300' : ''}
              />
              {errors.company && (
                <p className="text-sm text-red-500">{errors.company.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Job location"
                  {...register('location')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Job Type</Label>
                <Select {...register('type')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="faculty">Faculty (Optional)</Label>
              <Select {...register('faculty')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relevant faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map(faculty => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the job responsibilities and details"
                rows={5}
                {...register('description', { required: 'Description is required' })}
                className={errors.description ? 'border-red-300' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                placeholder="List job requirements and qualifications"
                rows={3}
                {...register('requirements')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="applicationUrl">Application URL</Label>
              <Input
                id="applicationUrl"
                placeholder="Link where students can apply"
                type="url"
                {...register('applicationUrl')}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/jobs')}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || createJobMutation.isPending}
            className="bg-forest-600 hover:bg-forest-700"
          >
            {createJobMutation.isPending ? 'Posting...' : 'Post Job'}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewJob; 