"use client";

import React from "react";
import { FileText, CheckCircle, AlertCircle, BotMessageSquare } from "lucide-react";
import { renderIcon } from "../../lib/icon-utils";
import { Card } from "../../components/ui/card";
import { Button as MovingButton } from "../../components/ui/moving-border";
import { Document } from "../types";

interface DocumentSelectorProps {
  documents: Document[];
  selectedDocuments: string[];
  onDocumentToggle: (documentId: string) => void;
  onStartChat: () => void;
}

export function DocumentSelector({ documents, selectedDocuments, onDocumentToggle, onStartChat }: DocumentSelectorProps) {
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
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Select Documents to Chat With</h2>
        <p className="text-gray-300">
          Choose one or more documents from your knowledge base to start a conversation.
        </p>
      </div>

      {documents && documents.length > 0 ? (
        <>
          <div className="grid gap-4">
            {documents.map((doc) => {
              const isSelected = selectedDocuments.includes(doc._id);
              const hasEmbedding = doc.embedding && doc.embedding.length > 0;
              
              return (
                <div 
                  key={doc._id} 
                  className={`p-4 cursor-pointer transition-all duration-200 rounded-lg border ${
                    isSelected 
                      ? 'border-curious-cyan-500 bg-curious-cyan-900/20' 
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                  onClick={() => onDocumentToggle(doc._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex gap-2 items-center mb-2">
                        {renderIcon(FileText, { className: "w-4 h-4 text-curious-cyan-400" })}
                        <h3 className="font-semibold text-white">{doc.title}</h3>
                        {hasEmbedding && renderIcon(CheckCircle, { className: "w-4 h-4 text-green-400" })}
                        {!hasEmbedding && renderIcon(AlertCircle, { className: "w-4 h-4 text-yellow-400" })}
                      </div>
                      
                      {doc.summary && (
                        <p className="mb-2 text-sm text-gray-300">{doc.summary}</p>
                      )}
                      
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>{doc.wordCount.toLocaleString()} words</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                        <span className="capitalize">{doc.contentType}</span>
                      </div>
                      
                      {!hasEmbedding && (
                        <div className="mt-2 text-xs text-yellow-400">
                          ⚠️ No embeddings generated - limited search capability
                        </div>
                      )}
                    </div>
                    
                    <div className={`w-4 h-4 rounded border-2 transition-colors ${
                      isSelected 
                        ? 'bg-curious-cyan-500 border-curious-cyan-500' 
                        : 'border-gray-400'
                    }`}>
                      {isSelected && (
                        <div className="flex justify-center items-center w-full h-full">
                          {renderIcon(CheckCircle, { className: "w-3 h-3 text-white" })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <MovingButton
              onClick={onStartChat}
              disabled={selectedDocuments.length === 0}
              className="bg-slate-900/[0.8] text-white"
              containerClassName="w-auto min-w-[200px]"
              borderClassName="bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]"
            >
              <span className="flex gap-2 items-center">
                {renderIcon(BotMessageSquare, { className: "w-4 h-4" })}
                Start Chat ({selectedDocuments.length} selected)
              </span>
            </MovingButton>
          </div>
        </>
      ) : (
        <Card className="p-8 text-center border-gray-700 bg-gray-800/50">
          <div className="mb-4">
            {renderIcon(FileText, { className: "mx-auto w-12 h-12 text-gray-400" })}
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">No Documents Found</h3>
          <p className="mb-4 text-gray-300">
            You need to upload some documents before you can start chatting.
          </p>
          <MovingButton
            onClick={() => window.location.href = '/RAG-upload'}
            className="bg-slate-900/[0.8] text-white"
            containerClassName="w-auto min-w-[150px]"
            borderClassName="bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]"
          >
            Upload Documents
          </MovingButton>
        </Card>
      )}
    </div>
  );
}