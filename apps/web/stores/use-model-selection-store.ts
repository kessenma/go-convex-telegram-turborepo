"use client";

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { toast } from 'sonner';

interface ModelSelectionState {
  selectedModel: string | null;
  setSelectedModel: (modelId: string) => void;
  setSelectedModelLocal: (modelId: string) => void;
  availableModels: string[];
  setAvailableModels: (models: string[]) => void;
  moveSelectedModelToTop: () => void;
}

export const useModelSelectionStore = create<ModelSelectionState>()(subscribeWithSelector((set, get) => ({
  selectedModel: null,
  availableModels: [],
  
  setSelectedModelLocal: (modelId: string) => {
    set({ selectedModel: modelId });
  },
  
  setSelectedModel: async (modelId: string) => {
    const currentState = get();
    
    // Only proceed if the model is different
    if (currentState.selectedModel === modelId) {
      return;
    }
    
    try {
      // Call API to set current model first
      const response = await fetch('/api/lightweight-llm/models/set-current', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Only update state if API call was successful
        set({ selectedModel: modelId });
        
        // Show success toast notification
         toast.success(`Successfully switched to ${modelId}`, {
           duration: 3000
         });
      } else {
        // Show error toast if API call failed
         toast.error(data.error || 'Failed to switch model', {
           duration: 4000
         });
      }
    } catch (error) {
      console.error('Error setting model:', error);
      toast.error('Unable to connect to the LLM service. Please check if the service is running.', {
         duration: 5000
       });
    }
  },
  
  setAvailableModels: (models: string[]) => {
    set((state) => {
      // Only update if the models array has actually changed
      if (JSON.stringify(state.availableModels) !== JSON.stringify(models)) {
        return { availableModels: models };
      }
      return state;
    });
  },
  
  moveSelectedModelToTop: () => {
    set((state) => {
      if (!state.selectedModel) return state;
      
      // Create a new array with the selected model at the top
      const reorderedModels = [
        state.selectedModel,
        ...state.availableModels.filter(model => model !== state.selectedModel)
      ];
      
      return { availableModels: reorderedModels };
    });
  },
})));