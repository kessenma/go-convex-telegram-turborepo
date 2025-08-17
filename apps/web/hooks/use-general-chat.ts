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
  generated_title?: string;
}

interface UseGeneralChatOptions {
  api: string;
  onError?: (error: Error) => void;
  onMessageSent?: (message: GeneralChatMessage) => void;
  onMessageReceived?: (message: GeneralChatMessage) => void;
  onFinish?: (message: GeneralChatMessage) => void;
  onTitleGenerated?: (title: string) => void;
}

export function useGeneralChat({ api, onError, onMessageSent, onMessageReceived, onFinish, onTitleGenerated }: UseGeneralChatOptions) {
  const [messages, setMessages] = useState<GeneralChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

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
          conversation_id: conversationId,
          is_new_conversation: messages.length === 0,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      
      try {
        const responseData = JSON.parse(responseText);
        console.log('🎯 Parsed response data:', responseData);
        console.log('🎯 Generated title in response:', responseData.generated_title);
        
        const assistantMessage: GeneralChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content: responseData.response || responseData.content || responseText,
          timestamp: Date.now(),
          generated_title: responseData.generated_title,
        };

        // Check if a title was generated
        if (responseData.generated_title && onTitleGenerated) {
          console.log('🎯 Calling onTitleGenerated with:', responseData.generated_title);
          onTitleGenerated(responseData.generated_title);
        } else {
          console.log('🎯 No title generated or no onTitleGenerated callback');
        }

        setMessages(prev => [...prev, assistantMessage]);
        onMessageReceived?.(assistantMessage);
        onFinish?.(assistantMessage);
      } catch (parseError) {
        // If JSON parsing fails, treat the response as plain text
        const assistantMessage: GeneralChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content: responseText,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        onMessageReceived?.(assistantMessage);
        onFinish?.(assistantMessage);
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
    setConversationId,
  };
}
