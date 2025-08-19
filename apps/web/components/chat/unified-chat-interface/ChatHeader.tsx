'use client';

import {
  Bot,
  Plus,
  FileText,
  X,
  History,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { renderIcon } from '../../../lib/icon-utils';
import { TitleGenerationLoader } from '../../ui/loading/TitleGenerationLoader';
import { SelectedDocumentsList } from './SelectedDocumentsList';
import { useChatMode } from '../../../stores/unifiedChatStore';
import { useMultiModelStatus } from '../../../hooks/use-multi-model-status';
import { useModelSelectionStore } from '../../../stores/use-model-selection-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tool-tip';

interface ChatHeaderProps {
  conversationTitle: string | null;
  isGeneratingTitle: boolean;
  titleGenerationProgress: number;
  selectedDocuments: any[];
  onHistoryClick: () => void;
  onNewConversationClick: () => void;
  onRemoveDocumentsClick: () => void;
  onDocumentsClick: () => void;
  onDocumentClick: (documentId: string) => void;
}

export const ChatHeader = React.memo(function ChatHeader({
  conversationTitle,
  isGeneratingTitle,
  titleGenerationProgress,
  selectedDocuments,
  onHistoryClick,
  onNewConversationClick,
  onRemoveDocumentsClick,
  onDocumentsClick,
  onDocumentClick
}: ChatHeaderProps) {
  const chatMode = useChatMode();
  const { modelsStatus, currentModel: currentLoadedModel } = useMultiModelStatus();
  const { selectedModel, setSelectedModel, availableModels, setAvailableModels } = useModelSelectionStore();
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  // Get all models for display, but we'll handle selection logic separately
  const allModelsList = Object.values(modelsStatus);
  
  // Get only selectable models for the available models list
  const selectableModelsList = allModelsList.filter(model => 
    model.is_loaded || model.status === "loaded"
  );
  
  // Helper function to check if a model is selectable
  const isModelSelectable = (model: any) => {
    return model.is_loaded || model.status === "loaded";
  };
  
  // Helper function to get tooltip message for non-selectable models
  const getTooltipMessage = (model: any) => {
    if (model.status === "downloading" || model.status === "loading") {
      return "Model is currently downloading. Please wait for it to complete.";
    }
    if (model.status === "ready" && !model.is_loaded) {
      return "Model needs to be downloaded before it can be used. Go to Settings > LLM Status to download.";
    }
    return "Model is not available for selection.";
  };
  
  // Set available models in the store and initialize selected model
  useEffect(() => {
    if (selectableModelsList.length > 0) {
      const modelNames = selectableModelsList.map(model => model.name);
      
      // Only update if the models list has actually changed
      if (JSON.stringify(modelNames) !== JSON.stringify(availableModels)) {
        setAvailableModels(modelNames);
        
        // Set initial selected model only if none is selected and we have models
        if (!selectedModel && modelNames.length > 0) {
          setSelectedModel(modelNames[0]);
        }
      }
    }
  }, [selectableModelsList.map(m => m.name).join(','), selectedModel]); // Use string join to avoid array reference issues
  
  const currentModel = selectableModelsList.find(model => model.name === selectedModel) || selectableModelsList[0];

  return (
    <div className="relative bg-gradient-to-r border-b backdrop-blur-md z-100 border-cyan-500/30 from-slate-800/40 via-slate-700/60 to-slate-800/40">
      {/* Animated accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

      {/* Header content */}
      <div className="flex gap-2 justify-between items-center p-3 mt-16 sm:p-4 md:p-6 sm:gap-3 sm:mt-0">
        <div className="flex gap-2 items-center sm:gap-3">
          <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 rounded-xl sm:w-7 sm:h-7">
            {renderIcon(Bot, { className: "w-3 h-3 sm:w-5 sm:h-5 text-cyan-400" })}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-bold text-cyan-100 truncate sm:text-sm">
              {conversationTitle || (chatMode === 'general' ? 'General AI Chat' : `RAG Chat (${selectedDocuments.length} documents)`)}
            </h2>
            <p className="text-[10px] sm:text-xs text-cyan-300/70 truncate">
              {conversationTitle ? (chatMode === 'general' ? 'General AI Chat' : `RAG Chat (${selectedDocuments.length} documents)`) : (chatMode === 'general' ? 'Ask me anything!' : 'Chatting with your documents')}
            </p>
            {isGeneratingTitle && (
              <div className="mt-1">
                <TitleGenerationLoader progress={titleGenerationProgress} isVisible={isGeneratingTitle} />
              </div>
            )}
          </div>
        </div>

        {/* Model selector and controls */}
        <div className="flex gap-2 items-center">
          {/* Model Selector */}
          {availableModels.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                className="flex gap-2 items-center p-2 text-blue-400 rounded-lg border transition-all duration-200 border-blue-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-blue-300"
                title="Select AI Model"
              >
                {renderIcon(Cpu, { className: "w-4 h-4" })}
                <span className="hidden text-sm truncate sm:inline max-w-24">
                  {Object.values(modelsStatus).find(m => m.name === selectedModel)?.display_name || 'Select Model'}
                </span>
                {renderIcon(ChevronDown, { className: "w-3 h-3" })}
              </button>

              {/* Dropdown */}
              {isModelSelectorOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border shadow-xl backdrop-blur-md bg-slate-800/95 border-slate-600/50">
                  <div className="p-2">
                    <div className="px-2 mb-2 text-xs font-medium text-slate-400">Available Models</div>
                    {allModelsList.map((model) => {
                      const isSelected = selectedModel === model.name;
                      const isSelectable = isModelSelectable(model);
                      const tooltipMessage = getTooltipMessage(model);
                      
                      const modelButton = (
                        <button
                          key={model.name}
                          onClick={() => {
                            if (isSelectable) {
                              setSelectedModel(model.name);
                              setIsModelSelectorOpen(false);
                            }
                          }}
                          disabled={!isSelectable}
                          className={`w-full text-left p-2 rounded-md transition-all duration-200 ${
                            isSelectable 
                              ? 'cursor-pointer' 
                              : 'cursor-not-allowed opacity-50'
                          } ${
                            isSelected
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : isSelectable
                                ? 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-200'
                                : 'text-slate-500'
                          }`}
                        >
                          <div className="text-sm font-medium">{model.display_name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {model.name} • {isSelected ? 'Default' : model.status || 'Unknown'}
                          </div>
                        </button>
                      );
                      
                      if (!isSelectable) {
                        return (
                          <Tooltip key={model.name}>
                            <TooltipTrigger asChild>
                              {modelButton}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{tooltipMessage}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      
                      return modelButton;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={onHistoryClick}
            className="p-2 text-purple-400 rounded-lg border transition-all duration-200 border-purple-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-purple-300"
            title="Chat History"
          >
            {renderIcon(History, { className: "w-4 h-4" })}
          </button>

          <button
            onClick={onNewConversationClick}
            className="p-2 text-green-400 rounded-lg border transition-all duration-200 border-green-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-green-300"
            title="Start new conversation"
          >
            {renderIcon(Plus, { className: "w-4 h-4" })}
          </button>

          {chatMode === 'rag' && selectedDocuments.length > 0 && (
            <button
              onClick={onRemoveDocumentsClick}
              className="p-2 text-red-400 rounded-lg border transition-all duration-200 border-red-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-red-300"
              title="Remove documents"
            >
              {renderIcon(X, { className: "w-4 h-4" })}
            </button>
          )}

          <button
            onClick={onDocumentsClick}
            className="flex gap-2 items-center p-2 text-cyan-400 rounded-lg border transition-all duration-200 border-cyan-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-cyan-300"
            title="Add documents"
          >
            {renderIcon(FileText, { className: "w-4 h-4" })}
            <span className="hidden text-sm sm:inline">Documents</span>
          </button>
        </div>
      </div>

      {/* Selected documents display */}
      {selectedDocuments.length > 0 && (
        <div className="px-3 pb-3 sm:px-4 md:px-6 sm:pb-4">
          <SelectedDocumentsList 
            documents={selectedDocuments} 
            onDocumentClick={onDocumentClick} 
          />
        </div>
      )}
    </div>
  );
});
