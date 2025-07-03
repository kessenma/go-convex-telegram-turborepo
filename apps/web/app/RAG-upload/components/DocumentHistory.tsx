"use client";

import React, { useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { renderIcon } from '../../lib/icon-utils';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import DocumentViewer from './DocumentViewer';

interface UploadedDocument {
  _id: string;
  title: string;
  contentType: string;
  fileSize: number;
  wordCount: number;
  uploadedAt: number;
  summary?: string;
  isActive: boolean;
}

interface DocumentHistoryProps {
  documentsQuery: {
    page: UploadedDocument[];
  } | undefined;
}

export function DocumentHistory({ documentsQuery }: DocumentHistoryProps): React.ReactElement | null {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!documentsQuery || documentsQuery.page.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Recent Documents</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {documentsQuery.page.map((doc) => (
          <div
            key={doc._id}
            className="p-4 bg-gray-800 rounded-lg border cursor-pointer transition-colors border-gray-700 hover:border-curious-cyan-500"
            onClick={() => setSelectedDocumentId(doc._id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <div className={`p-2 rounded-lg ${doc.contentType === 'markdown' ? 'bg-curious-cyan-900 text-curious-cyan-300' : 'bg-gray-700 text-gray-300'}`}>
                  {renderIcon(FileText, { className: "w-5 h-5" })}
                </div>
                <div>
                  <h3 className="mb-1 font-medium text-white">{doc.title}</h3>
                  <p className="text-sm text-gray-400">
                    {doc.wordCount.toLocaleString()} words • {formatFileSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDocument({ documentId: doc._id });
                }}
                className="p-2 text-gray-400 rounded-lg transition-colors hover:text-red-400 hover:bg-gray-700"
                aria-label="Delete document"
              >
                {renderIcon(Trash2, { className: "w-4 h-4" })}
              </button>
            </div>
            {doc.summary && (
              <p className="mt-3 text-sm text-gray-400">{doc.summary}</p>
            )}
          </div>
        ))}
      </div>

      <DocumentViewer
        documentId={selectedDocumentId || ""}
        isOpen={!!selectedDocumentId}
        onClose={() => setSelectedDocumentId(null)}
      />
    </div>
  );
}