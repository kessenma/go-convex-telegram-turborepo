"use client";

import {
  BarChart3,
  Calendar,
  ChevronDown,
  FileText,
  Hash,
  Trash2,
  X,
  Zap,
  ZapOff,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { useNotifications } from "../../contexts/NotificationsContext";
import { useOutsideClick } from "../../hooks/use-outside-clicks";
import { renderIcon } from "../../lib/icon-utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

interface DocumentViewerProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  animationOrigin?: { x: number; y: number };
  small?: boolean;
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

interface EmbeddingData {
  _id: string;
  documentId: string;
  embedding: number[];
  embeddingModel: string;
  embeddingDimensions: number;
  chunkIndex?: number;
  chunkText?: string;
  createdAt: number;
  processingTimeMs?: number;
  isActive: boolean;
}

export default function DocumentViewer({
  documentId,
  isOpen,
  onClose,
  animationOrigin,
  small = false,
}: DocumentViewerProps): React.ReactElement | null {
  const { openNotifications } = useNotifications();
  const deleteDocument = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete document");
      }
      setDeleting(true);
      toast.success("Document deleted successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete document"
      );
    }
  }, [documentId]);
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [embeddingData, setEmbeddingData] = useState<EmbeddingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmbeddings, setLoadingEmbeddings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const _id = useId();

  const fetchEmbeddings = useCallback(async (docId: string) => {
    setLoadingEmbeddings(true);
    try {
      const response = await fetch(`/api/documents/${docId}/embeddings`);
      if (response.ok) {
        const embeddings = await response.json();
        setEmbeddingData(embeddings);
      }
    } catch (err) {
      console.error("Failed to fetch embeddings:", err);
    } finally {
      setLoadingEmbeddings(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !documentId) {
      setDocumentData(null);
      setEmbeddingData([]);
      setError(null);
      return;
    }

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }
        const data = await response.json();
        setDocumentData(data);

        // Fetch embeddings if document has them
        if (data.hasEmbedding) {
          await fetchEmbeddings(documentId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, isOpen, fetchEmbeddings]);

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

  // Remove the manual embedding generation function since embeddings are now generated automatically

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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  // Calculate animation origin for the modal
  const getAnimationOrigin = () => {
    if (!animationOrigin) return { originX: "50%", originY: "50%" };

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
                transformOrigin: `${originX} ${originY}`,
              }}
              className={`${small ? 'w-full max-w-2xl max-h-[80vh]' : 'w-full max-w-4xl max-h-[90vh]'} flex flex-col bg-gray-900 rounded-lg border ${small ? 'border-gray-700 border-2' : 'border-gray-700'} overflow-hidden`}
              animate={{
                opacity: deleting ? [1, 0.8, 0.4, 0] : 1,
                scale: deleting
                  ? [1, 0.8, 0.6, 0.2]
                  : animationOrigin
                    ? 1
                    : 0.1,
                rotate: deleting ? [0, 360, 720, 1080] : 0,
                transformOrigin: animationOrigin
                  ? `${originX} ${originY}`
                  : undefined,
              }}
              exit={{
                opacity: 0,
                scale: 0.1,
                transformOrigin: `${originX} ${originY}`,
              }}
              transition={{
                type: deleting ? undefined : "spring",
                damping: deleting ? undefined : 25,
                stiffness: deleting ? undefined : 300,
                duration: deleting ? 1.5 : 0.4,
                delay: !deleting && animationOrigin ? 0.35 : 0,
                ease: deleting ? [0.25, 0.46, 0.45, 0.94] : undefined,
                rotate: deleting
                  ? { duration: 1.5, ease: "easeIn" }
                  : undefined,
              }}
              onAnimationComplete={() => {
                if (deleting) {
                  onClose();
                }
              }}
            >
              {/* Header */}
              <div className={`flex justify-between items-center ${small ? 'p-4' : 'p-6'} border-b border-gray-700`}>
                <div className="flex gap-3 items-center">
                  <div className={`${small ? 'p-1.5' : 'p-2'} rounded-lg bg-curious-cyan-900 text-curious-cyan-300`}>
                    {renderIcon(FileText, { className: small ? "w-4 h-4" : "w-5 h-5" })}
                  </div>
                  <div>
                    <h2 className={`${small ? 'text-lg' : 'text-xl'} font-semibold text-white`}>
                      {documentData?.title || "Loading..."}
                    </h2>
                    {documentData && (
                      <div className="flex gap-2 items-center">
                        <p className={`${small ? 'text-xs' : 'text-sm'} text-gray-400`}>
                          {documentData.contentType} •{" "}
                          {formatFileSize(documentData.fileSize)}
                        </p>
                        <div className="flex gap-1 items-center">
                          {documentData.hasEmbedding ? (
                            <>
                              {renderIcon(Zap, {
                                className: small ? "w-3 h-3 text-green-400" : "w-4 h-4 text-green-400",
                              })}
                              <span className={`${small ? 'text-[10px]' : 'text-xs'} text-green-400`}>
                                Embedded
                              </span>
                            </>
                          ) : (
                            <>
                              {renderIcon(ZapOff, {
                                className: small ? "w-3 h-3 text-gray-500" : "w-4 h-4 text-gray-500",
                              })}
                              <span className={`${small ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                                Not Embedded
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={deleteDocument}
                      className={`${small ? 'p-1.5' : 'p-2'} text-red-400 rounded-lg transition-colors hover:text-red-300 hover:bg-gray-700`}
                    >
                      {renderIcon(Trash2, { className: small ? "w-4 h-4" : "w-5 h-5" })}
                    </button>
                    <button
                      onClick={onClose}
                      className={`${small ? 'p-1.5' : 'p-2'} text-gray-400 rounded-lg transition-colors hover:text-white hover:bg-gray-700`}
                    >
                      {renderIcon(X, { className: small ? "w-4 h-4" : "w-5 h-5" })}
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1">
                {loading && (
                  <div className={`flex justify-center items-center ${small ? 'p-4' : 'p-8'}`}>
                    <div className={`${small ? 'w-6 h-6 border-3' : 'w-8 h-8 border-4'} rounded-full border-gray-600 animate-spin border-t-curious-cyan-500`}></div>
                  </div>
                )}

                {error && (
                  <div className={`${small ? 'p-4' : 'p-6'} text-center`}>
                    <p className="text-red-400">Error: {error}</p>
                  </div>
                )}

                {documentData && (
                  <div className={`${small ? 'p-4 space-y-4' : 'p-6 space-y-6'}`}>
                    {/* Document Stats */}
                    <div className={`grid grid-cols-1 ${small ? 'gap-2 md:grid-cols-2' : 'gap-4 md:grid-cols-4'}`}>
                      <div className={`flex gap-2 items-center ${small ? 'p-2' : 'p-3'} bg-gray-800 rounded-lg`}>
                        {renderIcon(Calendar, {
                          className: small ? "w-4 h-4 text-curious-cyan-400" : "w-5 h-5 text-curious-cyan-400",
                        })}
                        <div>
                          <p className={`${small ? 'text-xs' : 'text-sm'} text-gray-400`}>Uploaded</p>
                          <p className={`font-medium ${small ? 'text-sm' : ''} text-white`}>
                            {formatDate(documentData.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className={`flex gap-2 items-center ${small ? 'p-2' : 'p-3'} bg-gray-800 rounded-lg`}>
                        {renderIcon(Hash, {
                          className: small ? "w-4 h-4 text-curious-cyan-400" : "w-5 h-5 text-curious-cyan-400",
                        })}
                        <div>
                          <p className={`${small ? 'text-xs' : 'text-sm'} text-gray-400`}>Word Count</p>
                          <p className={`font-medium ${small ? 'text-sm' : ''} text-white`}>
                            {documentData.wordCount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className={`flex gap-2 items-center ${small ? 'p-2' : 'p-3'} bg-gray-800 rounded-lg`}>
                        {renderIcon(BarChart3, {
                          className: small ? "w-4 h-4 text-curious-cyan-400" : "w-5 h-5 text-curious-cyan-400",
                        })}
                        <div>
                          <p className={`${small ? 'text-xs' : 'text-sm'} text-gray-400`}>File Size</p>
                          <p className={`font-medium ${small ? 'text-sm' : ''} text-white`}>
                            {formatFileSize(documentData.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className={`flex gap-2 items-center ${small ? 'p-2' : 'p-3'} bg-gray-800 rounded-lg`}>
                        {documentData.hasEmbedding
                          ? renderIcon(Zap, {
                              className: small ? "w-4 h-4 text-green-400" : "w-5 h-5 text-green-400",
                            })
                          : renderIcon(ZapOff, {
                              className: small ? "w-4 h-4 text-gray-500" : "w-5 h-5 text-gray-500",
                            })}
                        <div>
                          <p className={`${small ? 'text-xs' : 'text-sm'} text-gray-400`}>Vector Status</p>
                          <p
                            className={`font-medium ${small ? 'text-sm' : ''} ${documentData.hasEmbedding ? "text-green-400" : "text-gray-500"}`}
                          >
                            {documentData.hasEmbedding
                              ? "Embedded"
                              : "Not Embedded"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Embedded Vector Section */}
                    {documentData.hasEmbedding && embeddingData.length > 0 && (
                      <Accordion className="space-y-2">
                        <AccordionItem
                          value="embeddings"
                          className="bg-gray-800 rounded-lg border border-gray-700"
                        >
                          <AccordionTrigger className="flex justify-between items-center p-4 w-full text-left rounded-lg transition-colors hover:bg-gray-750">
                            <div className="flex gap-3 items-center">
                              {renderIcon(Zap, {
                                className: "w-5 h-5 text-green-400",
                              })}
                              <div>
                                <h3 className="text-lg font-semibold text-white">
                                  Embedded Vectors
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {embeddingData.length} embedding
                                  {embeddingData.length !== 1 ? "s" : ""} •{" "}
                                  {embeddingData[0]?.embeddingDimensions || 0}{" "}
                                  dimensions
                                </p>
                              </div>
                            </div>
                            {renderIcon(ChevronDown, {
                              className:
                                "w-5 h-5 text-gray-400 transition-transform group-data-[expanded]:rotate-180",
                            })}
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-4">
                              {loadingEmbeddings ? (
                                <div className="flex justify-center items-center p-4">
                                  <div className="w-6 h-6 rounded-full border-2 border-gray-600 animate-spin border-t-curious-cyan-500"></div>
                                </div>
                              ) : (
                                embeddingData.map((embedding, _index) => (
                                  <div
                                    key={embedding._id}
                                    className="p-4 bg-gray-900 rounded-lg border border-gray-600"
                                  >
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                      <div>
                                        <p className="text-sm text-gray-400">
                                          Model
                                        </p>
                                        <p className="font-medium text-white">
                                          {embedding.embeddingModel}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">
                                          Dimensions
                                        </p>
                                        <p className="font-medium text-white">
                                          {embedding.embeddingDimensions}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">
                                          Created
                                        </p>
                                        <p className="font-medium text-white">
                                          {formatDate(embedding.createdAt)}
                                        </p>
                                      </div>
                                      {embedding.processingTimeMs && (
                                        <div>
                                          <p className="text-sm text-gray-400">
                                            Processing Time
                                          </p>
                                          <p className="font-medium text-white">
                                            {embedding.processingTimeMs}ms
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    {embedding.chunkText && (
                                      <div className="mt-3">
                                        <p className="text-sm text-gray-400">
                                          Chunk Text
                                        </p>
                                        <p className="p-2 mt-1 text-sm text-gray-300 bg-gray-800 rounded border">
                                          {embedding.chunkText.substring(
                                            0,
                                            200
                                          )}
                                          {embedding.chunkText.length > 200
                                            ? "..."
                                            : ""}
                                        </p>
                                      </div>
                                    )}
                                    <div className="mt-3">
                                      <Accordion className="space-y-2">
                                        <AccordionItem
                                          value="vector-preview"
                                          className="bg-gray-700 rounded-lg border border-gray-600"
                                        >
                                          <AccordionTrigger className="flex justify-between items-center p-4 w-full text-left rounded-lg transition-colors hover:bg-gray-650">
                                            <div className="flex gap-3 items-center">
                                              <p className="text-sm text-gray-400">
                                                Vector Preview
                                              </p>
                                              <span className="text-xs text-gray-500">
                                                ({embedding.embedding.length}{" "}
                                                values)
                                              </span>
                                            </div>
                                          </AccordionTrigger>
                                          <AccordionContent className="px-4 pb-4">
                                            <p className="p-2 font-mono text-xs text-gray-500 bg-gray-800 rounded border">
                                              [
                                              {embedding.embedding
                                                .map((v) => v.toFixed(4))
                                                .join(", ")}
                                              ]
                                            </p>
                                          </AccordionContent>
                                        </AccordionItem>
                                      </Accordion>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {/* Summary */}
                    {documentData.summary && (
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-white">
                          Summary
                        </h3>
                        <div className="p-4 bg-gray-800 rounded-lg">
                          <p className="text-gray-300">
                            {documentData.summary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-white">
                        Content
                      </h3>
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
