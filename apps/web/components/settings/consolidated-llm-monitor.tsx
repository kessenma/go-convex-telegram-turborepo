"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  MemoryStick,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLLMMetrics, useStatusData } from "../../hooks/use-consolidated-status";
import { renderIcon } from "../../lib/icon-utils";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion";

interface ConsolidatedLLMMonitorProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  showSummary?: boolean;
}

export const ConsolidatedLLMMonitor = ({
  size = "md",
  showLabel = true,
  className,
  showSummary = true,
}: ConsolidatedLLMMonitorProps): React.ReactElement => {
  const llmMetrics = useLLMMetrics();
  const { consolidatedLLMMetrics } = useStatusData();
  const [isExpanded, setIsExpanded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; level: string }>>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Extract consolidated metrics data
  const {
    isHealthy,
    totalServices,
    healthyServices,
    totalMemoryMB,
    averageCPU,
    services,
  } = llmMetrics;
  
  const vectorService = services && 'vector' in services ? services.vector : null;
  const chatService = services && 'chat' in services ? services.chat : null;
  const isVectorHealthy = vectorService?.status === 'healthy' && vectorService?.ready;
  const isChatHealthy = chatService?.status === 'healthy' && chatService?.ready;
  const isAnyServiceHealthy = isVectorHealthy || isChatHealthy;
  const areBothServicesHealthy = isVectorHealthy && isChatHealthy;

  const getOverallStatus = () => {
    if (!consolidatedLLMMetrics) return "loading";
    if (areBothServicesHealthy) return "healthy";
    if (isAnyServiceHealthy) return "degraded";
    return "error";
  };

  const getStatusText = () => {
    if (!consolidatedLLMMetrics) return "Loading LLM Services...";
    if (areBothServicesHealthy) return "All LLM Services Healthy";
    if (isAnyServiceHealthy) return "Some LLM Services Available";
    return "LLM Services Unavailable";
  };

  const fetchLogs = useCallback(async () => {
    if (!isExpanded) return;
    
    setIsLoadingLogs(true);
    try {
      const response = await fetch('/api/llm/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch LLM logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded) {
      fetchLogs();
      intervalRef.current = setInterval(fetchLogs, 30000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isExpanded, fetchLogs]);

  const getStatusIcon = () => {
    const status = getOverallStatus();
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    const status = getOverallStatus();
    switch (status) {
      case "healthy":
        return "text-green-400";
      case "degraded":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <Card className={cn("p-4 w-full", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            {showLabel && (
              <h3 className={cn("font-medium", sizeClasses[size])}>
                LLM Services
              </h3>
            )}
          </div>
          <div className={cn("text-sm font-medium", getStatusColor())}>
            {getStatusText()}
          </div>
        </div>
        
        {/* Summary */}
        {showSummary && (
          <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-slate-800/30">
            <div className="text-center">
              <div className="text-xs text-slate-400">Services</div>
              <div className="text-lg font-bold text-white">
                {healthyServices}/{totalServices}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">Memory</div>
              <div className="text-lg font-bold text-white">
                {totalMemoryMB.toFixed(0)}MB
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">CPU</div>
              <div className="text-lg font-bold text-white">
                {averageCPU.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Expandable Details */}
        <Accordion type="single" collapsible>
          <AccordionItem value="details">
            <AccordionTrigger className="text-sm">
              View Details
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 space-y-4">
                {/* Service Status Details */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">Service Status</h4>
                  <div className="grid gap-2">
                    {vectorService && (
                      <div className="flex justify-between items-center p-2 rounded border border-slate-700 bg-slate-800/20">
                        <div className="flex items-center space-x-2">
                          <Server className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300">Vector Service</span>
                        </div>
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded",
                          isVectorHealthy 
                            ? "text-green-400 bg-green-500/20" 
                            : "text-red-400 bg-red-500/20"
                        )}>
                          {vectorService.status}
                        </span>
                      </div>
                    )}
                    {chatService && (
                      <div className="flex justify-between items-center p-2 rounded border border-slate-700 bg-slate-800/20">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300">Chat Service</span>
                        </div>
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded",
                          isChatHealthy 
                            ? "text-green-400 bg-green-500/20" 
                            : "text-red-400 bg-red-500/20"
                        )}>
                          {chatService.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resource Usage */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">Resource Usage</h4>
                  <div className="grid gap-2">
                    {vectorService?.memory_usage && (
                      <div className="flex justify-between items-center p-2 rounded border border-slate-700 bg-slate-800/20">
                        <div className="flex items-center space-x-2">
                          <MemoryStick className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300">Vector Memory</span>
                        </div>
                        <span className="font-mono text-sm text-slate-300">
                          {vectorService.memory_usage.process_memory_mb?.toFixed(0) || 0}MB
                        </span>
                      </div>
                    )}
                    {chatService?.memory_usage && (
                      <div className="flex justify-between items-center p-2 rounded border border-slate-700 bg-slate-800/20">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300">Chat Memory</span>
                        </div>
                        <span className="font-mono text-sm text-slate-300">
                          {chatService.memory_usage.rss_mb?.toFixed(0) || 0}MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Logs */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-slate-300">Recent Logs</h4>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={fetchLogs}
                      disabled={isLoadingLogs}
                      className="px-3 h-8 text-xs"
                    >
                      {isLoadingLogs ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="overflow-y-auto p-2 space-y-1 max-h-48 rounded border border-slate-700 bg-slate-900/30">
                    {logs.length > 0 ? (
                      logs.slice(0, 10).map((log, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-2 rounded text-xs",
                            log.level === "error"
                              ? "bg-red-900/20 text-red-300"
                              : log.level === "warning"
                              ? "bg-yellow-900/20 text-yellow-300"
                              : "bg-slate-800/20 text-slate-300"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-xs">{log.message}</span>
                            <span className="text-xs opacity-60">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-sm text-center text-slate-400">
                        No recent logs available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Card>
  );
};