import React from 'react';
import { FileText, BookOpen, Edit } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  timestamp: string;
  score: number;
  type: 'quiz' | 'exam' | 'summary';
}

const ProgressCard: React.FC<ProgressCardProps> = ({ title, timestamp, score, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'quiz':
        return <FileText className="h-6 w-6 text-forest-600" />;
      case 'exam':
        return <BookOpen className="h-6 w-6 text-forest-600" />;
      case 'summary':
        return <Edit className="h-6 w-6 text-forest-600" />;
      default:
        return <FileText className="h-6 w-6 text-forest-600" />;
    }
  };

  const getScoreColorClass = () => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreBarColorClass = () => {
    if (score >= 80) return 'bg-forest-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <div className="bg-mint-light p-2 rounded-lg">
            {getIcon()}
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500">{timestamp}</p>
          </div>
        </div>
        <span className={`${getScoreColorClass()} text-xs font-medium px-2.5 py-0.5 rounded`}>
          {score}%
        </span>
      </div>
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`${getScoreBarColorClass()} h-2.5 rounded-full`} 
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;
