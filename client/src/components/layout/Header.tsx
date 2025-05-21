import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Bell, ChevronDown } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  id: number;
  firstName: string;
  email: string;
  role: string;
}

interface HeaderProps {
  onMobileMenuOpen: () => void;
  onAIChatOpen: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

const Header: React.FC<HeaderProps> = ({ onMobileMenuOpen, onAIChatOpen, user, setUser }) => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('login');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const openLoginModal = () => {
    setAuthModalView('login');
    setAuthModalOpen(true);
  };

  const openSignupModal = () => {
    setAuthModalView('signup');
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      // Using window.location to navigate to login page
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    onMobileMenuOpen();
  };

  // Function to check if a path is active
  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  // Main navigation items
  const navigationItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/exam-prep', label: 'E-Exam Prep' },
    { path: '/summary', label: 'Summary' },
    { path: '/jobs', label: 'Jobs' },
    { path: '/forum', label: 'Forum' },
  ];

  // Learning feature navigation items
  const learningItems = [
    { path: '/courses', label: 'Courses' },
    { path: '/exams', label: 'Exam Schedule' },
    { path: '/progress', label: 'My Progress' },
  ];

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="mr-2 sm:hidden text-gray-500 hover:text-gray-700"
              aria-label="Open mobile menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Logo />
          </div>

          <div className="hidden sm:flex items-center flex-wrap">
            {/* Main navigation */}
            <div className="flex items-center space-x-4 mr-6">
              {navigationItems.map(item => (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={isActivePath(item.path) ? 'text-forest-800 hover:text-forest-600' : 'text-gray-600 hover:text-forest-600'}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* Learning features navigation */}
            <div className="flex items-center space-x-4">
              {learningItems.map(item => (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={isActivePath(item.path) ? 'text-blue-600 hover:text-blue-800' : 'text-gray-600 hover:text-blue-600'}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onAIChatOpen}
              className="text-forest-600 hover:text-forest-800"
              aria-label="Open AI chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </button>
            
            {isAuthenticated ? (
              <>
                <button
                  className="text-gray-600 hover:text-forest-600 relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-1">
                      <div className="flex items-center">
                        <span className="bg-forest-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                          {user?.firstName?.charAt(0) || 'U'}
                        </span>
                        <ChevronDown className="h-5 w-5 text-gray-500 ml-1" />
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.firstName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer w-full">
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer w-full">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                      onSelect={handleLogout}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openLoginModal}
                  className="text-forest-600 border-forest-600 hover:text-forest-700 hover:border-forest-700"
                >
                  Log In
                </Button>
                <Button
                  size="sm"
                  onClick={openSignupModal}
                  className="bg-forest-600 text-white hover:bg-forest-700"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile menu for all navigation items */}
        {isMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-200 py-2">
            <div className="px-4 space-y-1">
              {/* Main navigation links */}
              {navigationItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block py-2 ${isActivePath(item.path) ? 'text-forest-800' : 'text-gray-600'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Learning feature links */}
              <div className="border-t border-gray-100 mt-2 pt-2">
                {learningItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block py-2 ${isActivePath(item.path) ? 'text-blue-600' : 'text-gray-600'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authModalView}
      />
    </>
  );
};

export default Header;
