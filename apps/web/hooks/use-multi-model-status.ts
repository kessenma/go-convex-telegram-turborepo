"use client";

import { useCallback, useEffect, useState } from "react";

interface ModelStatus {
  name: string;
  display_name: string;
  provider: string;
  status: string;
  download_progress: number;
  is_loaded: boolean;
  is_current: boolean;
  priority: number;
  auto_download: boolean;
  download_status?: string;
  download_details?: string;
  is_downloading?: boolean;
}

interface MultiModelStatusResponse {
  models: Record<string, ModelStatus>;
  current_model: string | null;
  timestamp: number;
}

interface UseMultiModelStatusReturn {
  modelsStatus: Record<string, ModelStatus>;
  currentModel: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refetch: () => Promise<void>;
}

export function useMultiModelStatus(): UseMultiModelStatusReturn {
  const [modelsStatus, setModelsStatus] = useState<Record<string, ModelStatus>>({});
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchModelsStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/lightweight-llm/models/status');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: MultiModelStatusResponse = await response.json();
      
      setModelsStatus(data.models);
      setCurrentModel(data.current_model);
      setLastUpdated(data.timestamp);
      
    } catch (err) {
      console.error('Error fetching models status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchModelsStatus();
  }, [fetchModelsStatus]);

  // Auto-refresh with smart intervals based on model states
  useEffect(() => {
    const hasDownloadingModels = Object.values(modelsStatus).some(
      model => model.status === 'downloading' || model.is_downloading === true
    );
    
    const hasLoadingModels = Object.values(modelsStatus).some(
      model => model.status === 'loading'
    );

    let interval: NodeJS.Timeout | null = null;

    if (hasDownloadingModels) {
      // Poll every 5 seconds when downloading
      interval = setInterval(fetchModelsStatus, 5000);
    } else if (hasLoadingModels) {
      // Poll every 10 seconds when loading
      interval = setInterval(fetchModelsStatus, 10000);
    } else if (Object.keys(modelsStatus).length === 0) {
      // Poll every 15 seconds when no models data yet
      interval = setInterval(fetchModelsStatus, 15000);
    }
    // No polling when all models are ready/stable

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [modelsStatus, fetchModelsStatus]);

  return {
    modelsStatus,
    currentModel,
    loading,
    error,
    lastUpdated,
    refetch: fetchModelsStatus,
  };
}