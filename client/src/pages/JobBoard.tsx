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
  Filter,
  PlusCircle
} from 'lucide-react';
import { Job } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface JobsResponse {
  jobs: Job[];
}
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
import { useAuthContext } from '@/context/AuthContext';

// Location filter component
const LocationFilterSelect = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-[140px]">
      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
      <SelectValue placeholder="Location" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem value="all">All Locations</SelectItem>
        <SelectItem value="remote">Remote</SelectItem>
        <SelectItem value="lagos">Lagos</SelectItem>
        <SelectItem value="abuja">Abuja</SelectItem>
        <SelectItem value="port harcourt">Port Harcourt</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
);

// Job type filter component
const JobTypeFilterSelect = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-[140px]">
      <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
      <SelectValue placeholder="Job Type" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem value="all">All Types</SelectItem>
        <SelectItem value="full-time">Full-time</SelectItem>
        <SelectItem value="part-time">Part-time</SelectItem>
        <SelectItem value="internship">Internship</SelectItem>
        <SelectItem value="remote">Remote</SelectItem>
        <SelectItem value="hybrid">Hybrid</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
);

// Faculty filter component
const FacultyFilterSelect = ({ value, onChange, faculties }: { value: string, onChange: (value: string) => void, faculties: string[] }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-[140px]">
      <GraduationCap className="h-4 w-4 mr-1 text-gray-400" />
      <SelectValue placeholder="Faculty" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem value="all">All Faculties</SelectItem>
        {faculties.map(fac => (
          <SelectItem key={fac} value={fac.toLowerCase()}>
            {fac}
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  </Select>
);

const JobBoard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationType, setLocationType] = useState<string>('all');
  const [jobType, setJobType] = useState<string>('all');
  const [faculty, setFaculty] = useState<string>('all');
  const { user } = useAuthContext();
  
  // Get jobs with filters as query parameters
  const { data, isLoading, error } = useQuery<JobsResponse>({
    queryKey: [
      '/api/jobs', 
      { 
        location: locationType === 'all' ? '' : locationType, 
        type: jobType === 'all' ? '' : jobType, 
        faculty: faculty === 'all' ? '' : faculty 
      }
    ],
  });

  // Filter jobs by search term (client-side)
  const getFilteredJobs = () => {
    if (!data?.jobs) return [];
    
    if (!searchTerm.trim()) return data.jobs;
    
    return data.jobs.filter((job: Job) => 
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-forest-800 mb-2">Job Board</h1>
            <p className="text-gray-600">Find your next successful career opportunity</p>
          </div>
          
          <Link href="/jobs/new">
            <a>
              <Button className="mt-4 sm:mt-0 bg-forest-600 hover:bg-forest-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                Post a Job
              </Button>
            </a>
          </Link>
        </div>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center">
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
          
          <div className="flex space-x-2">
            <LocationFilterSelect value={locationType} onChange={setLocationType} />
            <JobTypeFilterSelect value={jobType} onChange={setJobType} />
            <FacultyFilterSelect value={faculty} onChange={setFaculty} faculties={faculties} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="pb-6">
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job: Job) => (
            <Card key={job.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Building className="h-3.5 w-3.5 mr-1 text-gray-400" />
                      {job.company}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobTypeBadgeColor(job.type)}`}>
                    {job.type || 'Not specified'}
                  </span>
                </div>
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
                  <a>
                    <Button variant="default" size="sm" className="bg-forest-600 hover:bg-forest-700">
                      View Details
                    </Button>
                  </a>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <h3 className="text-xl font-medium text-gray-700 mb-4">No Jobs Found</h3>
          <p className="text-gray-600 mb-6">No job opportunities are available at the moment.</p>
          <Link href="/jobs/new">
            <a>
              <Button className="bg-forest-600 hover:bg-forest-700">
                Post a Job
              </Button>
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

export default JobBoard;
