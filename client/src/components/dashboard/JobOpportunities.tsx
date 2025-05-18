import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { MapPin } from 'lucide-react';
import { Job } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const JobOpportunities: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/jobs'],
  });

  // Format date to relative time
  const getPostedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Get badge color based on job type
  const getJobTypeBadgeColor = (type: string | undefined) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    
    switch (type.toLowerCase()) {
      case 'remote':
        return 'bg-green-100 text-green-800';
      case 'hybrid':
        return 'bg-blue-100 text-blue-800';
      case 'part-time':
        return 'bg-yellow-100 text-yellow-800';
      case 'full-time':
        return 'bg-purple-100 text-purple-800';
      case 'internship':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-16 w-full mb-2" />
              <Skeleton className="h-16 w-full mb-2" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-forest-800 mb-6">Recent Job Opportunities</h2>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
            <p>Failed to load job opportunities. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  const jobs = data?.jobs || [];

  return (
    <div className="mt-8">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-forest-800">Recent Job Opportunities</h2>
          <Link href="/jobs">
            <a className="text-forest-600 text-sm hover:text-forest-800 font-medium">View All Jobs</a>
          </Link>
        </div>
        
        {jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-forest-50 text-forest-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Posted</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.slice(0, 3).map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800">{job.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{job.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1 text-forest-500" />
                        <span>{job.location || 'Remote'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getJobTypeBadgeColor(job.type)}`}>
                        {job.type || 'Not specified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getPostedDate(job.postedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/jobs/${job.id}`}>
                        <a className="text-forest-600 hover:text-forest-800">Apply</a>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p className="text-gray-600">No job opportunities available at the moment.</p>
            <Link href="/jobs">
              <a className="mt-4 inline-block text-forest-600 hover:text-forest-800 font-medium">
                Check Back Later
              </a>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobOpportunities;
