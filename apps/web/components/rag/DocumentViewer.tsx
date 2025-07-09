"use client";

import React, { useEffect, useState, useId, useRef } from 'react';
import { X, FileText, Calendar, Hash, BarChart3, Zap, ZapOff } from 'lucide-react';
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from '../../hooks/use-outside-clicks';
import { renderIcon } from '../../lib/icon-utils';

interface DocumentViewerProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  animationOrigin?: { x: number; y: number };
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
  embedding?: number[];
  hasEmbedding?: boolean;
}

export default function DocumentViewer({ documentId, isOpen, onClose, animationOrigin }: DocumentViewerProps): React.ReactElement | null {
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingEmbedding, setGeneratingEmbedding] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!isOpen || !documentId) {
      setDocumentData(null);
      setError(null);
      return;
    }

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/RAG/documents/${documentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }
        const data = await response.json();
        // Check if document has embedding
        data.hasEmbedding = data.embedding && data.embedding.length > 0;
        setDocumentData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, isOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useOutsideClick(ref, () => onClose());

  const generateEmbedding = async () => {
    if (!documentData) return;
    
    setGeneratingEmbedding(true);
    try {
      const response = await fetch(`/api/RAG/documents/${documentData._id}/embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: documentData._id }),
      });
      
      if (response.ok) {
        // Update convex document status directly
        await fetch(`/api/convex/update-embedding-status`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            documentId: documentData._id,
            hasEmbedding: true
          })
        });
        
        // Refresh document data
        const docResponse = await fetch(`/api/RAG/documents/${documentId}`);
        if (docResponse.ok) {
          const updatedData = await docResponse.json();
          updatedData.hasEmbedding = updatedData.embedding && updatedData.embedding.length > 0;
          setDocumentData(updatedData);
        }
      }
    } catch (error) {
      console.error('Error generating embedding:', error);
    } finally {
      setGeneratingEmbedding(false);
    }
  };

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  // Calculate animation origin for the modal
  const getAnimationOrigin = () => {
    if (!animationOrigin) return { originX: '50%', originY: '50%' };
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const originX = `${(animationOrigin.x / viewportWidth) * 100}%`;
    const originY = `${(animationOrigin.y / viewportHeight) * 100}%`;
    
    return { originX, originY };
  };

  const { originX, originY } = getAnimationOrigin();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 w-full h-full bg-black/50"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen ? (
          <div className="fixed inset-0 grid place-items-center z-[100] p-4">
            <motion.div
              ref={ref}
              initial={{ 
                opacity: 0, 
                scale: 0.1,
                transformOrigin: `${originX} ${originY}`
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                transformOrigin: `${originX} ${originY}`
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.1,
                transformOrigin: `${originX} ${originY}`
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.4,
                delay: animationOrigin ? 0.35 : 0 // Delay if coming from paper expansion
              }}
              className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <div className="flex gap-3 items-center">
                  <div className="p-2 rounded-lg bg-curious-cyan-900 text-curious-cyan-300">
                    {renderIcon(FileText, { className: "w-5 h-5" })}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {documentData?.title || 'Loading...'}
                    </h2>
                    {documentData && (
                      <div className="flex gap-2 items-center">
                        <p className="text-sm text-gray-400">
                          {documentData.contentType} • {formatFileSize(documentData.fileSize)}
                        </p>
                        <div className="flex gap-1 items-center">
                          {documentData.hasEmbedding ? (
                            <>
                              {renderIcon(Zap, { className: "w-4 h-4 text-green-400" })}
                              <span className="text-xs text-green-400">Embedded</span>
                            </>
                          ) : (
                            <>
                              {renderIcon(ZapOff, { className: "w-4 h-4 text-gray-500" })}
                              <span className="text-xs text-gray-500">Not Embedded</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {documentData && !documentData.hasEmbedding && (
                    <button
                      onClick={generateEmbedding}
                      disabled={generatingEmbedding}
                      className="px-3 py-1 text-sm text-white rounded-lg bg-curious-cyan-600 hover:bg-curious-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingEmbedding ? 'Generating...' : 'Generate Embedding'}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 rounded-lg transition-colors hover:text-white hover:bg-gray-700"
                  >
                    {renderIcon(X, { className: "w-5 h-5" })}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1">
                {loading && (
                  <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 rounded-full border-4 border-gray-600 animate-spin border-t-curious-cyan-500"></div>
                  </div>
                )}

                {error && (
                  <div className="p-6 text-center">
                    <p className="text-red-400">Error: {error}</p>
                  </div>
                )}

                {documentData && (
                  <div className="p-6 space-y-6">
                    {/* Document Stats */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div className="flex gap-3 items-center p-3 bg-gray-800 rounded-lg">
                        {renderIcon(Calendar, { className: "w-5 h-5 text-curious-cyan-400" })}
                        <div>
                          <p className="text-sm text-gray-400">Uploaded</p>
                          <p className="font-medium text-white">{formatDate(documentData.uploadedAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-center p-3 bg-gray-800 rounded-lg">
                        {renderIcon(Hash, { className: "w-5 h-5 text-curious-cyan-400" })}
                        <div>
                          <p className="text-sm text-gray-400">Word Count</p>
                          <p className="font-medium text-white">{documentData.wordCount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-center p-3 bg-gray-800 rounded-lg">
                        {renderIcon(BarChart3, { className: "w-5 h-5 text-curious-cyan-400" })}
                        <div>
                          <p className="text-sm text-gray-400">File Size</p>
                          <p className="font-medium text-white">{formatFileSize(documentData.fileSize)}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-center p-3 bg-gray-800 rounded-lg">
                        {documentData.hasEmbedding ? (
                          renderIcon(Zap, { className: "w-5 h-5 text-green-400" })
                        ) : (
                          renderIcon(ZapOff, { className: "w-5 h-5 text-gray-500" })
                        )}
                        <div>
                          <p className="text-sm text-gray-400">Vector Status</p>
                          <p className={`font-medium ${documentData.hasEmbedding ? 'text-green-400' : 'text-gray-500'}`}>
                            {documentData.hasEmbedding ? 'Embedded' : 'Not Embedded'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Embedding Info */}
                    {documentData.hasEmbedding && documentData.embedding && (
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-white">Vector Embedding</h3>
                        <div className="p-4 bg-gray-800 rounded-lg">
                          <p className="text-gray-300">
                            Document has been converted to a {documentData.embedding.length}-dimensional vector for semantic search.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {documentData.summary && (
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-white">Summary</h3>
                        <div className="p-4 bg-gray-800 rounded-lg">
                          <p className="text-gray-300">{documentData.summary}</p>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-white">Content</h3>
                      <div className="overflow-y-auto p-4 max-h-96 bg-gray-800 rounded-lg">
                        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                          {documentData.content}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}