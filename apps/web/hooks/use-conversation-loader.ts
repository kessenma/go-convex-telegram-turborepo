import { useQuery } from 'convex/react';
import { api } from '../generated-convex';
import type { GenericId as Id } from 'convex/values';

export function useConversationLoader(conversationId: string | null, type: 'general' | 'rag' | null) {
  // Load RAG conversation messages
  const ragMessages = useQuery(
    api.ragChat.getConversationMessages,
    conversationId && type === 'rag' 
      ? { conversationId: conversationId as Id<"rag_conversations"> } 
      : "skip"
  );

  // Load general conversation messages
  const generalMessages = useQuery(
    api.generalChat.getConversationMessages,
    conversationId && type === 'general' 
      ? { conversationId: conversationId as Id<"general_conversations"> } 
      : "skip"
  );

  // Get the appropriate messages based on type
  const messages = type === 'rag' ? ragMessages : type === 'general' ? generalMessages : null;
  const isLoading = conversationId && type ? messages === undefined : false;

  return {
    messages,
    isLoading,
    type
  };
}