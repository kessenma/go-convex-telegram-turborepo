"use client";

import { useQuery } from "convex/react";
import { MessageCircle, Clock, FileText, Trash2 } from "lucide-react";
import type React from "react";
import { memo, useCallback, useState } from "react";
import { api } from "../../generated-convex";
import { renderIcon } from "../../lib/icon-utils";
import { useRagChatStore } from "../../stores/ragChatStore";
import { useDocumentStore } from "../../stores/document-store";
import { BackgroundGradient } from "../ui/backgrounds/background-gradient";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tool-tip";
import type { GenericId as Id } from "convex/values";
import DocumentCard from "./DocumentCard";
import DocumentViewer from "./DocumentViewer";
import type { UploadedDocument } from "../../stores/document-store";

interface DocumentBrowserProps {
  documents?: UploadedDocument[];
  loading?: boolean;
}

const DocumentBrowser = memo(function DocumentBrowser({
  documents = [],
  loading = false,
}: DocumentBrowserProps): React.ReactElement | null {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"rag_documents"> | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [animationOrigin, setAnimationOrigin] = useState<{ x: number; y: number } | undefined>();
  const [expandingDocument, setExpandingDocument] = useState<{ docId: string; paperIndex: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'chat'>('documents');
  
  // Get state and actions from stores
  const { selectConversation, setSelectedDocuments } = useRagChatStore();
  const { deletingIds, deleteDocument } = useDocumentStore();
  
  // Fetch recent conversations for chat history
  const recentConversations = useQuery(api.ragChat.getRecentConversations, { limit: 20 });
  
  // Fetch messages for selected conversation
  const conversationMessages = useQuery(
    api.ragChat.getConversationMessages,
    selectedConversationId ? { conversationId: selectedConversationId as Id<"rag_conversations"> } : "skip"
  );
  
  const handleConversationClick = useCallback((conversation: any) => {
    // Set the selected documents from the conversation
    setSelectedDocuments(conversation.documentIds);
    
    // Navigate to chat with this conversation
    selectConversation(conversation);
  }, [setSelectedDocuments, selectConversation]);

  const handlePaperClick = useCallback(
    (documentId: string, paperIndex: number, event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      setAnimationOrigin({ x: centerX, y: centerY });
      setExpandingDocument({ docId: documentId, paperIndex });
      
      // Delay opening the viewer to allow for animation
      setTimeout(() => {
        setSelectedDocumentId(documentId as unknown as Id<"rag_documents">);
        setIsDocumentViewerOpen(true);
        setExpandingDocument(null);
      }, 300);
    },
    []
  );

  const handleFolderClick = useCallback(
    (documentId: string, event?: React.MouseEvent) => {
      if (event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setAnimationOrigin({ x: centerX, y: centerY });
      }
      
      setSelectedDocumentId(documentId as unknown as Id<"rag_documents">);
      setIsDocumentViewerOpen(true);
    },
    []
  );

  const handleCloseViewer = useCallback(() => {
    setIsDocumentViewerOpen(false);
    setSelectedDocumentId(null);
    setAnimationOrigin(undefined);
  }, []);

  const handleDeleteDocument = useCallback(
    (documentId: string) => {
      deleteDocument(documentId);
    },
    [deleteDocument]
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state for documents
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex border-b border-slate-600/30">
          <button className="px-4 py-2 text-cyan-300 border-b-2 border-cyan-300">
            Documents
          </button>
          <button className="px-4 py-2 text-gray-400">
            Chat History
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-3 animate-pulse">
              <div className="w-24 h-20 bg-gray-600 rounded-lg"></div>
              <div className="w-16 h-3 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-600/30">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 transition-colors ${
            activeTab === 'documents'
              ? 'text-cyan-300 border-b-2 border-cyan-300'
              : 'text-gray-400 hover:text-cyan-300'
          }`}
        >
          Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 transition-colors ${
            activeTab === 'chat'
              ? 'text-cyan-300 border-b-2 border-cyan-300'
              : 'text-gray-400 hover:text-cyan-300'
          }`}
        >
          Chat History ({recentConversations?.length || 0})
        </button>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Document Library</h2>
          
          {!documents || documents.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-gray-600 bg-slate-950/50">
              <div className="mb-4">
                {renderIcon(FileText, {
                  className: "mx-auto w-12 h-12 text-gray-500",
                })}
              </div>
              <p className="text-gray-400">No documents uploaded yet.</p>
              <p className="text-sm text-gray-500">
                Upload your first document to see it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {documents.map((document) => (
                <DocumentCard
                  key={document._id}
                  document={document}
                  isDeleting={deletingIds.has(document._id)}
                  expandingDocument={expandingDocument}
                  onPaperClick={handlePaperClick}
                  onFolderClick={handleFolderClick}
                  onDelete={handleDeleteDocument}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat History Tab */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Chat History</h2>
          
          {recentConversations === undefined ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border animate-pulse bg-slate-800/40 border-slate-600/30">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 bg-gray-600 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="mb-2 w-3/4 h-4 bg-gray-600 rounded"></div>
                      <div className="w-1/2 h-3 bg-gray-600 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !recentConversations || recentConversations.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-gray-600 bg-slate-950/50">
              <div className="mb-4">
                {renderIcon(MessageCircle, {
                  className: "mx-auto w-12 h-12 text-gray-500",
                })}
              </div>
              <p className="text-gray-400">No chat conversations yet.</p>
              <p className="text-sm text-gray-500">
                Start a conversation with your documents to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentConversations.map((conversation: any) => (
                <BackgroundGradient
                  key={conversation._id}
                  className="rounded-xl p-[1px] bg-slate-800/40 hover:bg-slate-700/50 transition-all duration-200 cursor-pointer"
                  containerClassName="rounded-xl"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="p-4 rounded-xl border bg-slate-900/80 border-slate-600/30">
                    <div className="flex gap-3 items-start">
                      <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 bg-gradient-to-br rounded-xl border from-cyan-400/20 to-purple-500/20 border-slate-600/40">
                        {renderIcon(MessageCircle, { className: "w-5 h-5 text-cyan-300" })}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium text-cyan-200 truncate">
                            {conversation.title || `Conversation ${conversation._id.slice(-6)}`}
                          </h3>
                          
                          <div className="flex gap-2 items-center text-xs text-cyan-300/70">
                            {renderIcon(Clock, { className: "w-3 h-3" })}
                            <span>{formatDate(conversation._creationTime)}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 items-center mb-2 text-sm text-cyan-200/70">
                          <span>{conversation.messageCount || 0} messages</span>
                          <span>•</span>
                          <span>{conversation.documentTitles?.length || 0} documents</span>
                        </div>
                        
                        {conversation.documentTitles && conversation.documentTitles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {conversation.documentTitles.slice(0, 3).map((title: string, index: number) => (
                              <span 
                                key={index}
                                className="inline-flex gap-1 items-center px-2 py-1 text-xs text-cyan-300 rounded-md border bg-slate-700/60 border-slate-600/40"
                              >
                                {renderIcon(FileText, { className: "w-3 h-3" })}
                                {title.length > 20 ? `${title.slice(0, 20)}...` : title}
                              </span>
                            ))}
                            {conversation.documentTitles.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 text-xs rounded-md border bg-slate-700/60 text-cyan-300/70 border-slate-600/40">
                                +{conversation.documentTitles.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </BackgroundGradient>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document Viewer */}
      {selectedDocumentId && (
        <DocumentViewer
          documentId={selectedDocumentId}
          isOpen={isDocumentViewerOpen}
          onClose={handleCloseViewer}
          animationOrigin={animationOrigin}
        />
      )}
    </div>
  );
});

export { DocumentBrowser };