export interface Document {
  _id: string;
  title: string;
  content: string;
  contentType: string;
  fileSize: number;
  uploadedAt: number;
  lastModified: number;
  isActive: boolean;
  tags?: string[];
  summary?: string;
  wordCount: number;
  embedding?: number[];
}
