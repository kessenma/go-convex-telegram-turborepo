"use client";

import { BotMessageSquare, CheckCircle, FileText, Zap } from "lucide-react";
import { Button as MovingButton } from "../../ui/moving-border";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tool-tip";
import { renderIcon } from "../../../lib/icon-utils";
import { useRagChatStore } from "../../../stores/ragChatStore";
import type { Document } from "../../../app/RAG-chat/types";

interface DocumentSelectorProps {
  documents: Document[];
}

export function DocumentSelector({
  documents,
}: DocumentSelectorProps): React.ReactElement {
  // Get state and actions from Zustand store
  const {
    selectedDocuments,
    toggleDocument,
    navigateToChat,
    navigateToHistory
  } = useRagChatStore();
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
    toggleDocument(documentId);
  };

  const handleStartChatClick = () => {
    navigateToChat();
  };

  return (
    <div className="space-y-6 w-full">
      <div className="text-center">
        <p className="mt-4 text-sm leading-relaxed text-cyan-200 sm:mt-8 sm:text-base">
          Choose up to 3 documents from your database to start a conversation.
        </p>
        <div className="flex gap-4 justify-center items-center mt-4">
          <div className="flex gap-2 items-center text-sm text-cyan-400">
            {renderIcon(Zap, { className: "w-4 h-4 text-cyan-400" })}
            <span>{embeddedCount} embedded documents available</span>
          </div>
          <div className="flex gap-2 items-center text-sm text-blue-400">
            {renderIcon(CheckCircle, { className: "w-4 h-4" })}
            <span>{selectedDocuments.length}/3 selected</span>
          </div>
        </div>
        {/* Action buttons */}
          <div className="flex flex-col gap-4 justify-center items-center sm:flex-row">
            <MovingButton
              onClick={navigateToHistory}
              className="w-full text-white backdrop-blur-md bg-slate-900/80 sm:w-auto"
              containerClassName="w-full sm:w-auto min-w-[180px]"
              borderClassName="bg-[radial-gradient(#64748b_40%,#475569_60%,transparent_80%)]"
            >
              <span className="flex gap-2 justify-center items-center">
                {renderIcon(FileText, { className: "w-4 h-4" })}
                <span className="hidden sm:inline">View History</span>
                <span className="sm:hidden">History</span>
              </span>
            </MovingButton>

            {selectedDocuments.length > 0 ? (
              <MovingButton
                onClick={handleStartChatClick}
                className="w-full text-white backdrop-blur-md bg-slate-900/80 sm:w-auto"
                containerClassName="w-full sm:w-auto min-w-[200px]"
                borderClassName="bg-[radial-gradient(#06b6d4_40%,#0ea5e9_60%,transparent_80%)]"
              >
                <span className="flex gap-2 justify-center items-center">
                  {renderIcon(BotMessageSquare, { className: "w-4 h-4" })}
                  <span className="hidden sm:inline">Start Chat ({selectedDocuments.length} selected)</span>
                  <span className="sm:hidden">Chat ({selectedDocuments.length})</span>
                </span>
              </MovingButton>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex gap-2 items-center justify-center px-6 py-3 text-slate-500 rounded-2xl border border-slate-600/30 transition-colors bg-slate-800/30 backdrop-blur-md cursor-not-allowed w-full sm:w-auto min-w-[200px]"
                    disabled
                  >
                    {renderIcon(BotMessageSquare, { className: "w-4 h-4" })}
                    <span className="hidden sm:inline">Start Chat (0 selected)</span>
                    <span className="sm:hidden">Chat (0)</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="text-white border backdrop-blur-md bg-slate-900/90 border-slate-700/50"
                >
                  <p>Please select at least one document to start chatting</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
      </div>

      {filteredDocuments.length > 0 ? (
        <div className="space-y-6">
          <div className="w-full max-h-[600px] overflow-y-auto border border-slate-600/30 rounded-2xl bg-slate-800/20 backdrop-blur-md">
            <div className="p-4 space-y-4 w-full pb-16">
              {filteredDocuments.map((doc) => {
                const isSelected = selectedDocuments.includes(doc._id);
                const canSelect = isSelected || selectedDocuments.length < 3;

                return (
                  <div
                    key={doc._id}
                    className={`w-full p-3 sm:p-4 cursor-pointer transition-all duration-300 rounded-2xl backdrop-blur-md ${isSelected
                      ? "border shadow-lg bg-cyan-500/10 border-cyan-400/30 shadow-cyan-500/20"
                      : canSelect
                        ? "border bg-slate-800/40 border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-500/50"
                        : "border cursor-not-allowed bg-slate-800/20 border-slate-700/20"
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
                              className: "w-3 h-3 sm:w-4 sm:h-4 text-emerald-400",
                            })}
                            <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
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
        <div className="p-8 w-full text-center rounded-2xl border backdrop-blur-md bg-slate-900/60 border-cyan-500/20">
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
            className="w-full text-white backdrop-blur-md bg-slate-900/80 sm:w-auto"
            containerClassName="w-full sm:w-auto min-w-[180px]"
            borderClassName="bg-[radial-gradient(#06b6d4_40%,#0ea5e9_60%,transparent_80%)]"
          >
            Upload Documents
          </MovingButton>
        </div>
      )}
    </div>
  );
}
