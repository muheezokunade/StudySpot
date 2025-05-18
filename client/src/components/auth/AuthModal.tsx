import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialView = 'login' 
}) => {
  const [view, setView] = useState<'login' | 'signup'>(initialView);

  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card p-6 w-full max-w-md mx-4 sm:mx-auto">
        <DialogHeader className="flex justify-between items-center mb-6">
          <DialogTitle className="text-2xl font-semibold text-forest-800">
            {view === 'login' ? 'Welcome to Noun Success' : 'Join Noun Success'}
          </DialogTitle>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </DialogHeader>

        {view === 'login' ? (
          <LoginForm 
            onSuccess={handleSuccess} 
            onSwitchToSignup={() => setView('signup')} 
          />
        ) : (
          <SignupForm 
            onSuccess={handleSuccess} 
            onSwitchToLogin={() => setView('login')} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
