"use client";

import React, { RefObject, useCallback } from "react";
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Type, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { renderIcon } from "../../lib/icon-utils";
import { Button as MovingButton } from "../ui/moving-border";
import { StickyBanner } from "../ui/sticky-banner";
import { Tabs } from "../ui/tabs";
import { toast } from "sonner";

interface UploadFormProps {
  uploadMethod: 'file' | 'text';
  setUploadMethod: (method: 'file' | 'text') => void;
  title: string;
  setTitle: (title: string) => void;
  summary: string;
  setSummary: (summary: string) => void;
  textContent: string;
  setTextContent: (content: string) => void;
  isUploading: boolean;
  uploadStatus: 'idle' | 'success' | 'error';
  uploadMessage: string;
  fileInputRef?: React.RefObject<HTMLInputElement>;

  handleFileUpload: (file: File) => void;
  handleBatchFileUpload: (files: File[]) => void;
  handleTextUpload: () => void;
  isGeneratingEmbeddings: boolean;
  handleGenerateEmbeddings: () => Promise<void>;
  embeddingMessage: string;
}

interface FileDropzoneProps {
  isUploading: boolean;
  onFileAccepted: (file: File) => void;
  onMultipleFilesAccepted: (files: File[]) => void;
}

function FileDropzone({ isUploading, onFileAccepted, onMultipleFilesAccepted }: FileDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 1 && acceptedFiles[0]) {
      onFileAccepted(acceptedFiles[0]);
    } else if (acceptedFiles.length > 1) {
      onMultipleFilesAccepted(acceptedFiles);
    }
  }, [onFileAccepted, onMultipleFilesAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxSize: 10 * 1024 * 1024, // 10MB to accommodate PDFs and DOCX files
    multiple: true
  });

  return (
    <div
      {...getRootProps({className: `p-8 text-center rounded-lg border-2 ${isDragActive ? 'border-curious-cyan-500 bg-curious-cyan-500/10' : 'border-gray-600'} border-dashed transition-colors hover:border-curious-cyan-500 cursor-pointer`})}
    >
      <input {...getInputProps()} />
      {renderIcon(Upload, { className: "mx-auto mb-4 w-12 h-12 text-gray-400" })}
      {isDragActive ? (
        <p className="mb-2 text-gray-300">Drop the files here...</p>
      ) : (
        <>
          <p className="mb-2 text-gray-300">Drop your files here or click to browse</p>
          <p className="mb-4 text-sm text-gray-500">Supports .md, .txt (max 1MB), .pdf, and .docx/.doc files (max 10MB). Multiple files supported.</p>
        </>
      )}
      <MovingButton
        disabled={isUploading}
        className="bg-slate-900/[0.8] text-white pointer-events-none"
        containerClassName="w-auto min-w-[120px]"
        borderClassName="bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]"
      >
        {isUploading ? (
          <span className="flex gap-2 items-center">
            {renderIcon(Loader2, { className: "w-4 h-4 animate-spin" })}
            Uploading...
          </span>
        ) : (
          'Choose Files'
        )}
      </MovingButton>
    </div>
  );
}

export function UploadForm({
  uploadMethod,
  setUploadMethod,
  title,
  setTitle,
  summary,
  setSummary,
  textContent,
  setTextContent,
  isUploading,
  uploadStatus,
  uploadMessage,

  handleFileUpload,
  handleBatchFileUpload,
  handleTextUpload,
  isGeneratingEmbeddings,
  handleGenerateEmbeddings,
  embeddingMessage,
}: UploadFormProps): React.ReactElement | null {
  // Track previous upload status to prevent duplicate toasts
  const prevUploadStatusRef = React.useRef<'idle' | 'success' | 'error'>('idle');
  
  // Show toast on upload status change (only for final states)
  React.useEffect(() => {
    // Only show toast if status changed TO success/error FROM a different state
    if (uploadStatus === "success" && uploadMessage && prevUploadStatusRef.current !== "success") {
      toast.success(uploadMessage);
    }
    if (uploadStatus === "error" && uploadMessage && prevUploadStatusRef.current !== "error") {
      toast.error(uploadMessage);
    }
    
    // Update the previous status
    prevUploadStatusRef.current = uploadStatus;
  }, [uploadStatus, uploadMessage]);

  return (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">Choose Upload Method</h2>
      <div className="mb-6">
        <Tabs
          tabs={[
            {
              title: (
                <span className="flex gap-2 items-center">
                  {renderIcon(FileText, { className: "w-4 h-4" })}
                  <span>Upload</span>
                </span>
              ),
              value: 'file',
              content: null
            },
            {
              title: (
                <span className="flex gap-2 items-center">
                  {renderIcon(Type, { className: "w-4 h-4" })}
                  <span>Paste</span>
                </span>
              ),
              value: 'text',
              content: null
            }
          ]}
          activeTabIndex={uploadMethod === 'file' ? 0 : 1}
          onTabChange={(tab) => setUploadMethod(tab.value as 'file' | 'text')}
          variant="skewed"
          containerClassName="gap-4 justify-center"
          tabClassName="bg-gray-700 text-gray-300 hover:bg-gray-600 data-[state=active]:bg-curious-cyan-600 data-[state=active]:border-curious-cyan-500 data-[state=active]:text-white transition-colors px-4 py-3"
          contentClassName="hidden"
        />
      </div>

      {/* Common Fields */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">
            Title {uploadMethod === 'text' && <span className="text-red-400">*</span>}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={uploadMethod === 'file' ? 'Optional: Override filename' : 'Enter document title'}
            className="px-3 py-2 w-full placeholder-gray-400 text-white bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-curious-cyan-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">
            Summary (Optional)
          </label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief description of the document content"
            className="px-3 py-2 w-full placeholder-gray-400 text-white bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-curious-cyan-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* File Upload */}
      {uploadMethod === 'file' && (
        <div className="space-y-4">
          <FileDropzone
            isUploading={isUploading}
            onFileAccepted={(file) => {
              setTitle(file.name.replace(/\.[^/.]+$/, ''));
              handleFileUpload(file);
            }}
            onMultipleFilesAccepted={(files) => {
              setTitle(`${files.length} files selected`);
              handleBatchFileUpload(files);
            }}
          />
        </div>
      )}
    

      {/* Text Input */}
      {uploadMethod === 'text' && (
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Content <span className="text-red-400">*</span>
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your text content here..."
              rows={12}
              className="px-3 py-2 w-full placeholder-gray-400 text-white bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-curious-cyan-500 focus:border-transparent resize-vertical"
            />
          </div>
          <MovingButton
            onClick={handleTextUpload}
            disabled={isUploading || !textContent.trim() || !title.trim()}
            className="bg-slate-900/[0.8] text-white"
            containerClassName="w-auto min-w-[120px]"
            borderClassName="bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]"
          >
            {isUploading ? (
              <span className="flex gap-2 items-center">
                {renderIcon(Loader2, { className: "w-4 h-4 animate-spin" })}
                Uploading...
              </span>
            ) : (
              'Upload Text'
            )}
          </MovingButton>
        </div>
      )}

      {/* Status Message */}
      {uploadStatus !== 'idle' && (
        <StickyBanner className={uploadStatus === 'success' ? 'bg-green-900/90' : 'bg-red-900/90'}>
          <div className="flex gap-2 items-center px-4 py-2">
            {uploadStatus === 'success' ? (
              renderIcon(CheckCircle, { className: "w-5 h-5 text-green-400" })
            ) : (
              renderIcon(AlertCircle, { className: "w-5 h-5 text-red-400" })
            )}
            <span className={uploadStatus === 'success' ? 'text-green-300' : 'text-red-300'}>
              {uploadMessage}
            </span>
          </div>
        </StickyBanner>
      )}
    </div>
  );
}