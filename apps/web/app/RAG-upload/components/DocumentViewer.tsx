'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { FileText, X, ArrowLeft } from 'lucide-react';
import { renderIcon } from '../../lib/icon-utils';
import { Card } from '../../components/ui/card';
import { cn } from '../../lib/utils';

interface DocumentViewerProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentViewer({ documentId, isOpen, onClose }: DocumentViewerProps) {
  const document = useQuery(
    api.documents.getDocument,
    documentId ? { documentId: documentId as Id<"rag_documents"> } : "skip"
  );

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  if (!document) {
    return (
      <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/50" onClick={handleBackdropClick}>
        <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 shadow-2xl">
          <div className="flex justify-center items-center p-20">
            <div className="w-8 h-8 rounded-full border-t-2 border-b-2 animate-spin border-curious-cyan-500"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/50" onClick={handleBackdropClick}>
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-gray-900 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-3 items-center">
            <div className={cn(
              'p-3 rounded-lg',
              document.contentType === 'markdown' ? 'bg-curious-cyan-900 text-curious-cyan-300' : 'bg-gray-700 text-gray-300'
            )}>
              {renderIcon(FileText, { className: "w-6 h-6" })}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {document.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 rounded-lg transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {renderIcon(X, { className: "w-5 h-5" })}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {document.wordCount.toLocaleString()} words •
            {new TextEncoder().encode(document.content).length} bytes •
            {new Date(document.uploadedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          {document.summary && (
            <div className="p-4 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Summary</h3>
              <p className="text-gray-700 dark:text-gray-300">{document.summary}</p>
            </div>
          )}

          <div className="max-w-none prose prose-gray dark:prose-invert">
            {document.contentType === 'markdown' ? (
              <div className="markdown-content">
                {document.content}
              </div>
            ) : (
              <pre className="p-4 font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 rounded-lg">
                {document.content}
              </pre>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}