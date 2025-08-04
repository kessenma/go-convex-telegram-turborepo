"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { FileText, Search, Check, X, Loader2 } from 'lucide-react';
import { renderIcon } from '../../../lib/icon-utils';
import { BackgroundGradient } from '../../ui/backgrounds/background-gradient';
import type { Document } from '../../../types/rag';
import {
  useSelectedDocuments,
  useSetSelectedDocuments,
  useDocumentCount,
  useCanAddMoreDocuments
} from '../../../stores/unifiedChatStore';

interface DocumentSelectorProps {
  documents?: Document[];
  isLoading?: boolean;
  error?: Error | null;
  onDocumentSelect?: (documents: Document[]) => void;
  onClose?: () => void;
  maxDocuments?: number;
}

export const DocumentSelector = React.memo(function DocumentSelector({
  documents = [],
  isLoading = false,
  error = null,
  onDocumentSelect,
  onClose,
  maxDocuments = 3
}: DocumentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const selectedDocuments = useSelectedDocuments();
  const setSelectedDocuments = useSetSelectedDocuments();
  const documentCount = useDocumentCount();
  const canAddMore = useCanAddMoreDocuments();

  // Filter documents based on search term
  const filteredDocuments = useMemo(() => {
    if (!searchTerm.trim()) return documents;
    const term = searchTerm.toLowerCase();
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(term) ||
      doc.fileType?.toLowerCase().includes(term)
    );
  }, [documents, searchTerm]);

  // Check if a document is selected
  const isDocumentSelected = useCallback((documentId: string) => {
    return selectedDocuments.some(doc => doc._id === documentId);
  }, [selectedDocuments]);

  // Handle document toggle
  const handleDocumentToggle = useCallback((document: Document) => {
    const isSelected = isDocumentSelected(document._id);
    let newSelection: Document[];

    if (isSelected) {
      // Remove document
      newSelection = selectedDocuments.filter(doc => doc._id !== document._id);
    } else {
      // Add document if under limit
      if (selectedDocuments.length >= maxDocuments) {
        return; // Don't add if at limit
      }
      newSelection = [...selectedDocuments, document];
    }

    setSelectedDocuments(newSelection);
    onDocumentSelect?.(newSelection);
  }, [selectedDocuments, isDocumentSelected, setSelectedDocuments, onDocumentSelect, maxDocuments]);

  // Handle select all/none
  const handleSelectAll = useCallback(() => {
    if (selectedDocuments.length === 0) {
      // Select up to max documents
      const toSelect = filteredDocuments.slice(0, maxDocuments);
      setSelectedDocuments(toSelect);
      onDocumentSelect?.(toSelect);
    } else {
      // Clear selection
      setSelectedDocuments([]);
      onDocumentSelect?.([]);
    }
  }, [selectedDocuments.length, filteredDocuments, maxDocuments, setSelectedDocuments, onDocumentSelect]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4">
          {renderIcon(X, { className: "mx-auto w-12 h-12 text-red-400" })}
        </div>
        <p className="mb-2 text-red-400">Failed to load documents</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-600/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Select Documents</h3>
          <div className="text-sm text-cyan-300">
            {selectedDocuments.length}/{maxDocuments} selected
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
            {renderIcon(Search, { className: "w-4 h-4 text-gray-400" })}
          </div>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-2 pr-4 pl-10 w-full placeholder-gray-400 text-white rounded-lg border bg-slate-700/50 border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
          />
        </div>

        {/* Select All/None */}
        {filteredDocuments.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="mt-3 text-sm text-cyan-400 transition-colors hover:text-cyan-300"
          >
            {selectedDocuments.length === 0 ? 'Select All' : 'Clear Selection'}
          </button>
        )}
      </div>

      {/* Document List */}
      <div className="overflow-y-auto flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            {renderIcon(Loader2, { className: "w-8 h-8 text-cyan-400 animate-spin" })}
            <span className="ml-2 text-gray-400">Loading documents...</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mb-4">
              {renderIcon(FileText, { className: "mx-auto w-12 h-12 text-gray-500" })}
            </div>
            <p className="text-gray-400">
              {searchTerm ? 'No documents match your search' : 'No documents available'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((document) => {
              const isSelected = isDocumentSelected(document._id);
              const canSelect = canAddMore || isSelected;

              return (
                <BackgroundGradient
                  key={document._id}
                  color="cyan"
                  containerClassName="w-full"
                  tronMode={true}
                  intensity="subtle"
                >
                  <div
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400/50'
                        : canSelect
                        ? 'bg-slate-800/60 border-slate-600/30 hover:border-cyan-500/30 hover:bg-slate-700/60'
                        : 'opacity-50 cursor-not-allowed bg-slate-800/30 border-slate-600/20'
                    }`}
                    onClick={() => canSelect && handleDocumentToggle(document)}
                  >
                    <div className="flex gap-3 items-start">
                      {/* Checkbox */}
                      <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-cyan-500 border-cyan-500'
                          : 'bg-transparent border-slate-500'
                      }`}>
                        {isSelected && renderIcon(Check, { className: "w-3 h-3 text-white" })}
                      </div>

                      {/* Document Icon */}
                      <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                        {renderIcon(FileText, { className: "w-5 h-5 text-white" })}
                      </div>

                      {/* Document Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">
                          {document.title}
                        </h4>
                        <div className="flex gap-2 items-center mt-1 text-xs text-gray-400">
                          <span className="uppercase">{document.fileType || 'Unknown'}</span>
                          <span>•</span>
                          <span>{formatFileSize(document.fileSize || 0)}</span>
                          <span>•</span>
                          <span>{formatDate(document.uploadedAt || Date.now())}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </BackgroundGradient>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-600/30">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {selectedDocuments.length > 0 && (
              <span>
                {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 transition-colors hover:text-white"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default DocumentSelector;