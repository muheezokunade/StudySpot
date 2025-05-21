import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Switch, Route as WouterRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/Home";
import ExamPrep from "./pages/ExamPrep";
import Summary from "./pages/Summary";
import JobBoard from "./pages/JobBoard";
import Forum from "./pages/Forum";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Admin from "./pages/Admin";
import TestUpload from "./pages/TestUpload";
import { useAuthContext } from "./context/AuthContext";
import NewForumPost from "./pages/NewForumPost";
import NewJob from "./pages/NewJob";
import NewSummary from "./pages/NewSummary";
import Courses from './pages/Courses';
import MaterialView from './pages/MaterialView';
import ExamSchedule from './pages/ExamSchedule';
import MyProgress from './pages/MyProgress';
import AITutor from './pages/AITutor';
import AIChatPanel from './components/chat/AIChatPanel';

// Import components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

interface User {
  id: number;
  firstName: string;
  email: string;
  role: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Authentication error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle mobile menu toggle
  const handleMobileMenuOpen = () => {
    setMobileMenuOpen(true);
  };

  // Handle mobile menu close
  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  // Handle AI chat toggle
  const handleAIChatOpen = () => {
    setAiChatOpen(true);
  };

  // Handle AI chat close
  const handleAIChatClose = () => {
    setAiChatOpen(false);
  };

  // Protected route component
  const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
    if (loading) {
      return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }
    
    return user ? <>{element}</> : <Navigate to="/login" />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router>
            <div className="flex flex-col min-h-screen">
              <Header 
                user={user} 
                setUser={setUser} 
                onMobileMenuOpen={handleMobileMenuOpen} 
                onAIChatOpen={handleAIChatOpen} 
              />
              
              <main className="flex-grow bg-gray-50 dark:bg-gray-900">
                <Routes>
                  <Route path="/" element={<Home onAIChatOpen={handleAIChatOpen} />} />
                  <Route path="/login" element={<Login setUser={setUser} />} />
                  <Route path="/register" element={<SignUp setUser={setUser} />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  
                  {/* Protected routes */}
                  <Route path="/profile" element={<ProtectedRoute element={<Profile user={user} />} />} />
                  <Route path="/courses" element={<ProtectedRoute element={<Courses />} />} />
                  <Route path="/materials/:materialId" element={<ProtectedRoute element={<MaterialView />} />} />
                  <Route path="/exams" element={<ProtectedRoute element={<ExamSchedule />} />} />
                  <Route path="/progress" element={<ProtectedRoute element={<MyProgress />} />} />
                  
                  {/* AI Tutor routes */}
                  <Route path="/tutor" element={<ProtectedRoute element={<AITutor />} />} />
                  <Route path="/tutor/documents" element={<ProtectedRoute element={<AITutor />} />} />
                  <Route path="/tutor/upload" element={<ProtectedRoute element={<AITutor />} />} />
                  <Route path="/tutor/document/:id" element={<ProtectedRoute element={<AITutor />} />} />
                  <Route path="/tutor/concept/:id" element={<ProtectedRoute element={<AITutor />} />} />
                  <Route path="/tutor/review" element={<ProtectedRoute element={<AITutor />} />} />
                  
                  {/* App routes with MainLayout */}
                  <Route path="/exam-prep" element={
                    <MainLayout onAIChatOpen={handleAIChatOpen} onMobileMenuOpen={handleMobileMenuOpen}>
                      <ExamPrep />
                    </MainLayout>
                  } />
                  <Route path="/summary" element={
                    <MainLayout onAIChatOpen={handleAIChatOpen} onMobileMenuOpen={handleMobileMenuOpen}>
                      <Summary />
                    </MainLayout>
                  } />
                  <Route path="/summary/new" element={
                    <MainLayout onAIChatOpen={handleAIChatOpen} onMobileMenuOpen={handleMobileMenuOpen}>
                      <NewSummary />
                    </MainLayout>
                  } />
                  <Route path="/jobs" element={
                    <MainLayout onAIChatOpen={handleAIChatOpen} onMobileMenuOpen={handleMobileMenuOpen}>
                      <JobBoard />
                    </MainLayout>
                  } />
                  <Route path="/jobs/new" element={
                    <MainLayout onAIChatOpen={handleAIChatOpen} onMobileMenuOpen={handleMobileMenuOpen}>
                      <NewJob />
                    </MainLayout>
                  } />
                  <Route path="/forum" element={
                    <MainLayout onAIChatOpen={handleAIChatOpen} onMobileMenuOpen={handleMobileMenuOpen}>
                      <Forum />
                    </MainLayout>
                  } />
                  <Route path="/forum/new" element={
                    <MainLayout onAIChatOpen={handleAIChatOpen} onMobileMenuOpen={handleMobileMenuOpen}>
                      <NewForumPost />
                    </MainLayout>
                  } />
                  <Route path="/admin" element={
                    <MainLayout onAIChatOpen={handleAIChatOpen} onMobileMenuOpen={handleMobileMenuOpen}>
                      <Admin />
                    </MainLayout>
                  } />
                  <Route path="/test-upload" element={
                    <MainLayout onAIChatOpen={handleAIChatOpen} onMobileMenuOpen={handleMobileMenuOpen}>
                      <TestUpload />
                    </MainLayout>
                  } />
                  
                  {/* Fallback route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              
              <Footer />
              
              {/* AI Chat Panel */}
              <AIChatPanel isOpen={aiChatOpen} onClose={handleAIChatClose} />
              
              {/* Mobile Menu */}
              {mobileMenuOpen && (
                <div className="lg:hidden">
                  {/* Mobile menu content would go here */}
                </div>
              )}
            </div>
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
