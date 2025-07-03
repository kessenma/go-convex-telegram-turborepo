"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Hero } from "../components/ui/hero";
import { Card } from "../components/ui/card";
import { SparklesCore } from "../components/ui/sparkles";
import { DocumentSelector } from "./components/DocumentSelector";
import { ChatInterface } from "./components/ChatInterface";
import { Document } from "./types";
import { useAnimationSettings } from "../hooks/use-animation-settings";

export default function RAGChatPage(): React.ReactElement | null {
  const documents = useQuery(api.documents.getAllDocuments);
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

  if (documents === undefined) {
    return (
      <div className="min-h-screen text-white bg-black">
        <div className="overflow-hidden relative w-full h-screen">
          <div className="absolute inset-0">
            <SparklesCore
              id="tsparticlesfullpage"
              background="transparent"
              minSize={0.6}
              maxSize={1.4}
              particleDensity={100}
              className="w-full h-full"
              particleColor="#0ea5e9"
              animationEnabled={animationEnabled}
            />
          </div>
          <div className="flex relative z-10 flex-col justify-center items-center h-full">
            <div className="text-center">
              <h1 className="mb-4 text-4xl font-bold">Loading Documents...</h1>
              <div className="mx-auto w-8 h-8 rounded-full border-4 animate-spin border-curious-cyan-500 border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-slate-950">
      <div className="overflow-hidden relative w-full min-h-screen">
        <div className="absolute inset-0">
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={100}
            className="w-full h-full"
            particleColor="#0ea5e9"
            animationEnabled={animationEnabled}
          />
        </div>
        
        <div className="relative z-10">
          <Hero
            title="RAG Chat Interface"
            subtitle="Chat with your documents using AI-powered retrieval"
            whiteText={true}
            className="pt-16 pb-8"
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