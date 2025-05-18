import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { ChatMessage, ChatUsage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UseChatOptions {
  onError?: (error: Error) => void;
}

export const useAIChat = (options?: UseChatOptions) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get chat history
  const { 
    data,
    isLoading: isHistoryLoading,
    error: historyError
  } = useQuery({
    queryKey: ['/api/chat/history'],
    onError: (error: Error) => {
      toast({
        title: 'Failed to load chat history',
        description: error.message,
        variant: 'destructive',
      });
      if (options?.onError) options.onError(error);
    },
  });

  const messages = data?.messages || [];
  const promptsUsed = data?.promptsUsed || 0;
  const promptLimit = data?.promptLimit || null;

  // Send message mutation
  const mutation = useMutation({
    mutationFn: async (prompt: string) => {
      setIsLoading(true);
      const res = await apiRequest('POST', '/api/chat', { prompt });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      setIsLoading(false);
    },
    onError: (error: Error) => {
      setIsLoading(false);
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
      if (options?.onError) options.onError(error);
    },
  });

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim()) return;
    
    try {
      return await mutation.mutateAsync(prompt);
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  };

  return {
    messages,
    promptsUsed,
    promptLimit,
    isLoading: isLoading || isHistoryLoading,
    sendMessage,
    error: historyError,
    usage: { promptsUsed, promptLimit } as ChatUsage,
  };
};
