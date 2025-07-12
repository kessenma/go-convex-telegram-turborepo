"use client";

import React from "react";
import { Hero, TextAnimationType } from "../../components/ui/hero";
import { Card } from "../../components/ui/card";
import { SparklesCore } from "../../components/ui/sparkles";
import { DocumentStats } from "../../components/rag/DocumentStats";
import { DocumentHistory } from "../../components/rag/DocumentHistory";
import ConversionHistory from "../../components/rag/ConversionHistory";
import { VectorEmbedding } from "../../components/rag/VectorEmbedding";
import { VectorSearch } from "../../components/rag/VectorSearch";
import { useAnimationSettings } from "../../hooks/use-animation-settings";
import { useDocumentOperations } from "../../hooks/use-document-operations";
import Cubes from "../../components/ui/backgrounds/mouse-hover-cubes";

export default function RAGDataPage(): React.ReactElement | null {
  const { animationEnabled } = useAnimationSettings();
  
  // Use optimized document operations hook
  const {
    documents,
    stats,
    loadingDocuments,
    loadingStats
  } = useDocumentOperations(10);

  return (
    <div 
      className="pt-20 pb-8 min-h-screen"
      onClick={(e) => {
        const cubesScene = document.querySelector('.cubes-container .grid');
        if (cubesScene) {
          const rect = cubesScene.getBoundingClientRect();
          const event = new MouseEvent('click', {
            clientX: e.clientX,
            clientY: e.clientY,
            bubbles: true
          });
          cubesScene.dispatchEvent(event);
        }
      }}
    >
      <div className="relative min-h-screen">
        <div className="flex overflow-hidden fixed inset-0 justify-center items-center -z-10 cubes-container">
          <Cubes 
            gridSize={10}
            maxAngle={90}
            radius={2}
            duration={{ enter: 0.1, leave: 0.2 }}
            borderStyle="1px solid rgb(30 41 59)"
            faceColor="rgb(2 6 23)"
            rippleColor="rgb(51 65 85)"
            rippleSpeed={2}
            autoAnimate={animationEnabled}
            rippleOnClick={animationEnabled}
          />
        </div>
        <div className="relative px-4 mx-auto max-w-4xl">
          {/* Header */}
          <Hero 
            title="RAG Data Management"
            subtitle="Explore, search, and manage your knowledge base"
            subtitleAccordionContent={`This page provides comprehensive tools for managing your RAG (Retrieval-Augmented Generation) data. You can view document statistics, search through your knowledge base using vector embeddings, generate new embeddings, and browse your document history. The vector search uses AI embeddings to find semantically similar content across all your uploaded documents.`}
            textAlign="left"
            titleAnimation={TextAnimationType.Decrypt}
            subtitleAnimation={TextAnimationType.Shimmer}
            headerColor="text-cyan-200"
            subheaderColor="text-cyan-200"
            accordionColor="text-cyan-300"
          >
            {/* Sparkles Effect */}
            <div className="overflow-hidden relative -mb-40 w-full h-40 rounded-md">
              <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-cyan-200 to-transparent h-[2px] w-3/4 blur-sm" />
              <div className="absolute top-0 inset-x-20 w-3/4 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
              <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent h-[5px] w-1/4 blur-sm" />
              <div className="absolute top-0 inset-x-60 w-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              
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

          {/* Conversion History */}
          <ConversionHistory />
        </div>
      </div>
    </div>
  );
}