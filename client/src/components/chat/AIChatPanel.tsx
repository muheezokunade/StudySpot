import React, { useState, useRef, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ChatMessage from './ChatMessage';
import { useAIChat } from '@/hooks/useAIChat';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([{
    id: "welcome-message",
    content: "Hi there! I'm your AI study assistant. How can I help you today? You can ask me about your courses, exams, or any academic questions you have.",
    isUserMessage: false,
    createdAt: new Date().toISOString()
  }]);
  const [usage, setUsage] = useState({ promptsUsed: 0, promptLimit: 5 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isFullPage, setIsFullPage] = useState(false);
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [uploadedMaterial, setUploadedMaterial] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [learningStyle, setLearningStyle] = useState<string>('step-by-step');

  // Load chat history when component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await apiRequest('GET', '/api/chat/history');
        const data = await response.json();
        
        if (data.messages && data.messages.length > 0) {
          setChatMessages(data.messages);
        }
        
        if (data.promptsUsed !== undefined) {
          setUsage({
            promptsUsed: data.promptsUsed,
            promptLimit: data.promptLimit || 5
          });
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
        // Keep the default welcome message if history fetch fails
      }
    };
    
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() || isSubmitting) {
      return;
    }
    
    const trimmedPrompt = prompt.trim();
    setPrompt('');
    setIsSubmitting(true);
    
    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      content: trimmedPrompt,
      isUserMessage: true,
      createdAt: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    try {
      // Make API request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: trimmedPrompt })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      setChatMessages(prev => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          content: data.response,
          isUserMessage: false,
          createdAt: data.timestamp || new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
      
      // Add error message
      setChatMessages(prev => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          content: "I'm sorry, I couldn't process your request. Please try again.",
          isUserMessage: false,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedMaterial(e.target.files[0]);
      // Send file to backend
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      
      // Show loading state
      setUploadPreview('Loading...');
      
      try {
        console.log('Uploading file:', e.target.files[0].name, 'Size:', e.target.files[0].size, 'Type:', e.target.files[0].type);
        
        const res = await fetch('/api/simple-upload', {
          method: 'POST',
          body: formData,
        });
        
        console.log('Upload response status:', res.status);
        
        // Try to get the response text first to debug any issues
        const responseText = await res.text();
        console.log('Raw response:', responseText);
        
        let data;
        try {
          // Parse the response as JSON
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          setUploadPreview('Upload failed: Invalid server response (not JSON)');
          toast({
            title: 'Upload failed',
            description: 'The server returned an invalid response format',
            variant: 'destructive',
          });
          return;
        }
        
        if (res.ok && data.success) {
          setUploadPreview(data.preview || 'File uploaded, but no preview available');
          toast({
            title: 'Upload successful',
            description: `Uploaded ${e.target.files[0].name} successfully`,
          });
        } else {
          setUploadPreview('Upload failed: ' + (data.message || 'Unknown error'));
          toast({
            title: 'Upload failed',
            description: data.message || 'Unknown error occurred',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Upload error:', err);
        setUploadPreview('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        toast({
          title: 'Upload failed',
          description: err instanceof Error ? err.message : 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div 
      className={`fixed ${isFullPage ? 'inset-0 w-full h-full' : 'inset-y-0 right-0 w-full sm:w-96'} bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={isFullPage ? {maxWidth: '100vw', maxHeight: '100vh'} : {}}
    >
      <div className="flex flex-col h-full">
        <div className="p-3 bg-forest-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-1">
            <div className="h-9 w-9 rounded-full bg-lime-200 flex items-center justify-center">
              <Zap className="h-5 w-5 text-forest-600" />
            </div>
            <h3 className="font-semibold ml-2">AI Study Assistant</h3>
            <label className="ml-4 flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={isTeacherMode} onChange={e => setIsTeacherMode(e.target.checked)} className="accent-forest-600" />
              <span className="text-xs">Teacher Mode</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullPage(f => !f)}
              className="text-white hover:text-gray-200 px-2"
              aria-label="Expand AI chat"
            >
              {isFullPage ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 16v4h-4M4 16v4h4M20 8V4h-4" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4zM13 13h7v7h-7z" /></svg>
              )}
            </button>
            <button 
              onClick={onClose} 
              className="text-white hover:text-gray-200"
              aria-label="Close AI chat"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Learning style selector for teacher mode */}
        {isTeacherMode && (
          <div className="p-2 bg-gray-100 border-b">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium">Learning Style:</label>
              <select value={learningStyle} onChange={e => setLearningStyle(e.target.value)} className="border rounded px-2 py-1 text-xs">
                <option value="step-by-step">Step-by-step</option>
                <option value="summary">Summary</option>
                <option value="qna">Q&A</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {uploadPreview && (
              <div className="bg-white border rounded p-2 text-xs max-h-40 overflow-y-auto mt-2">
                <div className="font-semibold mb-1">Preview:</div>
                <pre className="whitespace-pre-wrap">{uploadPreview}</pre>
              </div>
            )}
          </div>
        )}
        
        {/* Upload preview - add this to show the file upload status */}
        {uploadPreview && (
          <div className="px-3 py-2 bg-gray-50 border-t text-sm">
            <p className="font-medium mb-1">Uploaded File:</p>
            <p className="text-sm text-gray-600">{uploadPreview}</p>
          </div>
        )}
        
        <div 
          className="flex-grow overflow-y-auto p-4 bg-gray-50" 
          style={{ height: isTeacherMode ? 'calc(100vh - 165px)' : 'calc(100vh - 120px)' }}
        >
          {isSubmitting ? (
            <div className="space-y-4">
              {chatMessages.map((message) => (
                <ChatMessage 
                  key={message.id}
                  content={message.content}
                  isUser={message.isUserMessage}
                  timestamp={new Date(message.createdAt).toLocaleTimeString()}
                />
              ))}
              <div className="mt-4">
                <Skeleton className="h-20 w-3/4 rounded-lg" />
              </div>
              <div ref={messagesEndRef} />
            </div>
          ) : chatMessages.length > 0 ? (
            <div className="space-y-4">
              {chatMessages.map((message) => (
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
        
        <div className="p-3 bg-white border-t">
          <form onSubmit={handleSendMessage} className="flex relative">
            <Input
              type="text"
              placeholder="Ask me anything..."
              className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-forest-500 focus:border-transparent p-2 pr-24"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isSubmitting}
            />
            
            {/* File upload icon button inside the input field */}
            {isTeacherMode && (
              <label className="absolute right-14 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-forest-600">
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.txt" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {uploadedMaterial && (
                  <span className="absolute top-6 right-0 text-xs text-forest-600 whitespace-nowrap bg-white border border-gray-200 rounded px-1">
                    {uploadedMaterial.name.substring(0, 15)}{uploadedMaterial.name.length > 15 ? '...' : ''}
                  </span>
                )}
              </label>
            )}
            
            <Button 
              type="submit"
              className="absolute right-0 bg-forest-600 text-white p-2 rounded-r-lg hover:bg-forest-700 transition-colors"
              disabled={isSubmitting || !prompt.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </Button>
          </form>
          {usage.promptLimit > 0 && (
            <div className="text-xs text-gray-500 mt-2 flex justify-between">
              <span>{usage.promptsUsed}/{usage.promptLimit} free prompts remaining today</span>
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
