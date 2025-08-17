'use client';

import { useState, useCallback, useEffect } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  sources?: Array<{
    documentId: string;
    title: string;
    snippet: string;
    score: number;
  }>;
  generated_title?: string;
}

interface UseChatOptions {
  api: string;
  body?: Record<string, any>;
  onError?: (error: Error) => void;
  onFinish?: (message: Message) => void;
  onMessageSent?: (message: Message) => void;
  onMessageReceived?: (message: Message) => void;
  onTitleGenerated?: (title: string) => void;
}

export function useAIChat({
  api,
  body,
  onError,
  onFinish,
  onMessageSent,
  onMessageReceived,
  onTitleGenerated,
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  // Handle chat submission
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message to the chat
    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: input.trim(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Call onMessageSent callback
    onMessageSent?.(userMessage);

    try {
      // Call our custom API endpoint
      console.log("Sending chat request with body:", {
        messages: [...messages, userMessage],
        conversation_id: conversationId,
        is_new_conversation: messages.length === 0,
        ...body
      });
      
      const response = await fetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversation_id: conversationId,
          is_new_conversation: messages.length === 0,
          ...body,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Get the response text
      const responseText = await response.text();

      // Parse the response to check for JSON format (which might contain sources)
      let responseContent = responseText;
      let sources = undefined;
      let jsonResponse = null;
      
      try {
        // Check if the response is JSON
        jsonResponse = JSON.parse(responseText);
        if (jsonResponse.response) {
          responseContent = jsonResponse.response;
          sources = jsonResponse.sources;
          
          // Check if a title was generated
          if (jsonResponse.generated_title && onTitleGenerated) {
            onTitleGenerated(jsonResponse.generated_title);
          }
        }
      } catch (e) {
        // Not JSON, use the text as is
        responseContent = responseText;
      }
      
      // Add assistant message to the chat
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: responseContent,
        sources: sources,
        generated_title: jsonResponse?.generated_title,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onFinish?.(assistantMessage);
      
      // Call onMessageReceived callback
      onMessageReceived?.(assistantMessage);
    } catch (err) {
      console.error('Chat error:', err);
      const errorInstance = err instanceof Error ? err : new Error('An error occurred');
      setError(errorInstance);
      onError?.(errorInstance);
    } finally {
      setIsLoading(false);
    }
  }, [api, body, input, isLoading, messages, onError, onFinish, onMessageSent, onMessageReceived]);

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
