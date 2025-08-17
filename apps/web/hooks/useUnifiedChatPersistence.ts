import { useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../generated-convex';
import type { GenericId as Id } from 'convex/values';
import type { ChatMessage, ChatMode } from '../stores/unifiedChatStore';
import type { Document } from '../types/rag';
import { nanoid } from 'nanoid';

interface UseUnifiedChatPersistenceOptions {
  onError?: (error: Error) => void;
  onConversationCreated?: (conversationId: string) => void;
  onMessageSaved?: (messageId: string) => void;
}

export function useUnifiedChatPersistence({
  onError,
  onConversationCreated,
  onMessageSaved,
}: UseUnifiedChatPersistenceOptions = {}) {
  // Convex mutations
  const createConversationMutation = useMutation(api.unifiedChat.createConversation);
  const addMessageMutation = useMutation(api.unifiedChat.addMessage);
  const updateConversationTitleMutation = useMutation(api.unifiedChat.updateConversationTitle);

  // Track current session and conversation
  const sessionIdRef = useRef<string>(nanoid());
  const currentConversationIdRef = useRef<string | null>(null);

  // Create a new conversation
  const createConversation = useCallback(async ({
    type,
    chatMode,
    selectedDocuments = [],
    title,
    llmModel = 'llama-3.2',
    userId,
  }: {
    type: ChatMode;
    chatMode: string;
    selectedDocuments?: Document[];
    title?: string;
    llmModel?: string;
    userId?: string;
  }) => {
    try {
      // Generate new session ID for new conversation
      sessionIdRef.current = nanoid();

      const conversationId = await createConversationMutation({
        sessionId: sessionIdRef.current,
        type,
        documentIds: selectedDocuments.map(doc => doc._id as Id<'rag_documents'>),
        documentTitles: selectedDocuments.map(doc => doc.title),
        title,
        userId,
        userAgent: navigator.userAgent,
        ipAddress: undefined, // Will be handled server-side if needed
        llmModel,
        chatMode,
        settings: JSON.stringify({
          documentCount: selectedDocuments.length,
          timestamp: Date.now(),
        }),
        metadata: JSON.stringify({
          createdFrom: 'UnifiedChatInterface',
          version: '1.0',
        }),
      });

      currentConversationIdRef.current = conversationId;
      console.log('🎯 Set conversation ID in persistence hook:', conversationId);
      onConversationCreated?.(conversationId);

      return conversationId;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create conversation');
      onError?.(err);
      throw err;
    }
  }, [createConversationMutation, onError, onConversationCreated]);

  // Save a message to the current conversation
  const saveMessage = useCallback(async ({
    message,
    chatMode,
    conversationId,
    processingTimeMs,
  }: {
    message: ChatMessage;
    chatMode: string;
    conversationId?: string;
    processingTimeMs?: number;
  }) => {
    try {
      const targetConversationId = conversationId || currentConversationIdRef.current;

      if (!targetConversationId) {
        throw new Error('No active conversation to save message to');
      }

      const messageDocId = await addMessageMutation({
        conversationId: targetConversationId as Id<'unified_conversations'>,
        messageId: message.id,
        role: message.role,
        content: message.content,
        chatMode,
        tokenCount: message.content.length, // Rough estimate
        processingTimeMs,
        sources: message.sources?.map(source => ({
          documentId: source.documentId as Id<'rag_documents'>,
          title: source.title,
          snippet: source.snippet,
          score: source.score,
        })),
        metadata: JSON.stringify({
          timestamp: message.timestamp,
          ...message.metadata,
        }),
      });

      onMessageSaved?.(messageDocId as string);

      return messageDocId;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to save message');
      onError?.(err);
      throw err;
    }
  }, [addMessageMutation, onError, onMessageSaved]);

  // Save multiple messages (for bulk operations)
  const saveMessages = useCallback(async ({
    messages,
    chatMode,
    conversationId,
  }: {
    messages: ChatMessage[];
    chatMode: string;
    conversationId?: string;
  }) => {
    const results: (string | Id<'unified_chat_messages'>)[] = [];

    for (const message of messages) {
      try {
        const result = await saveMessage({
          message,
          chatMode,
          conversationId,
        });
        results.push(result);
      } catch (error) {
        console.error('Failed to save message:', message.id, error);
        // Continue with other messages even if one fails
      }
    }

    return results;
  }, [saveMessage]);

  // Create conversation and save initial messages
  const createConversationWithMessages = useCallback(async ({
    type,
    chatMode,
    selectedDocuments = [],
    messages = [],
    title,
    llmModel = 'llama-3.2',
    userId,
  }: {
    type: ChatMode;
    chatMode: string;
    selectedDocuments?: Document[];
    messages?: ChatMessage[];
    title?: string;
    llmModel?: string;
    userId?: string;
  }) => {
    try {
      // Create the conversation first
      const conversationId = await createConversation({
        type,
        chatMode,
        selectedDocuments,
        title,
        llmModel,
        userId,
      });

      // Save all messages if any
      if (messages.length > 0) {
        await saveMessages({
          messages,
          chatMode,
          conversationId,
        });
      }

      return conversationId;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create conversation with messages');
      onError?.(err);
      throw err;
    }
  }, [createConversation, saveMessages, onError]);

  // Get current conversation ID
  const getCurrentConversationId = useCallback(() => {
    return currentConversationIdRef.current;
  }, []);

  // Set current conversation ID (when loading existing conversation)
  const setCurrentConversationId = useCallback((conversationId: string | null) => {
    currentConversationIdRef.current = conversationId;
  }, []);

  // Reset session (start fresh)
  const resetSession = useCallback(() => {
    sessionIdRef.current = nanoid();
    currentConversationIdRef.current = null;
  }, []);

  // Update conversation title
  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    try {
      await updateConversationTitleMutation({
        conversationId: conversationId as Id<'unified_conversations'>,
        title,
      });
      return true;
    } catch (err) {
      console.error('Failed to update conversation title:', err);
      onError?.(err as Error);
      throw err;
    }
  }, [updateConversationTitleMutation, onError]);

  return {
    createConversation,
    saveMessage,
    saveMessages,
    createConversationWithMessages,
    getCurrentConversationId,
    setCurrentConversationId,
    resetSession,
    updateConversationTitle,
    sessionId: sessionIdRef.current,
  };
}