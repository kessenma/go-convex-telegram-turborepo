"use client";

import React, { RefObject } from "react";
import { Upload, FileText, Type, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { renderIcon } from "../../lib/icon-utils";
import { Button as MovingButton } from "../../components/ui/moving-border";
import { StickyBanner } from "../../components/ui/sticky-banner";

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
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileUpload: (file: File) => void;
  handleTextUpload: () => void;
  isGeneratingEmbeddings: boolean;
  handleGenerateEmbeddings: () => Promise<void>;
  embeddingMessage: string;
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
  fileInputRef,
  handleFileUpload,
  handleTextUpload,
  isGeneratingEmbeddings,
  handleGenerateEmbeddings,
  embeddingMessage,
}: UploadFormProps): React.ReactElement | null {
  return (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">Choose Upload Method</h2>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setUploadMethod('file')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            uploadMethod === 'file'
              ? 'bg-curious-cyan-600 border-curious-cyan-500 text-white'
              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {renderIcon(FileText, { className: "w-4 h-4" })}
          Upload
        </button>
        <button
          onClick={() => setUploadMethod('text')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            uploadMethod === 'text'
              ? 'bg-curious-cyan-600 border-curious-cyan-500 text-white'
              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {renderIcon(Type, { className: "w-4 h-4" })}
          Paste
        </button>
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
          <div className="p-8 text-center rounded-lg border-2 border-gray-600 border-dashed transition-colors hover:border-curious-cyan-500">
            {renderIcon(Upload, { className: "mx-auto mb-4 w-12 h-12 text-gray-400" })}
            <p className="mb-2 text-gray-300">Drop your .md file here or click to browse</p>
            <p className="mb-4 text-sm text-gray-500">Supports .md and .txt files up to 1MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setTitle(file.name.replace(/\.[^/.]+$/, ''));
                  handleFileUpload(file);
                }
              }}
              className="hidden"
            />
            <MovingButton
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
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
                'Choose File'
              )}
            </MovingButton>


          </div>
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