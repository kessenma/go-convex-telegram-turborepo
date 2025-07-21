"use client";

import { Folder } from "lucide-react";
import { useState } from "react";
import { renderIcon } from "../../lib/icon-utils";
import DocumentViewer from "./DocumentViewer";

interface DocumentFolderIconProps {
  documentId: string;
  className?: string;
}

export default function DocumentFolderIcon({
  documentId,
  className = "",
}: DocumentFolderIconProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | undefined>(undefined);

  const handleFolderClick = (e: React.MouseEvent) => {
    // Capture the click position for animation origin
    setClickPosition({ x: e.clientX, y: e.clientY });
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };

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