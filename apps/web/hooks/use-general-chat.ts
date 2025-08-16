import { useCallback, useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';

export interface GeneralChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  sources?: Array<{
    documentId: string;
    title: string;
    snippet: string;
    score: number;
  }>;
  metadata?: Record<string, any>;
}

interface UseGeneralChatOptions {
  api: string;
  onError?: (error: Error) => void;
  onMessageSent?: (message: GeneralChatMessage) => void;
  onMessageReceived?: (message: GeneralChatMessage) => void;
}

export function useGeneralChat({ api, onError, onMessageSent, onMessageReceived }: UseGeneralChatOptions) {
  const [messages, setMessages] = useState<GeneralChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: GeneralChatMessage = {
      id: nanoid(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    // Call onMessageSent callback
    onMessageSent?.(userMessage);

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      
      try {
        const responseData = JSON.parse(responseText);
        
        const assistantMessage: GeneralChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content: responseData.response || responseData.content || responseText,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        onMessageReceived?.(assistantMessage);
      } catch (parseError) {
        // If JSON parsing fails, treat the response as plain text
        const assistantMessage: GeneralChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content: responseText,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, don't show error
        return;
      }
      
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onError?.(error);
      
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading, messages, api, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
  };
}