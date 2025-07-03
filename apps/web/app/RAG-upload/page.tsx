"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, Type, BarChart3, Calendar, FileIcon, Hash, CheckCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Hero } from "../components/ui/hero";
import { Card } from "../components/ui/card";
import { BackgroundGradient } from "../components/ui/background-gradient";
import { SparklesCore } from "../components/ui/sparkles";
import { UploadForm } from "./components/UploadForm";
import { DocumentStats } from "./components/DocumentStats";
import { RecentDocuments } from "./components/RecentDocuments";
import { ThreeJSUploadIcon } from "./components/ThreeJSUploadIcon";

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
  const [uploadMethod, setUploadMethod] = useState<'file' | 'text'>('file');
  const [textContent, setTextContent] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  // Query documents for the recent uploads section
  const documentsQuery = useQuery(api.documents.getAllDocuments, { limit: 5 });
  const statsQuery = useQuery(api.documents.getDocumentStats, {});

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

      const response = await fetch('/api/RAG/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: documentTitle,
          content,
          contentType,
          summary: summary || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setUploadMessage(`Document "${documentTitle}" uploaded successfully!`);
        setTitle('');
        setSummary('');
        setTextContent('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

      } else {
        setUploadStatus('error');
        setUploadMessage(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Network error. Please try again.');
    } finally {
      setIsUploading(false);
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
      const response = await fetch('/api/RAG/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: textContent,
          contentType: 'text',
          summary: summary || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setUploadMessage(`Document "${title}" uploaded successfully!`);
        setTitle('');
        setSummary('');
        setTextContent('');

      } else {
        setUploadStatus('error');
        setUploadMessage(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Network error. Please try again.');
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
          title="Retrieval-Augmented Generation"
          subtitle="Upload your knowledge base for AI-powered search and retrieval"
          whiteText={true}
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
          />
          
          <div className="absolute inset-0 w-full h-full bg-slate-950 [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
        </div>
        </Hero>

        {/* Three.js Upload Animation */}
        <div className="flex relative z-10 justify-center -mt-20 mb-12">
          <ThreeJSUploadIcon 
            className="mx-auto"
          />
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
              handleTextUpload={handleTextUpload}
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
              handleTextUpload={handleTextUpload}
            />
          </Card>
        )}

        {/* Stats Cards */}
        <DocumentStats statsQuery={statsQuery} />

        {/* Recent Documents */}
        <RecentDocuments documentsQuery={documentsQuery} />
      </div>
    </div>
  );
}