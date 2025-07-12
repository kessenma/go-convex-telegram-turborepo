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
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: {
    documentId: string;
    title: string;
    snippet: string;
    score: number;
  }[];
}
