"use client";

import { useQuery } from "convex/react";
import { FileText, Trash2 } from "lucide-react";
import type React from "react";
import { memo, useCallback, useState } from "react";
import { api } from "../../generated-convex";
import { renderIcon } from "../../lib/icon-utils";
// Removed ragChatStore import - chat functionality disabled
import { useDocumentStore } from "../../stores/document-store";
import { BackgroundGradient } from "../ui/backgrounds/background-gradient";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tool-tip";
import type { GenericId as Id } from "convex/values";
import DocumentCard from "./DocumentCard";
import DocumentViewer from "./DocumentViewer";
import type { UploadedDocument } from "../../stores/document-store";

interface DocumentBrowserProps {
  documents?: UploadedDocument[];
  loading?: boolean;
}

const DocumentBrowser = memo(function DocumentBrowser({
  documents = [],
  loading = false,
}: DocumentBrowserProps): React.ReactElement | null {
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"rag_documents"> | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [animationOrigin, setAnimationOrigin] = useState<{ x: number; y: number } | undefined>();
  const [expandingDocument, setExpandingDocument] = useState<{ docId: string; paperIndex: number } | null>(null);
  
  // Get state and actions from stores
  const { deletingIds, deleteDocument } = useDocumentStore();
  
  // Chat functionality removed - focusing on document management only

  const handlePaperClick = useCallback(
    (documentId: string, paperIndex: number, event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      setAnimationOrigin({ x: centerX, y: centerY });
      setExpandingDocument({ docId: documentId, paperIndex });
      
      // Delay opening the viewer to allow for animation
      setTimeout(() => {
        setSelectedDocumentId(documentId as unknown as Id<"rag_documents">);
        setIsDocumentViewerOpen(true);
        setExpandingDocument(null);
      }, 300);
    },
    []
  );

  const handleFolderClick = useCallback(
    (documentId: string, event?: React.MouseEvent) => {
      if (event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setAnimationOrigin({ x: centerX, y: centerY });
      }
      
      setSelectedDocumentId(documentId as unknown as Id<"rag_documents">);
      setIsDocumentViewerOpen(true);
    },
    []
  );

  const handleCloseViewer = useCallback(() => {
    setIsDocumentViewerOpen(false);
    setSelectedDocumentId(null);
    setAnimationOrigin(undefined);
  }, []);

  const handleDeleteDocument = useCallback(
    (documentId: string) => {
      deleteDocument(documentId);
    },
    [deleteDocument]
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state for documents
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex border-b border-slate-600/30">
          <button className="px-4 py-2 text-cyan-300 border-b-2 border-cyan-300">
            Documents
          </button>
          <button className="px-4 py-2 text-gray-400">
            Chat History
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-3 animate-pulse">
              <div className="w-24 h-20 bg-gray-600 rounded-lg"></div>
              <div className="w-16 h-3 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Library */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Document Library</h2>
          
          {!documents || documents.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-gray-600 bg-slate-950/50">
              <div className="mb-4">
                {renderIcon(FileText, {
                  className: "mx-auto w-12 h-12 text-gray-500",
                })}
              </div>
              <p className="text-gray-400">No documents uploaded yet.</p>
              <p className="text-sm text-gray-500">
                Upload your first document to see it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {documents.map((document) => (
                <DocumentCard
                  key={document._id}
                  document={document}
                  isDeleting={deletingIds.has(document._id)}
                  expandingDocument={expandingDocument}
                  onPaperClick={handlePaperClick}
                  onFolderClick={handleFolderClick}
                  onDelete={handleDeleteDocument}
                />
              ))}
            </div>
          )}
        </div>

      {/* Document Viewer */}
      {selectedDocumentId && (
        <DocumentViewer
          documentId={selectedDocumentId}
          isOpen={isDocumentViewerOpen}
          onClose={handleCloseViewer}
          animationOrigin={animationOrigin}
        />
      )}
    </div>
  );
});

export { DocumentBrowser };