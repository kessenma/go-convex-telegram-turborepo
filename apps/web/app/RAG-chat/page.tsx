"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DocumentSelector } from "./components/DocumentSelector";
import { ChatInterface } from "./components/ChatInterface";
import { Document } from "./types";
import { Card } from "../../components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
import { renderIcon } from "../../lib/icon-utils";
import { ParticlesBackground } from "../../components/ui/backgrounds/particles-background";

export default function RAGChatPage() {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [selectedDocumentObjects, setSelectedDocumentObjects] = useState<Document[]>([]);

  // Fetch documents from Convex
  const documents = useQuery(api.documents.getAllDocuments);

  // Update selected document objects when selection changes
  useEffect(() => {
    if (documents && selectedDocuments.length > 0) {
      const docObjects = documents.filter((doc: any) => 
        selectedDocuments.includes(doc._id)
      ) as Document[];
      setSelectedDocumentObjects(docObjects);
    } else {
      setSelectedDocumentObjects([]);
    }
  }, [documents, selectedDocuments]);

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleStartChat = () => {
    if (selectedDocuments.length > 0) {
      setShowChat(true);
    }
  };

  const handleBackToSelection = () => {
    setShowChat(false);
  };

  if (documents === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center border-gray-700 bg-gray-800/50">
          <div className="flex flex-col gap-4 items-center">
            {renderIcon(Loader2, { className: "w-8 h-8 animate-spin text-curious-cyan-400" })}
            <p className="text-gray-300">Loading your documents...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Ensure documents is an array
  const documentsArray = Array.isArray(documents) ? documents : [];

  return (
    <div className="relative min-h-screen">
      <ParticlesBackground 
        className="z-0" 
        animationEnabled={true}
        meshCount={50}
        selectedCount={selectedDocuments.length}
      />
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="flex gap-3 justify-center items-center mb-4">
            {renderIcon(MessageSquare, { className: "w-8 h-8 text-curious-cyan-400" })}
            <h1 className="text-3xl font-bold text-white">RAG Chat</h1>
          </div>
          <p className="text-gray-300">
            Have intelligent conversations with your documents using AI-powered retrieval
          </p>
        </div>

        <Card className="mx-auto max-w-6xl border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          {!showChat ? (
            <div className="p-6">
              <DocumentSelector
                documents={documentsArray as Document[]}
                selectedDocuments={selectedDocuments}
                onDocumentToggle={handleDocumentToggle}
                onStartChat={handleStartChat}
              />
            </div>
          ) : (
            <ChatInterface
              selectedDocuments={selectedDocumentObjects}
              onBackToSelection={handleBackToSelection}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
