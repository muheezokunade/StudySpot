import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Search, 
  MapPin, 
  Building, 
  Calendar, 
  Briefcase,
  GraduationCap,
  Filter
} from 'lucide-react';
import { Job } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';

const JobBoard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationType, setLocationType] = useState<string>('');
  const [jobType, setJobType] = useState<string>('');
  const [faculty, setFaculty] = useState<string>('');
  
  // Get jobs with filters as query parameters
  const { data, isLoading, error } = useQuery({
    queryKey: [
      '/api/jobs', 
      { location: locationType, type: jobType, faculty }
    ],
  });

  // Filter jobs by search term (client-side)
  const getFilteredJobs = () => {
    if (!data?.jobs) return [];
    
    if (!searchTerm.trim()) return data.jobs;
    
    return data.jobs.filter(job => 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.requirements?.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  // Format posted date
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

  const filteredJobs = getFilteredJobs();

  const faculties = [
    "Science", "Arts", "Social Sciences", "Computing", 
    "Law", "Education", "Business", "Engineering", "Health Sciences"
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="glass-card p-6 mb-8">
        <h1 className="text-2xl font-bold text-forest-800 mb-2">Job Board</h1>
        <p className="text-gray-600">Find your next successful career opportunity</p>
        
        <div className="mt-6 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search jobs by title, company, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger className="w-[140px]">
                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all_locations">All Locations</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="lagos">Lagos</SelectItem>
                  <SelectItem value="abuja">Abuja</SelectItem>
                  <SelectItem value="port harcourt">Port Harcourt</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="w-[140px]">
                <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all_types">All Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Select value={faculty} onValueChange={setFaculty}>
              <SelectTrigger className="w-[140px]">
                <GraduationCap className="h-4 w-4 mr-1 text-gray-400" />
                <SelectValue placeholder="Faculty" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all_faculties">All Faculties</SelectItem>
                  {faculties.map(fac => (
                    <SelectItem key={fac} value={fac.toLowerCase()}>
                      {fac}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-6 text-center">
          <h2 className="text-xl font-semibold text-forest-800 mb-4">Error Loading Jobs</h2>
          <p className="text-gray-600 mb-4">
            We encountered an error while loading job listings. Please try again later.
          </p>
          <Button 
            variant="default" 
            className="bg-forest-600 hover:bg-forest-700"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map(job => (
            <Card key={job.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getJobTypeBadgeColor(job.type)}`}>
                    {job.type || 'Not specified'}
                  </span>
                </div>
                <CardDescription className="flex items-center mt-1">
                  <Building className="h-4 w-4 mr-1 text-gray-500" />
                  {job.company}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 mr-1 text-forest-500" />
                  <span className="text-sm">{job.location || 'Remote'}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {job.description || 'No description provided'}
                </p>
                {job.requirements && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700">Requirements:</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {job.requirements}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center border-t pt-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{getPostedDate(job.postedAt)}</span>
                </div>
                
                <Link href={`/jobs/${job.id}`}>
                  <Button variant="default" size="sm" className="bg-forest-600 hover:bg-forest-700">
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="glass-card p-6 text-center">
          <Filter className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-forest-800 mb-2">No Jobs Found</h2>
          <p className="text-gray-600 mb-4">
            {searchTerm || locationType || jobType || faculty 
              ? "No jobs match your current filters. Try adjusting your search criteria." 
              : "No job opportunities are available at the moment."}
          </p>
          
          {(searchTerm || locationType || jobType || faculty) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setLocationType('');
                setJobType('');
                setFaculty('');
              }}
              className="text-forest-600 border-forest-600 hover:bg-forest-50"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default JobBoard;
