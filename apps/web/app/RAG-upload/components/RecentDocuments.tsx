"use client";

import React from 'react';
import { FileText } from 'lucide-react';
import { renderIcon } from '../../lib/icon-utils';

interface UploadedDocument {
  _id: string;
  title: string;
  contentType: string;
  fileSize: number;
  wordCount: number;
  uploadedAt: number;
  summary?: string;
}

interface RecentDocumentsProps {
  documentsQuery: {
    page: UploadedDocument[];
  } | undefined;
}

export function RecentDocuments({ documentsQuery }: RecentDocumentsProps): React.ReactElement | null {
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
          <div key={doc._id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
            <div className="flex gap-3 items-center">
              <div className={`p-2 rounded-lg ${
                doc.contentType === 'markdown' ? 'bg-curious-blue-900 text-curious-blue-300' : 'bg-gray-600 text-gray-300'
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
            </div>
            <div className="flex gap-2 items-center">
              <span className={`px-2 py-1 text-xs rounded-full ${
                doc.contentType === 'markdown' 
                  ? 'bg-curious-blue-900 text-curious-blue-300' 
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {doc.contentType}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}