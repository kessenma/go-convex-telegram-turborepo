"use client";

import { Folder } from "lucide-react";
import { useEffect, useState } from "react";
import { renderIcon } from "../../lib/icon-utils";
import DocumentViewer from "./DocumentViewer";

interface DocumentFolderIconProps {
  documentId: string;
  className?: string;
  interactive?: boolean;
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
  hasEmbedding: boolean;
}

export default function DocumentFolderIcon({
  documentId,
  className = "",
  interactive = true,
}: DocumentFolderIconProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | undefined>(undefined);
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }
        const data = await response.json();
        setDocumentData(data);
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const handleFolderClick = (e: React.MouseEvent) => {
    // Capture the click position for animation origin
    setClickPosition({ x: e.clientX, y: e.clientY });
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };

  // Don't render anything if loading or document doesn't have embeddings
  if (loading || !documentData?.hasEmbedding) {
    return null;
  }

  // If not interactive, just render the icon
  if (!interactive) {
    return (
      <div
        className={`inline-flex items-center justify-center p-1 rounded-sm border-2 border-gray-600 bg-gray-800 ${className}`}
        style={{ aspectRatio: '1/1' }}
      >
        {renderIcon(Folder, { className: "w-4 h-4 text-curious-cyan-500" })}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleFolderClick}
        className={`inline-flex items-center justify-center p-1 rounded-sm border-2 border-gray-600 bg-gray-800 hover:bg-gray-700 transition-colors ${className}`}
        aria-label="View document"
        style={{ aspectRatio: '1/1' }}
      >
        {renderIcon(Folder, { className: "w-4 h-4 text-curious-cyan-500" })}
      </button>

      <DocumentViewer
        documentId={documentId}
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
        animationOrigin={clickPosition}
        small={true}
      />
    </>
  );
}