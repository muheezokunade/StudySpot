import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { MessageSquare, Eye } from 'lucide-react';
import { ForumPost } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ForumHighlights: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/forum/posts'],
  });

  // Format time ago from date
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 3600;
    if (interval > 24) {
      interval = Math.floor(interval / 24);
      return interval === 1 ? 'Yesterday' : `${interval}d ago`;
    }
    if (interval > 1) {
      return `${Math.floor(interval)}h ago`;
    }
    
    interval = seconds / 60;
    if (interval > 1) {
      return `${Math.floor(interval)}m ago`;
    }
    
    return 'Just now';
  };

  // Get highlighted posts (newest with most views/replies)
  const getHighlightedPosts = (posts: ForumPost[]) => {
    return posts
      .sort((a, b) => {
        // Sort by newest first, then by engagement (views + replies)
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        const engagementA = a.views + (a.replyCount || 0);
        const engagementB = b.views + (b.replyCount || 0);
        
        if (dateB - dateA === 0) {
          return engagementB - engagementA;
        }
        return dateB - dateA;
      })
      .slice(0, 2); // Get top 2 posts
  };

  const highlightedPosts = data?.posts ? getHighlightedPosts(data.posts) : [];

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-forest-800 mb-4">Forum Highlights</h2>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
          <p>Failed to load forum posts. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-forest-800">Forum Highlights</h2>
        <Link href="/forum">
          <a className="text-forest-600 text-sm hover:text-forest-800 font-medium">View Forum</a>
        </Link>
      </div>
      
      <div className="space-y-3">
        {highlightedPosts.length > 0 ? (
          <>
            {highlightedPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <div className="flex items-start">
                  <div className="bg-mint-light rounded-full p-2 flex-shrink-0">
                    <span className="text-forest-800 font-semibold text-sm">
                      {post.author?.firstName.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <h3 className="font-medium text-sm text-gray-800">
                        {post.author?.firstName || 'Unknown User'}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2">
                        {getTimeAgo(post.createdAt)}
                      </span>
                    </div>
                    <Link href={`/forum/${post.id}`}>
                      <a className="text-sm text-gray-600 mt-1 hover:text-forest-600">
                        {post.title}
                      </a>
                    </Link>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span className="flex items-center mr-3">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span>{post.replyCount || 0} replies</span>
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        <span>{post.views} views</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <Link href="/forum/new">
              <Button className="w-full py-2 text-center text-sm font-medium text-forest-700 bg-mint-50 rounded-lg hover:bg-mint-100 transition-colors">
                Ask a Question
              </Button>
            </Link>
          </>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p className="text-gray-600">No forum posts yet. Be the first to start a discussion!</p>
            <Link href="/forum/new">
              <a className="mt-4 inline-block text-forest-600 hover:text-forest-800 font-medium">
                Create a Post
              </a>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumHighlights;
