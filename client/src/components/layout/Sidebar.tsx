import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  Home,
  BookOpen,
  FileText,
  Briefcase,
  MessageSquare,
  MessageCircle,
  User,
  Settings,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  onAIChatOpen: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAIChatOpen }) => {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: BookOpen, label: 'E-Exam Prep', path: '/exam-prep' },
    { icon: FileText, label: 'Summary Success', path: '/summary' },
    { icon: Briefcase, label: 'Job Board', path: '/jobs' },
    { icon: MessageSquare, label: 'Forum', path: '/forum' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r h-full">
      <div className="p-4 border-b">
        <span className="text-forest-800 font-bold text-xl">Noun<span className="text-lime-500">Success</span></span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a 
                  className={`flex items-center px-4 py-3 text-sm ${
                    (item.path === '/' && location === '/') || 
                    (item.path !== '/' && location.startsWith(item.path))
                      ? 'text-forest-800 bg-mint-50 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${
                    (item.path === '/' && location === '/') || 
                    (item.path !== '/' && location.startsWith(item.path))
                      ? 'text-forest-600'
                      : 'text-gray-500'
                  }`} />
                  {item.label}
                </a>
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={onAIChatOpen}
              className="flex items-center px-4 py-3 text-sm w-full text-left text-gray-700 hover:bg-gray-100"
            >
              <MessageCircle className="h-5 w-5 mr-3 text-gray-500" />
              AI Chat
            </button>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <div className="flex justify-between">
          <Link href="/help">
            <a className="text-gray-500 hover:text-forest-600 p-2">
              <HelpCircle className="h-5 w-5" />
            </a>
          </Link>
          <Link href="/settings">
            <a className="text-gray-500 hover:text-forest-600 p-2">
              <Settings className="h-5 w-5" />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
