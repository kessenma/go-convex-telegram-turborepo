"use client";

import React, { useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { renderIcon } from '../../lib/icon-utils';
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
  documents: UploadedDocument[];
  loading: boolean;
}

function DocumentHistory({ documents, loading }: DocumentHistoryProps): React.ReactElement | null {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDeleteDocument = async (documentId: string) => {
    setDeletingIds(prev => new Set(prev).add(documentId));
    try {
      const response = await fetch(`/api/RAG/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Document will be removed from the list on next refetch
        window.location.reload(); // Simple refresh for now
      } else {
        console.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Recent Documents</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-slate-950 rounded-lg border border-gray-700 animate-pulse">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 bg-gray-600 rounded-lg"></div>
                <div className="flex-1">
                  <div className="mb-2 w-32 h-4 bg-gray-600 rounded"></div>
                  <div className="w-48 h-3 bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Recent Documents</h2>
        <div className="p-8 text-center rounded-lg border border-gray-600 bg-slate-950/50">
          <div className="mb-4">
            {renderIcon(FileText, { className: "mx-auto w-12 h-12 text-gray-500" })}
          </div>
          <p className="text-gray-400">No documents uploaded yet.</p>
          <p className="text-sm text-gray-500">Upload your first document to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Recent Documents</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {documents.map((doc) => (
          <div
            key={doc._id}
            className="p-4 bg-slate-950 rounded-lg border border-gray-700 transition-colors cursor-pointer hover:border-cyan-500"
            onClick={() => setSelectedDocumentId(doc._id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <div className={`p-2 rounded-lg ${doc.contentType === 'markdown' ? 'bg-cyan-900 text-cyan-300' : 'bg-gray-700 text-gray-300'}`}>
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
                  handleDeleteDocument(doc._id);
                }}
                disabled={deletingIds.has(doc._id)}
                className={`p-2 rounded-lg transition-colors ${
                  deletingIds.has(doc._id)
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-400 hover:text-red-400 hover:bg-slate-800'
                }`}
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

export { DocumentHistory };