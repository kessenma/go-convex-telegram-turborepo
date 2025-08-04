import type { GenericId as Id } from 'convex/values';

export interface Document {
  _id: Id<"rag_documents">;
  title: string;
  content: string;
  contentType: string;
  fileSize: number;
  fileType: string;
  wordCount: number;
  uploadedAt: number;
  summary?: string;
  hasEmbedding: boolean;
}

export interface ChatConversation {
  _id: Id<"rag_conversations">;
  _creationTime: number;
  sessionId: string;
  title: string;
  documentIds: Id<"rag_documents">[];
  documentTitles?: string[];
  messageCount: number;
  lastMessage?: string;
  lastUpdated?: number;
  isActive: boolean;
}

export type ViewState = 'selection' | 'chat' | 'history';
export type SlideDirection = 'left' | 'right';