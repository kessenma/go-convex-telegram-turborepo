"use client";

import React, { useEffect, useState } from 'react';
import { X, FileText, Calendar, Hash, BarChart3 } from 'lucide-react';
import { renderIcon } from '../../lib/icon-utils';

interface DocumentViewerProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface DocumentData {
  _id: string;
  title: string;
  content: string;
  contentType: string;
  fileSize: number;
  wordCount: number;
  uploadedAt: number;
  summary?: string;
}

export default function DocumentViewer({ documentId, isOpen, onClose }: DocumentViewerProps): React.ReactElement | null {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !documentId) {
      setDocument(null);
      setError(null);
      return;
    }

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/RAG/documents/${documentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }
        const data = await response.json();
        setDocument(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, isOpen]);

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="overflow-hidden w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex gap-3 items-center">
            <div className="p-2 bg-curious-cyan-900 rounded-lg text-curious-cyan-300">
              {renderIcon(FileText, { className: "w-5 h-5" })}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {document?.title || 'Loading...'}
              </h2>
              {document && (
                <p className="text-sm text-gray-400">
                  {document.contentType} • {formatFileSize(document.fileSize)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 rounded-lg transition-colors hover:text-white hover:bg-gray-700"
          >
            {renderIcon(X, { className: "w-5 h-5" })}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex justify-center items-center p-8">
              <div className="w-8 h-8 border-4 border-gray-600 rounded-full border-t-curious-cyan-500 animate-spin"></div>
            </div>
          )}

          {error && (
            <div className="p-6 text-center">
              <p className="text-red-400">Error: {error}</p>
            </div>
          )}

          {document && (
            <div className="p-6 space-y-6">
              {/* Document Stats */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex gap-3 items-center p-3 bg-gray-800 rounded-lg">
                  {renderIcon(Calendar, { className: "w-5 h-5 text-curious-cyan-400" })}
                  <div>
                    <p className="text-sm text-gray-400">Uploaded</p>
                    <p className="font-medium text-white">{formatDate(document.uploadedAt)}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-center p-3 bg-gray-800 rounded-lg">
                  {renderIcon(Hash, { className: "w-5 h-5 text-curious-cyan-400" })}
                  <div>
                    <p className="text-sm text-gray-400">Word Count</p>
                    <p className="font-medium text-white">{document.wordCount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-center p-3 bg-gray-800 rounded-lg">
                  {renderIcon(BarChart3, { className: "w-5 h-5 text-curious-cyan-400" })}
                  <div>
                    <p className="text-sm text-gray-400">File Size</p>
                    <p className="font-medium text-white">{formatFileSize(document.fileSize)}</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {document.summary && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-white">Summary</h3>
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="text-gray-300">{document.summary}</p>
                  </div>
                </div>
              )}

              {/* Content */}
              <div>
                <h3 className="mb-3 text-lg font-semibold text-white">Content</h3>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {document.content}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}