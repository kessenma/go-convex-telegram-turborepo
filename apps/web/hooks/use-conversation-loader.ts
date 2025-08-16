import { useQuery } from 'convex/react';
import { api } from '../generated-convex';
import type { GenericId as Id } from 'convex/values';

export function useConversationLoader(conversationId: string | null, type: 'general' | 'rag' | null) {
  // Load unified conversation messages
  const messages = useQuery(
    api.unifiedChat.getConversationMessages,
    conversationId
      ? { conversationId: conversationId as Id<"unified_conversations"> } 
      : "skip"
  );

  const isLoading = conversationId ? messages === undefined : false;

  return {
    messages,
    isLoading,
    type
  };
}