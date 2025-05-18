import React, { useState, useRef, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ChatMessage from './ChatMessage';
import { useAIChat } from '@/hooks/useAIChat';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { messages, promptsUsed, promptLimit, isLoading, sendMessage } = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Create a temporary user message immediately for better UX
      const userMessage = {
        id: Math.random().toString(),
        content: prompt,
        isUserMessage: true,
        createdAt: new Date().toISOString()
      };
      
      // Add to chat messages directly even without authentication
      messages.push(userMessage);
      
      // For demo purposes, simulate an AI response
      setTimeout(() => {
        const aiResponse = {
          id: Math.random().toString(),
          content: "As a demo AI, I can't access the authentication system yet. Once you log in, I'll be able to provide personalized assistance with your NOUN studies. Would you like to create an account or log in?",
          isUserMessage: false,
          createdAt: new Date().toISOString()
        };
        messages.push(aiResponse);
        setIsSubmitting(false);
      }, 1500);
      
      setPrompt('');
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: 'Failed to send message',
          description: error.message,
          variant: 'destructive',
        });
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 bg-forest-600 text-white flex justify-between items-center">
          <div className="flex items-center">
            <Zap className="h-6 w-6 mr-2" />
            <h3 className="font-semibold">AI Study Assistant</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200"
            aria-label="Close AI chat"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div 
          className="flex-grow overflow-y-auto p-4 bg-gray-50" 
          style={{ height: 'calc(100vh - 140px)' }}
        >
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-3/4 rounded-lg" />
              <div className="flex justify-end">
                <Skeleton className="h-16 w-2/3 rounded-lg" />
              </div>
              <Skeleton className="h-32 w-3/4 rounded-lg" />
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id}
                  content={message.content}
                  isUser={message.isUserMessage}
                  timestamp={new Date(message.createdAt).toLocaleTimeString()}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="space-y-4">
              <ChatMessage 
                content="Hi there! I'm your AI study assistant. How can I help you today? You can ask me about your courses, exams, or any academic questions you have."
                isUser={false}
                timestamp={new Date().toLocaleTimeString()}
              />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        <div className="p-4 bg-white border-t">
          <form onSubmit={handleSubmit} className="flex">
            <Input
              type="text"
              placeholder="Ask me anything..."
              className="w-full rounded-l-lg border border-gray-300 focus:ring-2 focus:ring-forest-500 focus:border-transparent p-2"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isSubmitting}
            />
            <Button 
              type="submit"
              className="bg-forest-600 text-white px-4 py-2 rounded-r-lg hover:bg-forest-700 transition-colors"
              disabled={isSubmitting || !prompt.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </Button>
          </form>
          {promptLimit && (
            <div className="text-xs text-gray-500 mt-2 flex justify-between">
              <span>{promptsUsed}/{promptLimit} free prompts remaining today</span>
              <Link href="/profile">
                <a className="text-forest-600 hover:text-forest-800 font-medium">Upgrade for unlimited</a>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
