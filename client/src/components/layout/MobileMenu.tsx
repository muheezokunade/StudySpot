import React from 'react';
import { Link, useLocation } from 'wouter';
import { X, Home, BookOpen, FileText, Briefcase, MessageSquare, MessageCircle, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAIChatOpen: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onAIChatOpen }) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const handleAIChatOpen = () => {
    onClose();
    onAIChatOpen();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 animate-in fade-in">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute top-0 left-0 h-full w-4/5 max-w-xs bg-white shadow-xl animate-in slide-in-from-left">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="bg-forest-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg">
                {user ? user.firstName.charAt(0) : 'NS'}
              </span>
              <div className="ml-3">
                <p className="font-semibold text-forest-800">
                  {user ? user.firstName : 'Guest User'}
                </p>
                <p className="text-xs text-gray-500">NOUN Student</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <nav className="py-2">
          <Link href="/">
            <a 
              className={`flex items-center px-4 py-3 ${
                location === '/' 
                  ? 'text-forest-800 bg-mint-50' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={onClose}
            >
              <Home className="h-5 w-5 mr-3 text-forest-600" />
              Dashboard
            </a>
          </Link>
          <Link href="/exam-prep">
            <a 
              className={`flex items-center px-4 py-3 ${
                location.startsWith('/exam-prep') 
                  ? 'text-forest-800 bg-mint-50' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={onClose}
            >
              <BookOpen className="h-5 w-5 mr-3 text-gray-500" />
              E-Exam Prep
            </a>
          </Link>
          <Link href="/summary">
            <a 
              className={`flex items-center px-4 py-3 ${
                location.startsWith('/summary') 
                  ? 'text-forest-800 bg-mint-50' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={onClose}
            >
              <FileText className="h-5 w-5 mr-3 text-gray-500" />
              Summary Success
            </a>
          </Link>
          <Link href="/jobs">
            <a 
              className={`flex items-center px-4 py-3 ${
                location.startsWith('/jobs') 
                  ? 'text-forest-800 bg-mint-50' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={onClose}
            >
              <Briefcase className="h-5 w-5 mr-3 text-gray-500" />
              Job Board
            </a>
          </Link>
          <Link href="/forum">
            <a 
              className={`flex items-center px-4 py-3 ${
                location.startsWith('/forum') 
                  ? 'text-forest-800 bg-mint-50' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={onClose}
            >
              <MessageSquare className="h-5 w-5 mr-3 text-gray-500" />
              Forum
            </a>
          </Link>
          <button
            className="flex items-center px-4 py-3 w-full text-left text-gray-700 hover:bg-gray-100"
            onClick={handleAIChatOpen}
          >
            <MessageCircle className="h-5 w-5 mr-3 text-gray-500" />
            AI Chat
          </button>
          <Link href="/profile">
            <a 
              className={`flex items-center px-4 py-3 ${
                location.startsWith('/profile') 
                  ? 'text-forest-800 bg-mint-50' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={onClose}
            >
              <User className="h-5 w-5 mr-3 text-gray-500" />
              Profile
            </a>
          </Link>
        </nav>
        
        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <button 
              className="flex items-center text-red-600 hover:text-red-800"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;
