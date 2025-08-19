"use client";

import { useState } from "react";
import { Download, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { LLMDownloadProgressBar } from "../ui/loading/llm-download-progress-bar";
import { useMultiModelStatus } from "../../hooks/use-multi-model-status";

interface ModelDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const modelInfo = {
  llama1b: {
    name: "Meta Llama 3.2 1B",
    size: "1.3 GB",
    description: "Fast inference, good general knowledge, lightweight"
  },
  llama3b: {
    name: "Meta Llama 3.2 3B", 
    size: "3.2 GB",
    description: "Better reasoning than 1B, medium-sized model"
  },
  gpt: {
    name: "DialoGPT Medium",
    size: "1.5 GB",
    description: "Excellent conversational abilities, dialogue generation"
  },
  medgemma: {
    name: "MedGemma 4B",
    size: "4.1 GB", 
    description: "Specialized medical knowledge, healthcare-focused"
  },
  falcon: {
    name: "Falcon T5",
    size: "2.8 GB",
    description: "Good text generation, efficient architecture"
  }
};

export const ModelDownloadModal = ({ isOpen, onClose }: ModelDownloadModalProps) => {
  const { modelsStatus } = useMultiModelStatus();
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());

  const handleDownload = async (modelName: string) => {
    setDownloadingModels(prev => new Set(prev).add(modelName));
    try {
      console.log(`Triggering download for model: ${modelName}`);
      
      // Call the Python backend API to load/download the model
      const response = await fetch(`/api/lightweight-llm/models/${modelName}/load`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `Failed to start download for ${modelName}`);
      }

      const result = await response.json();
      console.log(`Download started for ${modelName}:`, result);
      
    } catch (error) {
      console.error(`Failed to download ${modelName}:`, error);
    } finally {
      setDownloadingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelName);
        return newSet;
      });
    }
  };

  const getModelStatus = (modelKey: string) => {
    const model = modelsStatus[modelKey];
    if (!model) return 'not_downloaded';
    
    if (model.status === 'downloading' || model.is_downloading) return 'downloading';
    if (model.is_loaded || model.status === 'loaded') return 'downloaded';
    if (model.status === 'error') return 'error';
    return 'not_downloaded';
  };

  const renderDownloadButton = (modelKey: string) => {
    const status = getModelStatus(modelKey);
    const isDownloading = downloadingModels.has(modelKey);
    
    switch (status) {
      case 'downloaded':
        return (
          <Button disabled variant="secondary" className="w-full">
            <CheckCircle className="mr-2 w-4 h-4 text-green-500" />
            Downloaded
          </Button>
        );
      case 'downloading':
        return (
          <div className="space-y-2 w-full">
            <Button disabled variant="secondary" className="w-full">
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Downloading...
            </Button>
            <LLMDownloadProgressBar 
              modelName={modelKey}
              progress={modelsStatus[modelKey]?.download_progress || 0}
              status="downloading"
              statusMessage={modelsStatus[modelKey]?.download_details}
              size="sm"
              showModelName={false}
            />
          </div>
        );
      case 'error':
        return (
          <Button 
            onClick={() => handleDownload(modelKey)}
            variant="secondary" 
            className="w-full"
          >
            <AlertCircle className="mr-2 w-4 h-4 text-red-500" />
            Retry Download
          </Button>
        );
      default:
        return (
          <Button 
            onClick={() => handleDownload(modelKey)}
            disabled={isDownloading}
            variant="primary" 
            className="w-full"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Download className="mr-2 w-4 h-4" />
                Download
              </>
            )}
          </Button>
        );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose} side="top">
      <SheetContent className="w-full sm:max-w-md" side="top">
        <SheetHeader>
          <SheetTitle>Download Models</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {Object.entries(modelInfo).map(([modelKey, info]) => (
            <Card key={modelKey} className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium">{info.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {info.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Size: {info.size}
                  </p>
                </div>
                {renderDownloadButton(modelKey)}
              </div>
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};