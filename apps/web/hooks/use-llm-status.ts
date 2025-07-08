"use client";

import { useState, useEffect } from 'react';

interface LLMStatus {
  status: 'healthy' | 'error' | 'loading';
  ready: boolean;
  message: string;
  model?: string;
  details?: {
    service_status?: string;
    model_loaded?: boolean;
    uptime?: string;
    timestamp?: string;
    error?: string;
  };
}

export function useLLMStatus() {
  const [llmStatus, setLLMStatus] = useState<LLMStatus>({
    status: 'loading',
    ready: false,
    message: 'Checking LLM service status...'
  });

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/llm/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setLLMStatus({
          status: 'error',
          ready: false,
          message: `Service unavailable (${response.status})`,
          details: {
            error: `HTTP ${response.status}: ${response.statusText}`,
            timestamp: new Date().toISOString(),
            model_loaded: false
          }
        });
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        // Determine if model is still loading
        const isModelLoading = data.details?.model_loaded === false || 
                             (data.status === 'healthy' && !data.ready);
        
        setLLMStatus({
          status: isModelLoading ? 'loading' : data.status,
          ready: data.ready,
          message: data.message,
          model: data.model,
          details: {
            service_status: data.details?.service_status,
            model_loaded: data.details?.model_loaded,
            uptime: data.details?.uptime,
            timestamp: new Date().toISOString(),
            error: data.details?.error
          }
        });
      } else {
        setLLMStatus({
          status: 'error',
          ready: false,
          message: data.message || 'Unknown error',
          details: {
            error: data.message || 'Unknown error',
            timestamp: new Date().toISOString(),
            model_loaded: false
          }
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cannot connect to LLM service';
      setLLMStatus({
        status: 'error',
        ready: false,
        message: 'Cannot connect to LLM service',
        details: {
          error: errorMessage,
          timestamp: new Date().toISOString(),
          model_loaded: false
        }
      });
    }
  };

  useEffect(() => {
    // Initial check
    checkStatus();

    // Poll every 5 seconds until the model is ready, then every 30 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, llmStatus.ready ? 30000 : 5000);

    return () => clearInterval(interval);
  }, [llmStatus.ready]);

  return { llmStatus, checkStatus };
}