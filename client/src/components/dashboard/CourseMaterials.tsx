import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Search, Download, BookOpen, Play } from 'lucide-react';
import { CourseMaterial } from '@/types';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const CourseMaterials: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/materials'],
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const getFilteredMaterials = (materials: CourseMaterial[]) => {
    if (!searchTerm.trim()) return materials.slice(0, 6); // Limit to 6 items if no search
    
    return materials.filter(material => 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.content?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 6); // Still limit to 6 even after filtering
  };

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return (
          <div className="bg-forest-100 p-2 rounded-lg">
            <FileIcon className="h-5 w-5 text-forest-600" />
          </div>
        );
      case 'video':
        return (
          <div className="bg-lime-100 p-2 rounded-lg">
            <Play className="h-5 w-5 text-lime-600" />
          </div>
        );
      case 'quiz':
        return (
          <div className="bg-forest-100 p-2 rounded-lg">
            <BookOpen className="h-5 w-5 text-forest-600" />
          </div>
        );
      default:
        return (
          <div className="bg-forest-100 p-2 rounded-lg">
            <FileIcon className="h-5 w-5 text-forest-600" />
          </div>
        );
    }
  };

  // Custom File icon to match design
  const FileIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const filteredMaterials = data?.materials ? getFilteredMaterials(data.materials) : [];

  if (isLoading) {
    return (
      <div className="glass-card p-6 md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 md:col-span-2">
        <h2 className="text-xl font-semibold text-forest-800 mb-4">Course Materials</h2>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
          <p>Failed to load course materials. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-forest-800">Course Materials</h2>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search materials..."
            className="py-1 px-3 pr-8 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-forest-500 focus:border-transparent"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Search className="h-4 w-4 text-gray-500 absolute right-2.5 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>
      
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
              <div className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                  {getIconForType(material.type)}
                  <span className="text-xs font-medium bg-gray-100 rounded-md px-2 py-0.5 text-gray-600">
                    {material.type}
                  </span>
                </div>
                <h3 className="font-medium text-gray-800 mt-2">{material.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{material.content}</p>
              </div>
              <div className="border-t px-4 py-2 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {material.pages ? `${material.pages} pages` : 
                   material.duration ? material.duration : 
                   material.questions ? `${material.questions} questions` : ''}
                </span>
                <div className="flex items-center space-x-2">
                  {material.fileUrl && (
                    <button className="text-forest-600 hover:text-forest-800" aria-label="Download">
                      <Download className="h-5 w-5" />
                    </button>
                  )}
                  <Link href={`/summary/${material.id}`}>
                    <a className="text-forest-600 hover:text-forest-800" aria-label="Study">
                      <BookOpen className="h-5 w-5" />
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-600">
            {searchTerm ? 'No materials match your search criteria.' : 'No course materials available yet.'}
          </p>
          {searchTerm && (
            <button 
              className="mt-4 text-forest-600 hover:text-forest-800 font-medium"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseMaterials;
