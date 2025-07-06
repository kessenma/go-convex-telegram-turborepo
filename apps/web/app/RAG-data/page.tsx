"use client";

import React from "react";
import { Hero, TextAnimationType } from "../components/ui/hero";
import { Card } from "../components/ui/card";
import { SparklesCore } from "../components/ui/sparkles";
import { DocumentStats } from "./components/DocumentStats";
import { DocumentHistory } from "../RAG-data/components/DocumentHistory";
import { VectorEmbedding } from "../RAG-data/components/VectorEmbedding";
import { VectorSearch } from "../RAG-data/components/VectorSearch";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAnimationSettings } from "../hooks/use-animation-settings";

export default function RAGDataPage(): React.ReactElement | null {
  const { animationEnabled } = useAnimationSettings();
  
  // Use Convex hooks for real-time data
  const documentsQuery = useQuery(api.documents.getAllDocuments, { limit: 10 });
  const stats = useQuery(api.documents.getDocumentStats);
  
  const documents = documentsQuery?.page || [];
  const loadingDocuments = documentsQuery === undefined;
  const loadingStats = stats === undefined;

  return (
    <div className="pt-20 pb-8 min-h-screen">
      <div className="px-4 mx-auto max-w-4xl">
        {/* Header */}
        <Hero 
          title="RAG Data Management"
          subtitle="Explore, search, and manage your knowledge base"
          subtitleAccordionContent={`This page provides comprehensive tools for managing your RAG (Retrieval-Augmented Generation) data. You can view document statistics, search through your knowledge base using vector embeddings, generate new embeddings, and browse your document history. The vector search uses AI embeddings to find semantically similar content across all your uploaded documents.`}
          textAlign="left"
          titleAnimation={TextAnimationType.Gradient}
        >
          {/* Sparkles Effect */}
          <div className="overflow-hidden relative -mb-40 w-full h-40 rounded-md">
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-purple-200 to-transparent h-[2px] w-3/4 blur-sm" />
            <div className="absolute top-0 inset-x-20 w-3/4 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent h-[5px] w-1/4 blur-sm" />
            <div className="absolute top-0 inset-x-60 w-1/4 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
            
            <SparklesCore
              id="tsparticles-data"
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={1200}
              className="z-20 w-full h-full"
              particleColor="#A855F7"
              animationEnabled={animationEnabled}
            />
            
            <div className="absolute inset-0 w-full h-full bg-slate-950 [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
          </div>
        </Hero>

        {/* Stats Cards */}
        <DocumentStats stats={stats} loading={loadingStats} />

        {/* Vector Search */}
        <VectorSearch className="mb-6" hasDocuments={stats?.totalDocuments > 0} />

        {/* Vector Embeddings Section */}
        <VectorEmbedding
          hasDocuments={stats?.totalDocuments > 0}
        />

        {/* Document History */}
        <DocumentHistory documents={documents} loading={loadingDocuments} />
      </div>
    </div>
  );
}