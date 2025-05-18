import React, { useState, ReactNode, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import MobileMenu from './MobileMenu';
import AIChatPanel from '../chat/AIChatPanel';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const handleMobileMenuOpen = () => {
    setMobileMenuOpen(true);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleAIChatOpen = () => {
    setAiChatOpen(true);
  };

  const handleAIChatClose = () => {
    setAiChatOpen(false);
  };

  // Set up global event listener for AI Chat button
  useEffect(() => {
    const handleGlobalAIChatOpen = () => {
      setAiChatOpen(true);
    };
    
    window.addEventListener('openAIChat', handleGlobalAIChatOpen);
    
    return () => {
      window.removeEventListener('openAIChat', handleGlobalAIChatOpen);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onMobileMenuOpen={handleMobileMenuOpen} 
        onAIChatOpen={handleAIChatOpen} 
      />
      
      <div className="flex-grow flex">
        <Sidebar onAIChatOpen={handleAIChatOpen} />
        
        <main className="flex-grow bg-gray-50 py-6 px-4 sm:px-6 lg:px-8 overflow-y-auto">
          {children}
        </main>
      </div>
      
      <Footer />
      
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={handleMobileMenuClose} 
        onAIChatOpen={handleAIChatOpen}
      />
      
      <AIChatPanel 
        isOpen={aiChatOpen} 
        onClose={handleAIChatClose} 
      />
      
      {/* Floating AI Chat Button - positioned higher to avoid overlap */}
      <button 
        onClick={handleAIChatOpen}
        className="fixed bottom-20 right-6 z-40 bg-forest-600 text-white rounded-full p-3 shadow-lg hover:bg-forest-700 transition-colors"
        aria-label="Open AI Chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </div>
  );
};

export default MainLayout;
