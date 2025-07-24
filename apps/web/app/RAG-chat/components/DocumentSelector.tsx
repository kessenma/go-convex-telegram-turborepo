"use client";

import { BotMessageSquare, CheckCircle, FileText, Zap } from "lucide-react";
import { Button as MovingButton } from "../../../components/ui/moving-border";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tool-tip";
import { renderIcon } from "../../../lib/icon-utils";
import type { Document } from "../types";

interface DocumentSelectorProps {
  documents: Document[];
  selectedDocuments: string[];
  onDocumentToggle: (documentId: string) => void;
  onStartChat: () => void;
  onShowHistory: () => void;
}

export function DocumentSelector({
  documents,
  selectedDocuments,
  onDocumentToggle,
  onStartChat,
  onShowHistory,
}: DocumentSelectorProps): React.ReactElement {
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

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <p className="mt-4 sm:mt-8 text-gray-200 text-sm sm:text-base leading-relaxed">
          Choose document(s) from your database to start a conversation.
        </p>
        <div className="flex justify-center items-center mt-4">
          <div className="flex gap-2 items-center text-sm text-gray-400">
            {renderIcon(Zap, { className: "w-4 h-4 text-green-400" })}
            <span>{embeddedCount} embedded documents available</span>
          </div>
        </div>
      </div>

      {filteredDocuments.length > 0 ? (
        <>
          <div className="w-full space-y-4">
            {filteredDocuments.map((doc) => {
              const isSelected = selectedDocuments.includes(doc._id);

              return (
                <div
                  key={doc._id}
                  className={`w-full p-3 sm:p-4 cursor-pointer transition-all duration-200 rounded-lg border ${isSelected
                    ? "border-curious-cyan-500 bg-curious-cyan-900/20"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                    }`}
                  onClick={() => onDocumentToggle(doc._id)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center mb-2">
                        {renderIcon(FileText, {
                          className: "w-4 h-4 text-curious-cyan-400 flex-shrink-0",
                        })}
                        <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                          {doc.title}
                        </h3>
                        <div className="flex gap-1 items-center flex-shrink-0">
                          {renderIcon(Zap, {
                            className: "w-3 h-3 sm:w-4 sm:h-4 text-green-400",
                          })}
                          <span className="text-xs font-medium text-green-400">
                            Embedded
                          </span>
                        </div>
                      </div>

                      {doc.summary && (
                        <p className="mb-2 text-xs sm:text-sm text-gray-300 line-clamp-2">
                          {doc.summary}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-400">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>{doc.wordCount.toLocaleString()} words</span>
                        <span className="hidden sm:inline">{formatDate(doc.uploadedAt)}</span>
                        <span className="capitalize">{doc.contentType}</span>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 flex-shrink-0 rounded border-2 transition-colors ${isSelected
                        ? "bg-curious-cyan-500 border-curious-cyan-500"
                        : "border-gray-400"
                        }`}
                    >
                      {isSelected && (
                        <div className="flex justify-center items-center w-full h-full">
                          {renderIcon(CheckCircle, {
                            className: "w-3 h-3 text-white",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <button
              onClick={onShowHistory}
              className="flex gap-2 items-center px-4 py-2 text-gray-300 rounded-lg border border-gray-600 transition-colors bg-gray-800/50 hover:border-gray-500 hover:text-white w-full sm:w-auto justify-center"
            >
              {renderIcon(FileText, { className: "w-4 h-4" })}
              View History
            </button>

            {selectedDocuments.length > 0 ? (
              <MovingButton
                onClick={onStartChat}
                className="bg-slate-900/[0.8] text-white w-full sm:w-auto"
                containerClassName="w-full sm:w-auto min-w-[200px]"
                borderClassName="bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]"
              >
                <span className="flex gap-2 items-center justify-center">
                  {renderIcon(BotMessageSquare, { className: "w-4 h-4" })}
                  <span className="hidden sm:inline">Start Chat ({selectedDocuments.length} selected)</span>
                  <span className="sm:hidden">Chat ({selectedDocuments.length})</span>
                </span>
              </MovingButton>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex gap-2 items-center justify-center px-4 py-2 text-gray-500 rounded-lg border border-gray-600 transition-colors bg-gray-800/30 cursor-not-allowed w-full sm:w-auto min-w-[200px]"
                    disabled
                  >
                    {renderIcon(BotMessageSquare, { className: "w-4 h-4" })}
                    <span className="hidden sm:inline">Start Chat (0 selected)</span>
                    <span className="sm:hidden">Chat (0)</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-gray-900 text-white border border-gray-700"
                >
                  <p>Please select at least one document to start chatting</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </>
      ) : (
        <div className="w-full p-6 sm:p-8 text-center">
          <div className="mb-4">
            {renderIcon(FileText, {
              className: "mx-auto w-12 h-12 text-gray-400",
            })}
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">
            No Embedded Documents Found
          </h3>
          <p className="mb-4 text-gray-300 text-sm sm:text-base">
            You need to upload and embed documents before you can start
            chatting.
          </p>
          <MovingButton
            onClick={() => (window.location.href = "/RAG-upload")}
            className="bg-slate-900/[0.8] text-white w-full sm:w-auto"
            containerClassName="w-full sm:w-auto min-w-[150px]"
            borderClassName="bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]"
          >
            Upload Documents
          </MovingButton>
        </div>
      )}
    </div>
  );
}
