export interface Document {
  _id: string;
  title: string;
  content: string;
  contentType: 'markdown' | 'text';
  fileSize: number;
  uploadedAt: number;
  wordCount: number;
  tags?: string[];
  summary?: string;
  embedding?: number[];
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