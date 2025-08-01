"use client";

import { BotMessageSquare, CheckCircle, FileText, Zap, Upload } from "lucide-react";
import { Button as MovingButton } from "../../ui/moving-border";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tool-tip";
import { renderIcon } from "../../../lib/icon-utils";
import { useRagChatStore } from "../../../stores/ragChatStore";
import { DocumentUploadModal } from "../../chat/DocumentUploadModal";
import type { Document } from "../../../app/RAG-chat/types";
import { useState } from "react";
import { toast } from "sonner";

interface DocumentSelectorProps {
  documents: Document[];
  onSelectionChange?: (selectedDocuments: Document[]) => void;
  selectedDocuments?: Document[];
  showActionButtons?: boolean;
  onDone?: () => void; // New prop for external mode
  onUploadSuccess?: () => void; // Callback for when upload succeeds
}

export function DocumentSelector({
  documents,
  onSelectionChange,
  selectedDocuments: externalSelectedDocuments,
  showActionButtons = true,
  onDone,
  onUploadSuccess,
}: DocumentSelectorProps): React.ReactElement {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Get state and actions from Zustand store
  const {
    selectedDocuments: storeSelectedDocuments,
    toggleDocument,
    navigateToChat,
    navigateToHistory
  } = useRagChatStore();

  // Use external selection if provided, otherwise use store
  const selectedDocuments = externalSelectedDocuments ? 
    externalSelectedDocuments.map(doc => doc._id) : 
    storeSelectedDocuments;
  // Ensure documents is an array
  const safeDocuments = Array.isArray(documents) ? documents : [];

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
    });
  };

  // Only show documents with embeddings
  const filteredDocuments = safeDocuments.filter((doc) => doc.hasEmbedding);
  const embeddedCount = filteredDocuments.length;

  const handleDocumentToggle = (documentId: string) => {
    if (onSelectionChange && externalSelectedDocuments) {
      // External mode - handle selection externally
      const document = filteredDocuments.find(doc => doc._id === documentId);
      if (!document) return;

      const isSelected = externalSelectedDocuments.some(doc => doc._id === documentId);
      let newSelection: Document[];
      
      if (isSelected) {
        newSelection = externalSelectedDocuments.filter(doc => doc._id !== documentId);
      } else {
        if (externalSelectedDocuments.length >= 3) return; // Max 3 documents
        newSelection = [...externalSelectedDocuments, document];
      }
      
      onSelectionChange(newSelection);
      // Don't close modal in external mode - let parent handle it
    } else {
      // Store mode - use Zustand store
      toggleDocument(documentId);
    }
  };

  const handleStartChatClick = () => {
    navigateToChat();
  };

  const handleUploadSuccess = () => {
    // Refresh the documents list or trigger a refetch
    onUploadSuccess?.();
    setIsUploadModalOpen(false);
    // Show success message
    toast.success('Document uploaded successfully! You can now select it for chat.');
  };

  return (
    <div className="space-y-6 w-full">
      <div className="text-center">
        <p className="pb-4 text-sm leading-relaxed text-left text-cyan-100 border-b border-cyan-100 sm:mt-8 sm:text-base">
          Choose up to 3 documents from your database to start a conversation.
        </p>
        <div className="flex gap-4 justify-center items-center mt-4">
          <div className="flex gap-2 items-center text-sm text-left text-cyan-100">
            {renderIcon(Zap, { className: "w-4 h-4 text-white" })}
            <span>{embeddedCount} embedded documents available</span>
          </div>
          <div className="flex gap-2 items-center pl-4 text-sm text-right text-cyan-100 border-l border-cyan-100">
            {renderIcon(CheckCircle, { className: "w-4 h-4" })}
            <span>{selectedDocuments.length}/3 selected</span>
          </div>
        </div>

        {/* Upload and Done buttons - side by side for external mode */}
        {!showActionButtons && (
          <div className="flex gap-3 justify-center items-center mt-4 sm:gap-4">
            <MovingButton
              onClick={() => setIsUploadModalOpen(true)}
              className="text-white backdrop-blur-md bg-slate-900/40 hover:bg-slate-800/60"
              containerClassName="min-w-[140px] sm:min-w-[180px]"
              borderClassName="bg-[radial-gradient(#10b981_40%,#059669_60%,transparent_80%)]"
            >
              <span className="flex gap-2 justify-center items-center">
                {renderIcon(Upload, { className: "w-4 h-4" })}
                <span className="hidden sm:inline">Upload New Document</span>
                <span className="sm:hidden">Upload</span>
              </span>
            </MovingButton>
            
            {onDone && (
              <MovingButton
                onClick={onDone}
                className="text-white backdrop-blur-md bg-slate-900/40 hover:bg-slate-800/60"
                containerClassName="min-w-[140px] sm:min-w-[180px]"
                borderClassName="bg-[radial-gradient(#06b6d4_40%,#0ea5e9_60%,transparent_80%)]"
              >
                <span className="flex gap-2 justify-center items-center">
                  {renderIcon(CheckCircle, { className: "w-4 h-4" })}
                  <span className="hidden sm:inline">Done ({selectedDocuments.length} selected)</span>
                  <span className="sm:hidden">Done ({selectedDocuments.length})</span>
                </span>
              </MovingButton>
            )}
          </div>
        )}

        {/* Upload button for regular mode */}
        {showActionButtons && (
          <div className="flex justify-center mt-4">
            <MovingButton
              onClick={() => setIsUploadModalOpen(true)}
              className="text-white backdrop-blur-md bg-slate-900/40 hover:bg-slate-800/60"
              containerClassName="min-w-[180px]"
              borderClassName="bg-[radial-gradient(#10b981_40%,#059669_60%,transparent_80%)]"
            >
              <span className="flex gap-2 justify-center items-center">
                {renderIcon(Upload, { className: "w-4 h-4" })}
                Upload New Document
              </span>
            </MovingButton>
          </div>
        )}
        {/* Action buttons - only show if showActionButtons is true */}
        {showActionButtons && (
          <div className="flex gap-3 justify-center items-center pt-4 sm:gap-4">
            <MovingButton
              onClick={navigateToHistory}
              className="flex-1 text-white backdrop-blur-md bg-slate-900/40 sm:w-auto sm:flex-initial"
              containerClassName="flex-1 sm:w-auto sm:flex-initial min-w-[120px] sm:min-w-[180px]"
              borderClassName="bg-[radial-gradient(#64748b_40%,#475569_60%,transparent_80%)]"
            >
              <span className="flex gap-2 justify-center items-center">
                {renderIcon(FileText, { className: "w-4 h-4" })}
                <span className="hidden sm:inline">View History</span>
                <span className="sm:hidden">History</span>
              </span>
            </MovingButton>

            {selectedDocuments.length > 0 ? (
              <div className="flex-1 sm:w-auto sm:flex-initial min-w-[140px] sm:min-w-[200px] group">
                <MovingButton
                  onClick={handleStartChatClick}
                  className="w-full text-white backdrop-blur-md transition-all duration-300 bg-slate-900/40 hover:bg-slate-800/60"
                  containerClassName="w-full"
                  borderClassName="bg-[radial-gradient(#06b6d4_40%,#0ea5e9_60%,transparent_80%)]"
                >
                  <span className="flex gap-2 justify-center items-center">
                    {renderIcon(BotMessageSquare, { className: "w-4 h-4" })}
                    <span className="hidden sm:inline">Start Chat ({selectedDocuments.length} selected)</span>
                    <span className="sm:hidden">Chat ({selectedDocuments.length})</span>
                  </span>
                </MovingButton>
              </div>
            ) : (
              <div className="flex-1 sm:w-auto sm:flex-initial min-w-[140px] sm:min-w-[200px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <MovingButton
                        className="w-full backdrop-blur-md cursor-not-allowed text-slate-500 bg-slate-800/20"
                        containerClassName="w-full"
                        borderClassName="bg-[radial-gradient(#64748b_20%,#475569_40%,transparent_60%)]"
                        disabled
                      >
                        <span className="flex gap-2 justify-center items-center">
                          {renderIcon(BotMessageSquare, { className: "w-4 h-4" })}
                          <span className="hidden sm:inline">Start Chat (0 selected)</span>
                          <span className="sm:hidden">Chat (0)</span>
                        </span>
                      </MovingButton>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-white border backdrop-blur-md bg-slate-900/90 border-slate-700/50"
                  >
                    <p>Please select at least one document to start chatting</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        )}


      </div>

      {filteredDocuments.length > 0 ? (
        <div className="space-y-6">
          <div className="w-full max-h-[600px] overflow-y-auto border border-slate-600/30 rounded-2xl bg-gradient-to-br from-slate-800/20 via-slate-900/30 to-slate-800/20 backdrop-blur-md">
            <div className="p-4 pb-16 space-y-4 w-full">
              {filteredDocuments.map((doc) => {
                const isSelected = selectedDocuments.includes(doc._id);
                const canSelect = isSelected || selectedDocuments.length < 3;

                return (
                  <div
                    key={doc._id}
                    className={`w-full p-3 sm:p-4 cursor-pointer transition-all duration-300 rounded-2xl backdrop-blur-md ${isSelected
                      ? "bg-gradient-to-br border shadow-lg from-cyan-500/10 via-cyan-400/15 to-cyan-500/10 border-cyan-400/30 shadow-cyan-500/20"
                      : canSelect
                        ? "bg-gradient-to-br border from-slate-800/30 via-slate-700/40 to-slate-800/30 border-slate-600/30 hover:from-slate-700/40 hover:via-slate-600/50 hover:to-slate-700/40 hover:border-slate-500/50"
                        : "bg-gradient-to-br border cursor-not-allowed from-slate-800/15 via-slate-900/20 to-slate-800/15 border-slate-700/20"
                      } ${!canSelect ? "opacity-50" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (canSelect) {
                        handleDocumentToggle(doc._id);
                      }
                    }}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 items-center mb-2">
                          {renderIcon(FileText, {
                            className: `w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-400"} flex-shrink-0`,
                          })}
                          <h3 className={`font-semibold text-sm sm:text-base ${isSelected ? "text-cyan-100" : "text-slate-200"
                            } flex-1 min-w-0`}>
                            {doc.title}
                          </h3>
                          <div className="flex flex-shrink-0 gap-1 items-center">
                            {renderIcon(Zap, {
                              className: "w-3 h-3 sm:w-4 sm:h-4 text-cyan-400",
                            })}
                            <span className="text-xs font-medium text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                              Embedded
                            </span>
                          </div>
                        </div>

                        {doc.summary && (
                          <p className={`mb-2 text-xs sm:text-sm line-clamp-2 ${isSelected ? "text-cyan-200" : "text-slate-300"
                            }`}>
                            {doc.summary}
                          </p>
                        )}

                        <div className={`flex flex-wrap gap-1 sm:gap-2 text-xs ${isSelected ? "text-cyan-300" : "text-slate-400"
                          }`}>
                          <span className="px-2 py-1 rounded-lg bg-slate-700/50">{formatFileSize(doc.fileSize)}</span>
                          <span className="px-2 py-1 rounded-lg bg-slate-700/50">{doc.wordCount.toLocaleString()} words</span>
                          <span className="hidden px-2 py-1 rounded-lg sm:inline bg-slate-700/50">{formatDate(doc.uploadedAt)}</span>
                          <span className="px-2 py-1 capitalize rounded-lg bg-slate-700/50">{doc.contentType}</span>
                        </div>
                      </div>

                      {/* Mobile-friendly checkbox */}
                      <div className="flex flex-shrink-0 items-start pt-1">
                        <div
                          className={`w-6 h-6 sm:w-5 sm:h-5 rounded-lg border-2 transition-all duration-300 ${isSelected
                            ? "bg-cyan-500 border-cyan-400 shadow-lg shadow-cyan-500/50"
                            : canSelect
                              ? "border-slate-400 hover:border-slate-300"
                              : "border-slate-600"
                            }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (canSelect) {
                              handleDocumentToggle(doc._id);
                            }
                          }}
                        >
                          {isSelected && (
                            <div className="flex justify-center items-center w-full h-full">
                              {renderIcon(CheckCircle, {
                                className: "w-4 h-4 sm:w-3 sm:h-3 text-white",
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 w-full text-center bg-gradient-to-br rounded-2xl border backdrop-blur-md from-slate-900/40 via-slate-800/60 to-slate-900/40 border-cyan-500/20">
          <div className="mb-6">
            {renderIcon(FileText, {
              className: "mx-auto w-16 h-16 text-cyan-400",
            })}
          </div>
          <h3 className="mb-4 text-xl font-semibold text-cyan-100">
            No Embedded Documents Found
          </h3>
          <p className="mx-auto mb-6 max-w-md text-sm text-cyan-200/80 sm:text-base">
            You need to upload and embed documents before you can start
            chatting with your AI assistant.
          </p>
          <MovingButton
            onClick={() => (window.location.href = "/RAG-upload")}
            className="w-full text-white backdrop-blur-md transition-all duration-300 bg-slate-900/40 sm:w-auto hover:bg-slate-800/60"
            containerClassName="w-full sm:w-auto min-w-[180px]"
            borderClassName="bg-[radial-gradient(#06b6d4_40%,#0ea5e9_60%,transparent_80%)]"
          >
            Upload Documents
          </MovingButton>
        </div>
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}