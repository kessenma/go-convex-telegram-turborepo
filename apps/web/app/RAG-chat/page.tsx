"use client";

import React, { useState } from "react";
import { Hero, TextAnimationType } from "../components/ui/hero";
import { Card } from "../components/ui/card";
import { ParticlesBackground } from "../components/ui/backgrounds/particles-background";
import { DocumentSelector } from "./components/DocumentSelector";
import { ChatInterface } from "./components/ChatInterface";
import { Document } from "./types";
import { useAnimationSettings } from "../hooks/use-animation-settings";

export default function RAGChatPage(): React.ReactElement | null {
  // TODO: Replace with HTTP API call
  const documents = { page: [] };
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(false);
  const { animationEnabled } = useAnimationSettings();

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

  const getSelectedDocumentObjects = (): Document[] => {
    if (!documents?.page) return [];
    return documents.page.filter((doc: Document) => selectedDocuments.includes(doc._id));
  };

  // TODO: Add loading state when implementing HTTP API calls

  return (
    <div className="min-h-screen text-white bg-slate-950">
      <div className="overflow-hidden relative w-full min-h-screen">
        <div className="absolute inset-0">
          <ParticlesBackground
            className="w-full h-full"
            animationEnabled={animationEnabled}
            meshCount={animationEnabled ? 300 : 0}
            selectedCount={selectedDocuments.length}
          />
        </div>
        
        <div className="relative z-10">
          <Hero
            title="RAG Chat"
            subtitle="Chat with your documents using AI-powered retrieval"
            whiteText={true}
            className="pt-16 pb-8"
            titleAnimation={TextAnimationType.TrueFocus}
            glitchSpeed={0.3}
          />
          
          <div className="px-4 pb-20">
            <div className="mx-auto max-w-4xl">
              {!showChat ? (
                 <DocumentSelector
                   documents={documents?.page || []}
                   selectedDocuments={selectedDocuments}
                   onDocumentToggle={handleDocumentToggle}
                   onStartChat={handleStartChat}
                 />
              ) : (
                <Card className="border-gray-700 bg-gray-800/50">
                  <ChatInterface
                    selectedDocuments={getSelectedDocumentObjects()}
                    onBackToSelection={handleBackToSelection}
                  />
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}