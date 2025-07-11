"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { renderIcon } from "../../lib/icon-utils";
import { useAnimationSettings } from "../../hooks/use-animation-settings";
import { Hero, TextAnimationType } from "../../components/ui/hero";
import { Card } from "../../components/ui/card";
import { BackgroundGradient } from "../../components/ui/backgrounds/background-gradient";
import { SparklesCore } from "../../components/ui/sparkles";
import { UploadForm } from "../../components/rag/UploadForm";
import { DocumentStats } from "../../components/rag/DocumentStats";
import { DocumentHistory } from "../../components/rag/DocumentHistory";
import { ThreeJSUploadIcon } from "../../components/rag/ThreeJSUploadIcon";
import { LLMUsageBarChart } from "../../components/rag/llm-usage-bar-chart";

import { ConvexStatusIndicator } from "../../components/convex/convex-status-indicator";
import { useStatusOperations } from "../../hooks/use-status-operations";
import { LLMStatusIndicator } from "../../components/rag/llm-status-indicator";
import { DockerStatusIndicator } from "../../components/docker-status";

interface Document {
  _id: string;
  title: string;
  content: string;
  contentType: 'markdown' | 'text';
  fileSize: number;
  uploadDate: number;
  wordCount: number;
  tags?: string[];
  summary?: string;
}

interface UploadedDocument {
  _id: string;
  title: string;
  contentType: string;
  fileSize: number;
  wordCount: number;
  uploadedAt: number;
  summary?: string;
}

export default function RAGUploadPage(): React.ReactElement | null {
  const { animationEnabled } = useAnimationSettings();
  const statusOperations = useStatusOperations();
  const convexStatus = statusOperations.convexStatus;
  const llmStatus = statusOperations.llmStatus;
  const dockerStatus = statusOperations.dockerStatus;
  const [uploadMethod, setUploadMethod] = useState<'file' | 'text'>('file');
  const [textContent, setTextContent] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingMessage, setEmbeddingMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Use Convex hooks for real-time data
  const documentsQuery = useQuery(api.documents.getAllDocuments, { limit: 5 });
  const stats = useQuery(api.documents.getDocumentStats);
  const saveDocument = useMutation(api.documents.saveDocument);
  
  const documents = documentsQuery?.page || [];
  const loadingDocuments = documentsQuery === undefined;
  const loadingStats = stats === undefined;

  // Data is now loaded automatically via Convex hooks

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      setUploadStatus('error');
      setUploadMessage('Please upload only .md or .txt files');
      return;
    }

    if (file.size > 1024 * 1024) { // 1MB limit
      setUploadStatus('error');
      setUploadMessage('File size must be less than 1MB');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const content = await file.text();
      const contentType = file.name.endsWith('.md') ? 'markdown' : 'text';
      const documentTitle = title || file.name.replace(/\.[^/.]+$/, '');

      await saveDocument({
        title: documentTitle,
        content,
        contentType,
        summary: summary || undefined,
      });

      setUploadStatus('success');
      setUploadMessage(`Document "${documentTitle}" uploaded successfully!`);
      setTitle('');
      setSummary('');
      setTextContent('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBatchFileUpload = async (files: File[]) => {
    // Validate all files first
    for (const file of files) {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
        setUploadStatus('error');
        setUploadMessage(`File "${file.name}" is not a .md or .txt file`);
        return;
      }

      if (file.size > 1024 * 1024) { // 1MB limit
        setUploadStatus('error');
        setUploadMessage(`File "${file.name}" is too large (max 1MB)`);
        return;
      }
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      // Prepare documents array
      const documents = [];
      
      for (const file of files) {
        const content = await file.text();
        const contentType = file.name.endsWith('.md') ? 'markdown' : 'text';
        const documentTitle = file.name.replace(/\.[^/.]+$/, '');
        
        documents.push({
          title: documentTitle,
          content,
          contentType,
          summary: summary || undefined,
        });
      }

      // Send batch upload request
      const response = await fetch('/api/RAG/batch-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents }),
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setUploadMessage(`Batch upload completed: ${result.successful} successful, ${result.failed} failed out of ${result.processed} files`);
        setTitle('');
        setSummary('');
        setTextContent('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadStatus('error');
        setUploadMessage(result.error || 'Batch upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Batch upload failed. Please try again.');
      console.error('Batch upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    setEmbeddingMessage('');

    try {
      const response = await fetch('/api/batch-generate-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setEmbeddingMessage(`Successfully processed ${result.processed || 0} documents. ${result.successful || 0} successful, ${result.errors || 0} errors.`);
      } else {
        setEmbeddingMessage(result.error || 'Failed to generate embeddings');
      }
    } catch (error) {
      setEmbeddingMessage('Network error. Please try again.');
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  const handleTextUpload = async () => {
    if (!textContent.trim()) {
      setUploadStatus('error');
      setUploadMessage('Please enter some text content');
      return;
    }

    if (!title.trim()) {
      setUploadStatus('error');
      setUploadMessage('Please enter a title for your document');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      await saveDocument({
        title,
        content: textContent,
        contentType: 'text',
        summary: summary || undefined,
      });

      setUploadStatus('success');
      setUploadMessage(`Document "${title}" uploaded successfully!`);
      setTitle('');
      setSummary('');
      setTextContent('');
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="pt-20 pb-8 min-h-screen">
      <div className="px-4 mx-auto max-w-4xl">
        {/* Header */}
        <Hero 
          title="Upload Documents"
          subtitle="Upload your knowledge base for AI-powered search and retrieval"
          subtitleAccordionContent={`RAG (Retrieval-Augmented Generation) is a search technique that enhances AI responses by incorporating uploaded information from your documents in combination with an external LLM (large language model). The uploaded documents are stored in a vector database (more efficient than searching through plain text or traditional databases like SQL/NoSQL). **Convex is different than other databases because it combines SQL structure with vector search.**`

          } 
          textAlign="left"
        >
           {/* Sparkles Effect */}
        <div className="overflow-hidden relative -mb-40 w-full h-40 rounded-md">
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-cyan-200 to-transparent h-[2px] w-3/4 blur-sm" />
          <div className="absolute top-0 inset-x-20 w-3/4 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent h-[5px] w-1/4 blur-sm" />
          <div className="absolute top-0 inset-x-60 w-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          
          <SparklesCore
            id="tsparticles"
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={1200}
            className="z-20 w-full h-full"
            particleColor="#FFFFFF"
            animationEnabled={animationEnabled}
          />
          
          <div className="absolute inset-0 w-full h-full bg-slate-950 [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
        </div>
        </Hero>

        {/* Three.js Upload Animation */}
        <div className="flex relative z-10 justify-center -mt-20 mb-12">
          <ThreeJSUploadIcon 
            className="mx-auto"
            animationEnabled={animationEnabled}
          />
        </div>

        {/* Convex Database Status Indicator */}
        <div className="mb-6">
          <ConvexStatusIndicator
            status={convexStatus.status}
            ready={convexStatus.ready}
            message={convexStatus.message}
            uptime={convexStatus.uptime}
            statistics={convexStatus.statistics}
            performance={convexStatus.performance}
            details={convexStatus.details}
            className="mx-auto max-w-md"
            showLogs={true}
          />
        </div>
        {/* LLM Status Indicator */}
        <div className="mb-6">
          <LLMStatusIndicator
            size="sm"
            showLogs={true}
            className="bg-gray-50 dark:bg-gray-800/30"
          />
          <div className="mt-4">
            <LLMUsageBarChart />
          </div>
        </div>



        {/* Upload Form */}
        {isUploading ? (
          <BackgroundGradient className="mb-6">
            <UploadForm
              uploadMethod={uploadMethod}
              setUploadMethod={setUploadMethod}
              title={title}
              setTitle={setTitle}
              summary={summary}
              setSummary={setSummary}
              textContent={textContent}
              setTextContent={setTextContent}
              isUploading={isUploading}
              uploadStatus={uploadStatus}
              uploadMessage={uploadMessage}
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              handleFileUpload={handleFileUpload}
              handleBatchFileUpload={handleBatchFileUpload}
              handleTextUpload={handleTextUpload}
              isGeneratingEmbeddings={isGeneratingEmbeddings}
              handleGenerateEmbeddings={handleGenerateEmbeddings}
              embeddingMessage={embeddingMessage}
            />
          </BackgroundGradient>
        ) : (
          <Card className="mb-6 border-gray-700 bg-gray-800/50">
            <UploadForm
              uploadMethod={uploadMethod}
              setUploadMethod={setUploadMethod}
              title={title}
              setTitle={setTitle}
              summary={summary}
              setSummary={setSummary}
              textContent={textContent}
              setTextContent={setTextContent}
              isUploading={isUploading}
              uploadStatus={uploadStatus}
              uploadMessage={uploadMessage}
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              handleFileUpload={handleFileUpload}
              handleBatchFileUpload={handleBatchFileUpload}
              handleTextUpload={handleTextUpload}
              isGeneratingEmbeddings={isGeneratingEmbeddings}
              handleGenerateEmbeddings={handleGenerateEmbeddings}
              embeddingMessage={embeddingMessage}
            />
          </Card>
        )}

        {/* Stats Cards */}
        <DocumentStats stats={stats} loading={loadingStats} />



        {/* Document History */}
        <DocumentHistory documents={documents} loading={loadingDocuments} />
      </div>
    </div>
  );
}
