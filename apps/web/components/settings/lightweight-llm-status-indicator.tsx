"use client";

import {
  AlertCircle,
  BrainCog,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Info,
  Loader2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLightweightLlmStatus } from "../../hooks/use-status-operations";
import { useStatusData } from "../../hooks/use-consolidated-health-check";
import { useStatusStore } from "../../stores/status-store";
import { useMultiModelStatus } from "../../hooks/use-multi-model-status";
import { renderIcon } from "../../lib/icon-utils";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { StatusIndicator } from "../ui/status-indicator";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tool-tip";
import { LLMDownloadProgressBar } from "../ui/loading/llm-download-progress-bar";

interface LightweightVectorConverterStatusProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  showLogs?: boolean;
  variant?: "lightweight" | "unified" | "consolidated"; // New prop to support unified mode
  showSummary?: boolean;
}

// Model information for info accordions
const modelInfo = {
  llama: {
    name: "Meta Llama 3.2",
    pros: ["Fast inference", "Good general knowledge", "Lightweight (1B parameters)", "Low memory usage"],
    cons: ["Limited specialized knowledge", "May struggle with complex reasoning", "Smaller context window"]
  },
  gpt: {
    name: "DialoGPT Medium",
    pros: ["Excellent conversational abilities", "Good at dialogue generation", "Trained on Reddit conversations"],
    cons: ["Larger model size", "May generate inappropriate content", "Limited factual knowledge"]
  },
  medgemma: {
    name: "MedGemma 4B",
    pros: ["Specialized medical knowledge", "Accurate medical information", "Healthcare-focused training"],
    cons: ["Larger model (4B parameters)", "Slower inference", "Limited general knowledge", "Higher memory usage"]
  },
  falcon: {
    name: "Falcon T5",
    pros: ["Good text generation", "Efficient architecture", "Multilingual support"],
    cons: ["Limited conversational abilities", "May require fine-tuning", "Less specialized knowledge"]
  }
};

// Map LLM status to StatusIndicator status
const mapToStatusIndicatorStatus = (status: string, ready: boolean): "connected" | "connecting" | "disconnected" => {
  // Check if model is ready/loaded
  if (status === "healthy" || status === "loaded" || status === "ready" || ready) return "connected";
  if (status === "error") return "disconnected";
  if (status === "downloading" || status === "loading") return "connecting";
  return "connecting";
};

const getModelStatusText = (model: any) => {
  if (!model) return "Not configured";
  
  // Check if model is loaded and ready
  if (model.is_loaded === true || model.status === "loaded") return "Ready";
  
  // Check for downloading status
  if (model.status === "downloading" || model.is_downloading === true) {
    const progress = model.download_progress || 0;
    return `Downloading ${progress}%`;
  }
  
  // Check for loading status
  if (model.status === "loading") return "Loading...";
  
  // Check for ready/downloaded status
  if (model.status === "ready") return "";
  
  // Check for error status
  if (model.status === "error") return "Error";
  
  return "Waiting...";
};

const getModelStatusColor = (model: any) => {
  if (!model) return "text-slate-400";
  
  // Check if model is loaded and ready
  if (model.is_loaded === true || model.status === "loaded") return "text-green-400";
  
  // Check for downloading or loading status
  if (model.status === "downloading" || model.is_downloading === true || model.status === "loading") {
    return "text-blue-400";
  }
  
  // Check for ready/downloaded status
  if (model.status === "ready") return "text-yellow-400";
  
  // Check for error status
  if (model.status === "error") return "text-red-400";
  return "text-slate-400";
};

export const LightweightLLMStatus = ({
  size = "md",
  showLabel = true,
  className,
  showLogs = true,
  variant = "lightweight",
  showSummary = false,
}: LightweightVectorConverterStatusProps): React.ReactElement => {
  const { status: lightweightLlmStatus, loading } = useLightweightLlmStatus();
  const { lightweightLlmStatus: consolidatedStatus } = useStatusData();
  const { modelsStatus, currentModel, loading: modelsLoading } = useMultiModelStatus();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to trigger model download
  const handleDownloadModel = async (modelName: string) => {
    try {
      // TODO: Implement API call to trigger model download
      console.log(`Triggering download for model: ${modelName}`);
      // This would typically make an API call to your backend to start the download
      // await fetch(`/api/models/${modelName}/download`, { method: 'POST' })
    } catch (error) {
      console.error(`Failed to trigger download for ${modelName}:`, error);
    }
  };

  // Helper function to check if a model can be downloaded (not auto-downloading models)
  const canDownloadModel = (model: any, modelKey: string) => {
    if (!model) return false;
    // Llama 3.2 downloads automatically, others can be triggered
    const isAutoDownload = modelKey === 'llama';
    
    // Check if any model is currently downloading
    const anyModelDownloading = Object.values(modelsStatus).some(
      (m: any) => m.status === 'downloading' || m.is_downloading
    );
    
    return !isAutoDownload && 
           model.status !== 'downloading' && 
           model.status !== 'loaded' && 
           !model.is_loaded &&
           !anyModelDownloading;
  };
  
  // Get model name from environment variable
  const modelName = process.env.NEXT_PUBLIC_LLM_MODEL || "Meta Llama 3.2";

  // Get models sorted by priority
  const sortedModels = Object.values(modelsStatus).sort((a, b) => a.priority - b.priority);
  const llamaModel = sortedModels.find(m => m.name.includes('Llama-3.2') || m.name.includes('llama-3.2'));
  const gptModel = sortedModels.find(m => m.name.includes('gpt-oss') || m.name.includes('openai-oss-20b') || m.name.includes('DialoGPT'));
  const medgemmaModel = sortedModels.find(m => m.name.includes('medgemma') || m.name.includes('MedGemma'));
  const falconModel = sortedModels.find(m => m.name.includes('falcon-h1-1b') || m.name.includes('flan-t5'));

  // Determine overall status based on primary model (Llama 3.2)
  const ready = llamaModel?.is_loaded || lightweightLlmStatus?.ready || false;
  const status = ready ? "healthy" : (llamaModel?.status || lightweightLlmStatus?.status || "unknown");
  const modelDisplayName = llamaModel?.display_name || lightweightLlmStatus?.model || "Meta Llama 3.2";
  const progressMessage = lightweightLlmStatus?.message || null;

  // Extract values from the status object
  const { message, model, details } = lightweightLlmStatus || {};
  
  // Conditional polling - only when expanded
  const startConditionalPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      if (isExpanded) {
        // Polling is handled by the multi-model status hook
      }
    }, 5000); // 5 second interval when expanded
  }, [isExpanded]);
  
  const stopConditionalPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  // Start/stop polling based on expansion state
  useEffect(() => {
    if (isExpanded) {
      startConditionalPolling();
    } else {
      stopConditionalPolling();
    }
    
    return () => stopConditionalPolling();
  }, [isExpanded, startConditionalPolling, stopConditionalPolling]);

  const getStatusIcon = () => {
    if (status === "healthy" && ready) {
      return renderIcon(CheckCircle, { className: "w-4 h-4 text-green-400" });
    } else if (status === "error") {
      return renderIcon(AlertCircle, { className: "w-4 h-4 text-red-400" });
    } else if (status === "starting") {
      return renderIcon(Loader2, {
        className: "w-4 h-4 text-blue-400 animate-spin",
      });
    } else if (status === "connecting") {
      return renderIcon(Loader2, {
        className: "w-4 h-4 text-yellow-300 animate-spin",
      });
    } else {
      return renderIcon(Loader2, {
        className: "w-4 h-4 text-yellow-400 animate-spin",
      });
    }
  };

  const getStatusText = () => {
    if (status === "healthy" && ready) {
      return "LLM Ready";
    } else if (status === "error") {
      return "LLM Service Error";
    } else if (status === "starting") {
      return "Service Starting...";
    } else if (status === "connecting") {
      return "Connecting to LLM...";
    } else if (status === "loading") {
      return "Model Loading...";
    } else {
      return "Loading LLM...";
    }
  };

  const getStatusColor = () => {
    if (status === "healthy" && ready) {
      return "text-green-400";
    } else if (status === "error") {
      return "text-red-400";
    } else if (status === "starting") {
      return "text-blue-400";
    } else if (status === "connecting") {
      return "text-yellow-300";
    } else {
      return "text-yellow-400";
    }
  };

  const getProgressMessage = () => {
    if (status === "loading" && !ready) {
      return "Model is loading, this may take a few minutes...";
    }
    if (status === "healthy" && ready) {
      return "Chat LLM is ready for inference";
    }
    return message;
  };

  const getCpuColor = (cpuPercent: number) => {
    if (cpuPercent > 80) return "text-red-400";
    if (cpuPercent > 50) return "text-yellow-400";
    return "text-green-400";
  };

  const getMemoryColor = (memoryPercent: number) => {
    if (memoryPercent > 80) return "text-red-400";
    if (memoryPercent > 60) return "text-yellow-400";
    return "text-green-400";
  };

  // Helper component to render model card with info and download
  const ModelCard = ({ model, modelKey, modelInfo, isPrimary = false }: { 
    model: any, 
    modelKey: string, 
    modelInfo: any, 
    isPrimary?: boolean 
  }) => {
    if (!model) return null;

    return (
      <div className={`flex items-start space-x-3 ${!isPrimary ? 'pl-3 border-l-2 border-slate-600' : ''}`}>
        <StatusIndicator
          status={mapToStatusIndicatorStatus(model.status, model.is_loaded)}
          size={isPrimary ? size : "sm"}
          className="flex-shrink-0 mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium truncate ${isPrimary ? 'text-slate-200' : 'text-slate-300'}`}>
                {model.display_name}
              </span>
              {model.is_loaded && (
                <CheckCircle className="flex-shrink-0 w-4 h-4 text-green-400" />
              )}
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-300" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="p-2 max-w-xs rounded-xl shadow-xl shadow-cyan-500 bg-slate-950/50">
                    <div className="mb-2 font-medium text-center text-cyan-500 rounded-xl shadow-xl shadow-cyan-500 bg-slate-950">{modelInfo.name}</div>
                    <div className="mb-2 bg-green-900 rounded-xl">
                      <div className="mb-1 ml-4 font-medium text-green-100">Pros:</div>
                      <ul className="mr-2 ml-2 space-y-1 text-xs text-white">
                        {modelInfo.pros.map((pro: string, idx: number) => (
                          <li key={idx}>• {pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mb-2 bg-red-900 rounded-xl">
                      <div className="mb-1 ml-4 font-medium text-red-100">Cons:</div>
                       <ul className="mr-2 ml-2 space-y-1 text-xs text-white">
                        {modelInfo.cons.map((con: string, idx: number) => (
                          <li key={idx}>• {con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            {model && (model.status !== 'ready' && !model.is_loaded) && (
              <Tooltip>
                <TooltipTrigger>
                  <button
                    onClick={() => handleDownloadModel(modelKey)}
                    disabled={!canDownloadModel(model, modelKey)}
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                      canDownloadModel(model, modelKey) 
                        ? 'text-white bg-blue-600 hover:bg-blue-700' 
                        : 'text-gray-400 bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {canDownloadModel(model, modelKey) 
                    ? `Download ${modelInfo.name} to make it available for use`
                    : 'Another model is currently downloading'
                  }
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="mt-1">
            {model.status === "downloading" && model.download_progress < 100 ? (
              <LLMDownloadProgressBar
                progress={model.download_progress}
                status="downloading"
                modelName={model.display_name}
                statusMessage={model.download_details}
                size="sm"
                showModelName={false}
                className="mt-1"
              />
            ) : (
              <div className="flex items-center space-x-2">
                {model.is_loaded || model.status === "loaded" || model.status === "ready" ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="relative cursor-pointer group">
                        <Download className="w-4 h-4 transition-colors text-slate-400 group-hover:text-slate-200" />
                        <CheckCircle className="absolute -top-1 -right-1 w-3 h-3 text-green-400 transition-colors group-hover:text-green-300" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="text-xs">Model is downloaded and ready to use</span>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="relative cursor-pointer group">
                        <Download className="w-4 h-4 transition-colors text-slate-400 group-hover:text-slate-200" />
                        <X className="absolute -top-1 -right-1 w-3 h-3 text-red-400 transition-colors group-hover:text-red-300" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="text-xs">Model needs to be downloaded</span>
                    </TooltipContent>
                  </Tooltip>
                )}
                <span className={`text-xs ${getModelStatusColor(model)}`}>
                  {getModelStatusText(model)}
                </span>
                {isPrimary && progressMessage && (
                  <span className="text-xs text-slate-400">• {progressMessage}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      {/* Header - Always visible, clickable to expand */}
      <div 
        className="flex gap-3 items-center p-3 transition-colors cursor-pointer hover:bg-slate-800/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex gap-2 items-center">
          {renderIcon(BrainCog, { className: "w-5 h-5 text-slate-400" })}
          <StatusIndicator 
            status={mapToStatusIndicatorStatus(status, ready)}
            size={size}
            showLabel={false}
          />
        </div>

        {showLabel && (
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-200">
                LLM Models
              </span>
              <span className={`text-xs ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {Object.values(modelsStatus).filter(m => m.is_loaded || m.status === "loaded" || m.status === "ready").length} of {Object.values(modelsStatus).length} models ready
            </div>
          </div>
        )}

        <div className="flex gap-2 items-center ml-auto">
          {getStatusIcon()}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-700/50"
          >
            <div className="p-3 bg-slate-950/30">
              <div className="space-y-3">
                {/* Primary Model - Meta Llama 3.2 */}
                <ModelCard 
                  model={llamaModel || { display_name: "Meta Llama 3.2", status: "unknown", is_loaded: false }}
                  modelKey="llama"
                  modelInfo={modelInfo.llama}
                  isPrimary={true}
                />

                {/* Secondary Model - GPT-OSS-20B */}
                <ModelCard 
                  model={gptModel}
                  modelKey="openai-oss-20b"
                  modelInfo={modelInfo.gpt}
                />

                {/* Tertiary Model - MedGemma-4B */}
                <ModelCard 
                  model={medgemmaModel}
                  modelKey="medgemma"
                  modelInfo={modelInfo.medgemma}
                />

                 {/* Quaternary Model - Falcon H1 1B */}
                 <ModelCard 
                   model={falconModel}
                   modelKey="falcon"
                   modelInfo={modelInfo.falcon}
                 />

                {details?.timestamp && (
                  <div className="text-xs text-slate-400">
                    Last checked: {new Date(details.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LLM Services Summary - only show if showSummary is true */}
      {showSummary && lightweightLlmStatus && (
        <div className="p-3 border-t border-slate-700/50 bg-slate-950/30">
          <div className="space-y-3">
            <div className="pb-1 text-xs font-medium border-b text-slate-400 border-slate-600">
              LLM Services Summary
            </div>
            
            {/* Overall Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-slate-400">Status:</span>
                <span className={`ml-1 font-medium ${getStatusColor()}`}>
                  {status}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Ready:</span>
                <span className={`ml-1 ${ready ? 'text-green-400' : 'text-red-400'}`}>
                  {ready ? 'Yes' : 'No'}
                </span>
              </div>
              {details?.service_status && (
                <div>
                  <span className="text-slate-400">Service:</span>
                  <span className="ml-1 text-slate-200">
                    {details.service_status}
                  </span>
                </div>
              )}
              {details?.model_loaded !== undefined && (
                <div>
                  <span className="text-slate-400">Model Loaded:</span>
                  <span className={`ml-1 ${details.model_loaded ? 'text-green-400' : 'text-red-400'}`}>
                    {details.model_loaded ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {details?.gpu_available !== undefined && (
                <div>
                  <span className="text-slate-400">GPU Available:</span>
                  <span className={`ml-1 ${details.gpu_available ? 'text-green-400' : 'text-yellow-400'}`}>
                    {details.gpu_available ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {details?.error && (
                <div className="col-span-2">
                  <span className="text-slate-400">Error:</span>
                  <div className="mt-1 text-xs text-red-300 break-words">
                    {details.error}
                  </div>
                </div>
              )}
            </div>

            {/* Memory Usage */}
            {lightweightLlmStatus.memory_usage && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-400">Resource Usage</div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {lightweightLlmStatus.memory_usage.rss_mb && (
                    <div>
                      <span className="text-slate-400">Memory (RSS):</span>
                      <span className={`ml-1 font-mono ${getMemoryColor(lightweightLlmStatus.memory_usage.percent || 0)}`}>
                        {lightweightLlmStatus.memory_usage.rss_mb.toFixed(0)}MB
                      </span>
                    </div>
                  )}
                  {lightweightLlmStatus.memory_usage.percent && (
                    <div>
                      <span className="text-slate-400">CPU:</span>
                      <span className={`ml-1 font-mono ${getCpuColor(lightweightLlmStatus.memory_usage.percent)}`}>
                        {lightweightLlmStatus.memory_usage.percent.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {lightweightLlmStatus.memory_usage.vms_mb && (
                    <div>
                      <span className="text-slate-400">Memory (VMS):</span>
                      <span className="ml-1 font-mono text-slate-200">
                        {lightweightLlmStatus.memory_usage.vms_mb.toFixed(0)}MB
                      </span>
                    </div>
                  )}
                  {lightweightLlmStatus.memory_usage.available_mb && (
                    <div>
                      <span className="text-slate-400">Available:</span>
                      <span className="ml-1 font-mono text-slate-200">
                        {lightweightLlmStatus.memory_usage.available_mb.toFixed(0)}MB
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}


    </Card>
  );
};

// Export alias for backward compatibility
export const LightweightVectorConverterStatus = LightweightLLMStatus;
export type { LightweightVectorConverterStatusProps };
