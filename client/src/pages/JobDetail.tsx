import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${id}`);
        const data = await response.json();
        setJob(data.job);
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  if (loading) {
    return <div className="text-center py-10">Loading job details...</div>;
  }

  if (!job) {
    return <div className="text-center py-10">Job not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">{job.title}</h1>
        <div className="mb-6">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {job.type}
          </span>
          <span className="ml-2 text-gray-600">Posted by {job.author?.name || 'Anonymous'}</span>
        </div>
        <div className="prose max-w-none mb-6">
          <p>{job.description}</p>
        </div>
        <div className="border-t pt-4">
          <h2 className="font-semibold text-lg mb-2">Contact Information</h2>
          <p>{job.contactEmail}</p>
        </div>
      </div>
    </div>
  );
};

export default JobDetail; 