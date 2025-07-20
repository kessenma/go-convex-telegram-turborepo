"use client";

import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LightweightLLMStatusIndicator } from "../../components/rag/lightweight-llm-status-indicator";
import { ParticlesBackground } from "../../components/ui/backgrounds/particles-background";
import { Card } from "../../components/ui/card";
import { Hero, TextAnimationType } from "../../components/ui/hero";
import { api } from "../../generated-convex";
import { useAnimationSettings } from "../../hooks/use-animation-settings";
import { renderIcon } from "../../lib/icon-utils";
import { ChatHistory } from "./components/ChatHistory";
import { ChatInterface } from "./components/ChatInterface";
import { DocumentSelector } from "./components/DocumentSelector";
import type { ChatConversation, Document } from "./types";

export default function RAGChatPage(): React.ReactElement {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDocumentObjects, setSelectedDocumentObjects] = useState<
    Document[]
  >([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

  // Get animation settings
  const { animationEnabled } = useAnimationSettings();

  // Fetch documents from Convex
  const documents = useQuery(api.documents.getAllDocuments, { limit: 50 });

  // Update selected document objects when selection changes
  useEffect(() => {
    if (documents?.page && selectedDocuments.length > 0) {
      const docObjects = documents.page.filter((doc: any) =>
        selectedDocuments.includes(doc._id)
      ) as Document[];
      setSelectedDocumentObjects(docObjects);
    } else {
      setSelectedDocumentObjects([]);
    }
  }, [documents, selectedDocuments]);

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleStartChat = () => {
    if (selectedDocuments.length > 0) {
      // Generate a new session ID for the new chat
      setCurrentSessionId(
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      );
      setShowChat(true);
      setShowHistory(false);
    }
  };

  const handleBackToSelection = () => {
    setShowChat(false);
    setShowHistory(false);
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    setShowChat(false);
  };

  const handleSelectConversation = (conversation: ChatConversation) => {
    // Load the conversation's documents
    setSelectedDocuments(conversation.documentIds);
    setCurrentSessionId(conversation.sessionId);
    setShowHistory(false);
    setShowChat(true);
  };

  const handleNewChat = () => {
    setShowHistory(false);
    setShowChat(false);
    setSelectedDocuments([]);
    setCurrentSessionId("");
  };

  if (documents === undefined) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Card className="p-8 text-center border-gray-700 bg-gray-800/50">
          <div className="flex flex-col gap-4 items-center">
            {renderIcon(Loader2, {
              className: "w-8 h-8 animate-spin text-curious-cyan-400",
            })}
            <p className="text-gray-300">Loading your documents...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Ensure documents is an array
  const documentsArray = documents?.page || [];

  return (
    <div className="relative min-h-screen">
      <ParticlesBackground
        className="fixed z-0"
        animationEnabled={animationEnabled}
        meshCount={50}
        selectedCount={selectedDocuments.length}
      />
      <div className="container relative z-10 px-4 py-8 mx-auto mt-12 mb-8">
        <Hero
          title="RAG Chat"
          subtitle="Have intelligent conversations with your documents using AI-powered retrieval"
          titleAnimation={TextAnimationType.TextRoll}
          subtitleAnimation={TextAnimationType.Shimmer}
          animationSpeed={75}
        ></Hero>

        {/* LLM Status Indicator */}
        <div className="mx-auto mr-80 mb-4 ml-80 max-w-6xl">
          <LightweightLLMStatusIndicator
            size="md"
            showLabel={true}
            showLogs={true}
            className="w-full"
          />
        </div>

        <div className="mx-auto max-w-6xl">
          {showHistory ? (
            <Card className="border-gray-700 backdrop-blur-sm bg-gray-800/50">
              <ChatHistory
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
                onBackToSelection={handleBackToSelection}
                currentSessionId={currentSessionId}
              />
            </Card>
          ) : showChat ? (
            <Card className="border-gray-700 backdrop-blur-sm bg-gray-800/50">
              <ChatInterface
                selectedDocuments={selectedDocumentObjects}
                onBackToSelection={handleBackToSelection}
                sessionId={currentSessionId}
                onShowHistory={handleShowHistory}
              />
            </Card>
          ) : (
            <div className="border-gray-700">
              <div className="p-6 mr-64 ml-64">
                <DocumentSelector
                  documents={documentsArray as Document[]}
                  selectedDocuments={selectedDocuments}
                  onDocumentToggle={handleDocumentToggle}
                  onStartChat={handleStartChat}
                  onShowHistory={handleShowHistory}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
