"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../generated-convex";
import { type GenericId as Id } from "convex/values";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "../ui/responsive-modal";
import {
  X,
  FileText,
  Calendar,
  Hash,
  HardDrive,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
// Simple date formatting helper
const formatDistanceToNow = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
};
import { toast } from "sonner";

interface DocumentViewerProps {
  documentId: Id<"rag_documents"> | null;
  isOpen: boolean;
  onClose: () => void;
  small?: boolean;
}

export function DocumentViewer({
  documentId,
  isOpen,
  onClose,
  small = false,
}: DocumentViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [retryingEmbedding, setRetryingEmbedding] = useState(false);
  const [loadingEmbeddings, setLoadingEmbeddings] = useState(false);

  const documentData = useQuery(
    api.documents.getDocumentById,
    documentId ? { documentId } : "skip"
  );

  const embeddings = useQuery(
    api.embeddings.getDocumentEmbeddings,
    documentId ? { documentId } : "skip"
  );

  const deleteDocument = useMutation(api.documents.deleteDocument);
  const retryEmbedding = useMutation(api.embeddings.createDocumentEmbedding);

  useEffect(() => {
    if (documentData) {
      setError(null);
    }
  }, [documentData]);

  const handleDelete = async () => {
    if (!documentId) return;

    try {
      setDeleting(true);
      await deleteDocument({ documentId });
      toast.success("Document deleted successfully");
      onClose();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  const handleRetryEmbedding = async () => {
    if (!documentId || !documentData) return;

    try {
      setRetryingEmbedding(true);
      await retryEmbedding({ 
        documentId,
        embedding: [], // This would normally be generated
        embeddingModel: "default",
        embeddingDimensions: 384
      });
      toast.success("Embedding generation started");
    } catch (error) {
      console.error("Error retrying embedding:", error);
      toast.error("Failed to start embedding generation");
    } finally {
      setRetryingEmbedding(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getVectorStatus = () => {
    if (!embeddings) return { status: "loading", color: "gray" };
    if (embeddings.length === 0) return { status: "none", color: "red" };
    return { status: "embedded", color: "green" };
  };

  const renderIcon = (Icon: any, props: any) => {
    return <Icon {...props} />;
  };

  const vectorStatus = getVectorStatus();

  if (!documentData && !loading) {
    return (
      <ResponsiveModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <ResponsiveModalContent 
          side={small ? "bottom" : "right"}
          className={`${small ? 'max-w-2xl' : 'w-full max-w-4xl'} bg-gray-900 border-gray-700 text-white`}
        >
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="sr-only">
              Document Viewer
            </ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <div className="flex flex-col h-full max-h-[80vh]">
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-400">Document not found</p>
            </div>
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>
    );
  }

  return (
    <ResponsiveModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveModalContent 
        side={small ? "bottom" : "right"}
        className={`${small ? 'max-w-2xl' : 'w-full max-w-4xl'} bg-gray-900 border-gray-700 text-white`}
      >
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="sr-only">
            Document Viewer
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <div className="flex flex-col h-full max-h-[80vh]">
          {/* Header */}
          <div className={`flex justify-between items-center ${small ? 'p-4' : 'p-6'} border-b border-gray-700`}>
            <div className="flex items-center space-x-3">
              {renderIcon(FileText, { className: "w-6 h-6 text-blue-400" })}
              <h2 className="text-xl font-semibold text-white truncate">
                {documentData?.title || "Loading..."}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 overflow-y-auto ${small ? 'p-4' : 'p-6'} space-y-6`}>
            {/* Document Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                {renderIcon(Calendar, { className: "w-4 h-4" })}
                <span>
                  Uploaded{" "}
                  {documentData?._creationTime
                    ? formatDistanceToNow(new Date(documentData._creationTime))
                    : "Unknown"}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                {renderIcon(Hash, { className: "w-4 h-4" })}
                <span>
                  {documentData?.wordCount || 0} words
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                {renderIcon(HardDrive, { className: "w-4 h-4" })}
                <span>
                  {documentData?.fileSize ? formatFileSize(documentData.fileSize) : "Unknown size"}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                {vectorStatus.status === "embedded" && (
                  <>
                    {renderIcon(CheckCircle, { className: "w-4 h-4 text-green-400" })}
                    <span className="text-green-400">Vector Embedded</span>
                  </>
                )}
                {vectorStatus.status === "none" && (
                  <>
                    {renderIcon(XCircle, { className: "w-4 h-4 text-red-400" })}
                    <span className="text-red-400">No Embeddings</span>
                  </>
                )}
                {vectorStatus.status === "loading" && (
                  <>
                    {renderIcon(Loader2, { className: "w-4 h-4 text-yellow-400 animate-spin" })}
                    <span className="text-yellow-400">Loading...</span>
                  </>
                )}
              </div>
            </div>

            {/* Embedded Vector Section */}
            <Card backgroundColor="#1f2937" borderColor="#374151">
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-white">
                  <span>Embedded Vector Section</span>
                  {vectorStatus.status === "none" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRetryEmbedding}
                      disabled={retryingEmbedding}
                      className="text-blue-400 border-blue-600 hover:bg-blue-900/20"
                    >
                      {retryingEmbedding ? (
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 w-4 h-4" />
                      )}
                      Retry Embedding
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {embeddings && embeddings.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {embeddings.map((embedding, index) => (
                      <AccordionItem key={embedding._id} value={`item-${index}`}>
                        <AccordionTrigger className="text-white hover:text-gray-300">
                          <div className="flex justify-between items-center mr-4 w-full">
                            <span>Chunk {index + 1}</span>
                            <span className="px-2 py-1 text-xs text-blue-200 bg-blue-900 rounded">
                              {embedding.chunkText?.length || 0} chars
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-400">
                              <strong>Content:</strong>
                            </div>
                            <div className="overflow-y-auto p-3 max-h-40 text-sm text-gray-300 bg-gray-900 rounded">
                              {embedding.chunkText}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="py-8 text-center">
                    <AlertCircle className="mx-auto mb-4 w-12 h-12 text-yellow-400" />
                    <p className="mb-4 text-gray-400">
                      This document hasn't been embedded yet.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={handleRetryEmbedding}
                      disabled={retryingEmbedding}
                      className="text-blue-400 border-blue-600 hover:bg-blue-900/20"
                    >
                      {retryingEmbedding ? (
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 w-4 h-4" />
                      )}
                      Generate Embeddings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document Summary */}
            {documentData?.summary && (
              <Card backgroundColor="#1f2937" borderColor="#374151">
                <CardHeader>
                  <CardTitle className="text-white">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-gray-300">
                    {documentData.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Document Content */}
            <Card backgroundColor="#1f2937" borderColor="#374151">
              <CardHeader>
                <CardTitle className="text-white">Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-y-auto p-4 max-h-96 bg-gray-900 rounded">
                  <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                    {documentData?.content || "Loading content..."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}

export default DocumentViewer;