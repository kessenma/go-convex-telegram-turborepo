"use client";

import React, { useState, useCallback, memo } from 'react';
import { FileText } from 'lucide-react';
import { renderIcon } from '../../lib/icon-utils';
import DocumentViewer from './DocumentViewer';
import DocumentCard from './DocumentCard';
import { useDocumentStore, UploadedDocument } from '../../stores/document-store';

interface DocumentHistoryProps {
  documents: UploadedDocument[];
  loading: boolean;
}

const DocumentHistory = memo(function DocumentHistory({ documents, loading }: DocumentHistoryProps): React.ReactElement | null {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [animationOrigin, setAnimationOrigin] = useState<{ x: number; y: number } | undefined>(undefined);
  const [expandingDocument, setExpandingDocument] = useState<{ docId: string; paperIndex: number } | null>(null);
  
  // Zustand store - only get what we need
  const deletingIds = useDocumentStore(state => state.deletingIds);
  const deleteDocument = useDocumentStore(state => state.deleteDocument);

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    await deleteDocument(documentId);
  }, [deleteDocument]);

  const handlePaperClick = (documentId: string, paperIndex: number, event: React.MouseEvent) => {
    // Get the clicked paper element's position
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Start the expanding animation
    setExpandingDocument({ docId: documentId, paperIndex });
    setAnimationOrigin({ x: centerX, y: centerY });
    
    // Delay opening the DocumentViewer to allow the paper to move to center
    setTimeout(() => {
      setSelectedDocumentId(documentId);
    }, 350); // Half of the animation duration
  };

  const handleFolderClick = useCallback((documentId: string, event?: React.MouseEvent) => {
    // Get animation origin from folder center if event is provided
    if (event) {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      setAnimationOrigin({ x: centerX, y: centerY });
    } else {
      // Default center animation when clicking folder itself
      setAnimationOrigin(undefined);
    }
    setSelectedDocumentId(documentId);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Document History</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <div className="w-[100px] h-[80px] bg-gray-600 rounded-lg animate-pulse"></div>
              <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Document History</h2>
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
    <div className="space-y-6">
      <h2 className="mb-16 text-xl font-semibold text-center text-white">Document History</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {documents.map((doc) => (
          <DocumentCard
            key={doc._id}
            document={doc}
            isDeleting={deletingIds.has(doc._id)}
            expandingDocument={expandingDocument}
            onPaperClick={handlePaperClick}
            onFolderClick={handleFolderClick}
            onDelete={handleDeleteDocument}
          />
        ))}
      </div>

      <DocumentViewer
        documentId={selectedDocumentId || ""}
        isOpen={!!selectedDocumentId}
        onClose={() => {
          setSelectedDocumentId(null);
          setAnimationOrigin(undefined);
          setExpandingDocument(null);
        }}
        animationOrigin={animationOrigin}
      />
    </div>
  );
});

export { DocumentHistory };