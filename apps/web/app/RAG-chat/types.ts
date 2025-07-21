export interface Document {
  _id: string;
  _creationTime: number;
  title: string;
  content: string;
  contentType: string;
  fileSize: number;
  uploadedAt: number;
  lastModified: number;
  isActive: boolean;
  wordCount: number;
  hasEmbedding: boolean;
  tags?: string[];
  summary?: string;
}

export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: number;
  sources?: {
    documentId: string;
    title: string;
    snippet: string;
    score: number;
  }[];
}

export interface ChatConversation {
  _id: string;
  _creationTime: number;
  sessionId: string;
  title?: string;
  documentIds: string[];
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
  createdAt: number;
  lastMessageAt: number;
  messageCount: number;
  totalTokensUsed: number;
  llmModel: string;
  documents?: {
    _id: string;
    title: string;
  }[];
}

export interface ChatHistoryMessage {
  _id: string;
  _creationTime: number;
  conversationId: string;
  messageId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  tokenCount?: number;
  processingTimeMs?: number;
  sources?: {
    documentId: string;
    title: string;
    snippet: string;
    score: number;
  }[];
  metadata?: string;
}
