import React from 'react';
import { Link } from 'wouter';
import { MessageSquare, HelpCircle, Settings } from 'lucide-react';
import Logo from '@/components/common/Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center md:flex-row md:justify-between">
        <div className="mb-4 md:mb-0">
          <Logo />
          <p className="text-sm text-gray-500 mt-1">Empowering NOUN students for academic excellence.</p>
        </div>
        <div className="flex space-x-6">
          <Link href="/forum">
            <a className="text-gray-500 hover:text-forest-600">
              <span className="sr-only">Forum</span>
              <MessageSquare className="h-5 w-5" />
            </a>
          </Link>
          <Link href="/help">
            <a className="text-gray-500 hover:text-forest-600">
              <span className="sr-only">Help</span>
              <HelpCircle className="h-5 w-5" />
            </a>
          </Link>
          <Link href="/settings">
            <a className="text-gray-500 hover:text-forest-600">
              <span className="sr-only">Settings</span>
              <Settings className="h-5 w-5" />
            </a>
          </Link>
        </div>
      </div>
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Noun Success. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
