import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Search, 
  Filter, 
  User,
  MessageSquare, 
  Eye, 
  Clock, 
  PlusCircle
} from 'lucide-react';
import { ForumPost } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';

const Forum: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Get forum posts with category filter
  const { data, isLoading, error } = useQuery({
    queryKey: [
      '/api/forum/posts', 
      { category: activeCategory !== 'all' ? activeCategory : undefined }
    ],
  });

  // Filter posts by search term (client-side)
  const getFilteredPosts = () => {
    if (!data?.posts) return [];
    
    if (!searchTerm.trim()) return data.posts;
    
    return data.posts.filter(post => 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.tags && post.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  };

  // Format time ago from date
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h ago`;
    
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Get color for category badge
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'faqs':
        return 'bg-blue-100 text-blue-800';
      case 'news':
        return 'bg-purple-100 text-purple-800';
      case 'resources':
        return 'bg-green-100 text-green-800';
      case 'exams':
        return 'bg-red-100 text-red-800';
      case 'general':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-forest-100 text-forest-800';
    }
  };

  const filteredPosts = getFilteredPosts();
  
  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'faqs', name: 'FAQs' },
    { id: 'news', name: 'News & Updates' },
    { id: 'resources', name: 'Resources' },
    { id: 'exams', name: 'Exams' },
    { id: 'general', name: 'General Discussion' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="glass-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-forest-800 mb-2">NOUN Success Forum</h1>
            <p className="text-gray-600">Connect with fellow students, ask questions, and share resources</p>
          </div>
          
          <Link href="/forum/new">
            <Button className="mt-4 sm:mt-0 bg-forest-600 hover:bg-forest-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search forum posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
      
      <div className="glass-card p-6">
        <Tabs defaultValue="all" onValueChange={setActiveCategory}>
          <TabsList className="mb-6 flex overflow-x-auto space-x-1 pb-px">
            {categories.map(category => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="px-4 py-2 rounded-md data-[state=active]:bg-forest-100 data-[state=active]:text-forest-800"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeCategory} className="mt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-40 w-full rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Forum Posts</h3>
                <p className="text-gray-500 mb-4">We encountered an error while loading forum posts. Please try again later.</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="text-forest-600 border-forest-600 hover:bg-forest-50"
                >
                  Refresh Page
                </Button>
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map(post => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="bg-forest-100 text-forest-800 rounded-full w-8 h-8 flex items-center justify-center font-medium text-sm mr-3">
                            {post.author?.firstName.charAt(0) || 'U'}
                          </div>
                          <div>
                            <h3 className="text-base font-medium">{post.author?.firstName || 'Unknown User'}</h3>
                            <p className="text-xs text-gray-500">{getTimeAgo(post.createdAt)}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(post.category)}`}>
                          {post.category}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/forum/${post.id}`}>
                        <a className="block">
                          <CardTitle className="text-lg hover:text-forest-600 transition-colors mb-2">
                            {post.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {post.content}
                          </CardDescription>
                        </a>
                      </Link>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {post.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-2 pb-4 text-sm text-gray-500 border-t">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {post.replyCount || 0} replies
                        </span>
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {post.views} views
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Filter className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Posts Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? `No posts match "${searchTerm}". Try a different search term.` 
                    : activeCategory !== 'all' 
                      ? `No posts found in the "${activeCategory}" category.` 
                      : "No forum posts yet. Be the first to start a discussion!"}
                </p>
                
                {searchTerm ? (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                    className="text-forest-600 border-forest-600 hover:bg-forest-50 mr-2"
                  >
                    Clear Search
                  </Button>
                ) : (
                  <Link href="/forum/new">
                    <Button className="bg-forest-600 hover:bg-forest-700">
                      Create a Post
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Forum;
