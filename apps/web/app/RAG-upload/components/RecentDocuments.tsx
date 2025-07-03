"use client";

import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { renderIcon } from '../../lib/icon-utils';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'next/navigation';

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

interface RecentDocumentsProps {
  documentsQuery: {
    page: UploadedDocument[];
  } | undefined;
}

export function RecentDocuments({ documentsQuery }: RecentDocumentsProps): React.ReactElement | null {
  const router = useRouter();
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
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h2 className="mb-4 text-xl font-semibold text-white">Recent Documents</h2>
      <div className="space-y-3">
        {documentsQuery.page.map((doc: UploadedDocument) => (
          <div key={doc._id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg transition-colors hover:bg-gray-600">
            <button 
              onClick={() => router.push(`/RAG-upload/${doc._id}`)}
              className="flex gap-3 items-center flex-grow bg-transparent border-none cursor-pointer text-left p-0"
            >
              <div className={`p-2 rounded-lg ${
                doc.contentType === 'markdown' ? 'bg-curious-cyan-900 text-curious-cyan-300' : 'bg-gray-600 text-gray-300'
              }`}>
                {renderIcon(FileText, { className: "w-4 h-4" })}
              </div>
              <div>
                <h3 className="font-medium text-white">{doc.title}</h3>
                <p className="text-sm text-gray-400">
                  {doc.wordCount.toLocaleString()} words • {formatFileSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}
                </p>
                {doc.summary && (
                  <p className="mt-1 text-sm text-gray-500">{doc.summary}</p>
                )}
              </div>
            </button>
            <div className="flex gap-2 items-center">
              <span className={`px-2 py-1 text-xs rounded-full ${
                doc.contentType === 'markdown' 
                  ? 'bg-curious-cyan-900 text-curious-cyan-300' 
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {doc.contentType}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm('Are you sure you want to delete this document?')) {
                    deleteDocument({ documentId: doc._id });
                  }
                }}
                className="p-1 text-gray-400 transition-colors hover:text-red-400"
                title="Delete document"
              >
                {renderIcon(Trash2, { className: "w-4 h-4" })}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}