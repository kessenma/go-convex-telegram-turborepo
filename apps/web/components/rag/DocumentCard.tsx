"use client";

import { FileText, Trash2 } from "lucide-react";
import type React from "react";
import { memo } from "react";
import { renderIcon } from "../../lib/icon-utils";
import type { UploadedDocument } from "../../stores/document-store";
import Folder from "./folder";

interface DocumentCardProps {
  document: UploadedDocument;
  isDeleting: boolean;
  expandingDocument: { docId: string; paperIndex: number } | null;
  onPaperClick: (
    documentId: string,
    paperIndex: number,
    event: React.MouseEvent
  ) => void;
  onFolderClick: (documentId: string, event?: React.MouseEvent) => void;
  onDelete: (documentId: string) => void;
}

const DocumentCard = memo(function DocumentCard({
  document,
  isDeleting,
  expandingDocument,
  onPaperClick,
  onFolderClick,
  onDelete,
}: DocumentCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDocumentColor = (contentType: string): string => {
    switch (contentType.toLowerCase()) {
      case "markdown":
        return "#475569"; // slate-600
      case "pdf":
        return "#64748b"; // slate-500
      case "text":
        return "#334155"; // slate-700
      default:
        return "#1e293b"; // slate-800
    }
  };

  const createDocumentPapers = (doc: UploadedDocument): React.ReactNode[] => {
    const papers: React.ReactNode[] = [];

    // First paper: Document icon and title
    papers.push(
      <div className="flex flex-col justify-center items-center p-2 h-full text-center">
        <div className="mb-1">
          {renderIcon(FileText, { className: "w-4 h-4 text-gray-300" })}
        </div>
        <div className="w-full text-xs font-medium text-gray-200 truncate">
          {doc.title.length > 12
            ? `${doc.title.substring(0, 12)}...`
            : doc.title}
        </div>
      </div>
    );

    // Second paper: File info
    papers.push(
      <div className="flex flex-col justify-center items-center p-2 h-full text-center">
        <div className="mb-1 text-xs text-gray-300">
          {doc.wordCount.toLocaleString()} words
        </div>
        <div className="text-xs text-gray-400">
          {formatFileSize(doc.fileSize)}
        </div>
      </div>
    );

    // Third paper: Date
    papers.push(
      <div className="flex flex-col justify-center items-center p-2 h-full text-center">
        <div className="text-xs text-gray-300">
          {formatDate(doc.uploadedAt)}
        </div>
      </div>
    );

    return papers;
  };

  const handlePaperClick = (paperIndex: number) => {
    // Find the clicked paper element using the global document object
    const folderElement = window.document.querySelector(
      `[data-paper-index="${paperIndex}"]`
    ) as HTMLElement;
    if (folderElement) {
      // Create a synthetic mouse event
      const rect = folderElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Create a proper MouseEvent and cast it to React.MouseEvent
      const mouseEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: centerX,
        clientY: centerY,
        button: 0,
        buttons: 1,
      });

      // Add the currentTarget property
      Object.defineProperty(mouseEvent, "currentTarget", {
        value: folderElement,
        writable: false,
      });

      onPaperClick(
        document._id,
        paperIndex,
        mouseEvent as unknown as React.MouseEvent
      );
    } else {
      // Fallback to folder click
      onFolderClick(document._id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(
      "🖱️ Delete button clicked for document:",
      document._id,
      document.title
    );
    console.log("🖱️ onDelete function type:", typeof onDelete);
    onDelete(document._id);
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative group">
        <Folder
          color={getDocumentColor(document.contentType)}
          size={1.2}
          items={createDocumentPapers(document)}
          fileName={document.title}
          className="cursor-pointer"
          expandingPaper={
            expandingDocument?.docId === document._id
              ? expandingDocument.paperIndex
              : null
          }
          keepOpen={expandingDocument?.docId === document._id}
          deleting={isDeleting}
          onPaperClick={handlePaperClick}
          onFolderClick={() => onFolderClick(document._id)}
        />

        {/* Click overlay for opening document (fallback) */}
        <div
          className="absolute inset-0 z-30 cursor-pointer"
          onClick={(e) => onFolderClick(document._id, e)}
        />

        {/* Delete button overlay */}
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-50 ${
            isDeleting
              ? "text-gray-300 bg-gray-500 cursor-not-allowed"
              : "text-white bg-red-500 hover:bg-red-600 hover:scale-110"
          }`}
          aria-label="Delete document"
        >
          {renderIcon(Trash2, { className: "w-3 h-3" })}
        </button>
      </div>

      {/* Document type below folder */}
      <div className="text-center max-w-[120px]">
        <p className="text-xs text-gray-400">{document.contentType}</p>
      </div>

      {/* Summary tooltip on hover */}
      {document.summary && (
        <div className="hidden absolute top-full z-50 p-2 mt-2 max-w-xs text-xs text-white bg-gray-800 rounded shadow-lg group-hover:block">
          {document.summary}
        </div>
      )}
    </div>
  );
});

export default DocumentCard;
