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

type FormData = {
  title: string;
  content: string;
  category: string;
  tags: string;
};

const NewForumPost: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuthContext();

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/auth/login');
    return null;
  }

  const categories = [
    { id: 'general', name: 'General Discussion' },
    { id: 'faqs', name: 'FAQs' },
    { id: 'news', name: 'News & Updates' },
    { id: 'resources', name: 'Resources' },
    { id: 'exams', name: 'Exams' },
  ];

  const onSubmit = async (data: FormData) => {
    try {
      // Convert comma-separated tags to array
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()) : [];
      
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          category: data.category,
          tags,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create post');
      }
      
      toast({
        title: 'Success!',
        description: 'Your post has been created.',
      });
      
      // Redirect to the forum post
      navigate(`/forum/${result.post.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 px-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/forum')}
        className="mb-6 text-forest-600 hover:text-forest-800 hover:bg-forest-50"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Forum
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Create a New Forum Post</CardTitle>
          <CardDescription>
            Share your questions, insights, or resources with the NOUN Success community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter a descriptive title"
                {...register('title', { required: 'Title is required' })}
                className={errors.title ? 'border-red-300' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                {...register('category', { required: 'Category is required' })}
                defaultValue="general"
              >
                <SelectTrigger className={errors.category ? 'border-red-300' : ''}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your post content here..."
                rows={8}
                {...register('content', { required: 'Content is required' })}
                className={errors.content ? 'border-red-300' : ''}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                placeholder="Enter tags separated by commas (e.g. MTH103, exam, question)"
                {...register('tags')}
              />
              <p className="text-xs text-gray-500">
                Tags help others find your post more easily
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/forum')}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-forest-600 hover:bg-forest-700"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewForumPost; 