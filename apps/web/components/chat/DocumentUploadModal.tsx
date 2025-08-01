"use client";

import { useState } from 'react';
import { ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle } from '../ui/responsive-modal';
import { UploadForm } from '../rag/UploadForm';
import { toast } from 'sonner';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export function DocumentUploadModal({ isOpen, onClose, onUploadSuccess }: DocumentUploadModalProps) {
  const [uploadMethod, setUploadMethod] = useState<"file" | "text">("file");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  // Reset form when modal closes
  const handleClose = () => {
    setTitle("");
    setSummary("");
    setTextContent("");
    setUploadStatus("idle");
    setUploadMessage("");
    onClose();
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus("idle");
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (summary) formData.append('summary', summary);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        let errorMessage = 'Upload failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      setUploadStatus("success");
      setUploadMessage(`Document "${result.title}" uploaded successfully!`);
      toast.success(`Document uploaded successfully!`);
      onUploadSuccess?.();
      
      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus("error");
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed');
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBatchFileUpload = async (files: File[]) => {
    setIsUploading(true);
    setUploadStatus("idle");
    
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      if (summary) formData.append('summary', summary);

      const response = await fetch('/api/documents/batch-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Batch upload failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        let errorMessage = 'Batch upload failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      setUploadStatus("success");
      setUploadMessage(`${files.length} documents uploaded successfully!`);
      toast.success(`${files.length} documents uploaded successfully!`);
      onUploadSuccess?.();
      
      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Batch upload error:', error);
      setUploadStatus("error");
      setUploadMessage(error instanceof Error ? error.message : 'Batch upload failed');
      toast.error('Batch upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!title.trim() || !textContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsUploading(true);
    setUploadStatus("idle");
    
    try {
      const response = await fetch('/api/documents/text-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: textContent.trim(),
          summary: summary.trim() || undefined,
          contentType: 'text',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Text upload failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        let errorMessage = 'Text upload failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      setUploadStatus("success");
      setUploadMessage(`Document "${title}" uploaded successfully!`);
      toast.success(`Document uploaded successfully!`);
      onUploadSuccess?.();
      
      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Text upload error:', error);
      setUploadStatus("error");
      setUploadMessage(error instanceof Error ? error.message : 'Text upload failed');
      toast.error('Text upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <ResponsiveModalContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Upload New Document</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        
        <div className="mt-4">
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
            handleFileUpload={handleFileUpload}
            handleBatchFileUpload={handleBatchFileUpload}
            handleTextUpload={handleTextUpload}
            isGeneratingEmbeddings={false}
            handleGenerateEmbeddings={async () => {}}
            embeddingMessage=""
          />
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}