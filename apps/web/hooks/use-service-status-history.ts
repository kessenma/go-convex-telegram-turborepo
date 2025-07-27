"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useMemo } from "react";

interface ServiceStatusData {
  _id: string;
  serviceName: string;
  status: string;
  ready: boolean;
  message: string;
  modelLoaded?: boolean;
  modelLoading?: boolean;
  model?: string;
  uptime?: number;
  error?: string;
  degradedMode?: boolean;
  memoryUsage?: {
    processCpuPercent?: number;
    processMemoryMb?: number;
    processMemoryPercent?: number;
    systemMemoryAvailableGb?: number;
    systemMemoryTotalGb?: number;
    systemMemoryUsedPercent?: number;
    rssMb?: number;
    vmsMb?: number;
    percent?: number;
    availableMb?: number;
  };
  timestamp: number;
  lastUpdated: number;
}

interface ServiceSummary {
  serviceName: string;
  currentStatus: string;
  ready: boolean;
  lastSeen: number;
  totalEntries: number;
  avgMemoryMb: number;
  avgCpuPercent: number;
  uptimeHours: number;
  healthyPercentage: number;
}

interface HistoricalData {
  timestamp: number;
  memory: number;
  cpu: number;
  status: string;
  ready: boolean;
}

export function useServiceStatusHistory() {
  // Get all service statuses from Convex
  const allStatuses = useQuery(api.serviceStatus.getAllServiceStatuses) || [];
  
  // Get latest status for each service
  const latestStatuses = useMemo(() => {
    const statusMap = new Map<string, ServiceStatusData>();
    
    allStatuses.forEach((status) => {
      const existing = statusMap.get(status.serviceName);
      if (!existing || status.lastUpdated > existing.lastUpdated) {
        statusMap.set(status.serviceName, status);
      }
    });
    
    return Array.from(statusMap.values());
  }, [allStatuses]);

  // Generate summary for each service
  const serviceSummaries = useMemo((): ServiceSummary[] => {
    const summaryMap = new Map<string, ServiceSummary>();
    
    allStatuses.forEach((status) => {
      const serviceName = status.serviceName;
      
      if (!summaryMap.has(serviceName)) {
        summaryMap.set(serviceName, {
          serviceName,
          currentStatus: status.status,
          ready: status.ready,
          lastSeen: status.timestamp,
          totalEntries: 0,
          avgMemoryMb: 0,
          avgCpuPercent: 0,
          uptimeHours: 0,
          healthyPercentage: 0,
        });
      }
      
      const summary = summaryMap.get(serviceName)!;
      summary.totalEntries++;
      
      // Update latest info
      if (status.timestamp > summary.lastSeen) {
        summary.currentStatus = status.status;
        summary.ready = status.ready;
        summary.lastSeen = status.timestamp;
        summary.uptimeHours = status.uptime ? status.uptime / 3600 : 0;
      }
      
      // Accumulate memory and CPU for averaging
      if (status.memoryUsage?.processMemoryMb) {
        summary.avgMemoryMb += status.memoryUsage.processMemoryMb;
      }
      if (status.memoryUsage?.processCpuPercent) {
        summary.avgCpuPercent += status.memoryUsage.processCpuPercent;
      }
    });
    
    // Calculate averages and health percentage
    summaryMap.forEach((summary) => {
      if (summary.totalEntries > 0) {
        summary.avgMemoryMb = summary.avgMemoryMb / summary.totalEntries;
        summary.avgCpuPercent = summary.avgCpuPercent / summary.totalEntries;
        
        // Calculate healthy percentage
        const healthyCount = allStatuses
          .filter(s => s.serviceName === summary.serviceName && s.status === 'healthy')
          .length;
        summary.healthyPercentage = (healthyCount / summary.totalEntries) * 100;
      }
    });
    
    return Array.from(summaryMap.values());
  }, [allStatuses]);

  // Get historical data for charts (last 50 entries per service)
  const historicalData = useMemo(() => {
    const dataMap = new Map<string, HistoricalData[]>();
    
    // Sort by timestamp and take recent entries
    const sortedStatuses = [...allStatuses]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100); // Limit total entries to prevent performance issues
    
    sortedStatuses.forEach((status) => {
      if (!dataMap.has(status.serviceName)) {
        dataMap.set(status.serviceName, []);
      }
      
      const serviceData = dataMap.get(status.serviceName)!;
      if (serviceData.length < 50) { // Limit per service
        serviceData.push({
          timestamp: status.timestamp,
          memory: status.memoryUsage?.processMemoryMb || 0,
          cpu: status.memoryUsage?.processCpuPercent || 0,
          status: status.status,
          ready: status.ready,
        });
      }
    });
    
    // Sort each service's data by timestamp (oldest first for charts)
    dataMap.forEach((data) => {
      data.sort((a, b) => a.timestamp - b.timestamp);
    });
    
    return dataMap;
  }, [allStatuses]);

  // Overall system health
  const systemHealth = useMemo(() => {
    if (latestStatuses.length === 0) return 'unknown';
    
    const healthyServices = latestStatuses.filter(s => s.status === 'healthy' && s.ready).length;
    const totalServices = latestStatuses.length;
    
    if (healthyServices === totalServices) return 'healthy';
    if (healthyServices > 0) return 'degraded';
    return 'critical';
  }, [latestStatuses]);

  return {
    allStatuses,
    latestStatuses,
    serviceSummaries,
    historicalData,
    systemHealth,
    isLoading: allStatuses === undefined,
    totalEntries: allStatuses.length,
  };
}

// Hook to get data for a specific service
export function useServiceStatus(serviceName: string) {
  const serviceStatus = useQuery(api.serviceStatus.getServiceStatus, { serviceName });
  
  return {
    status: serviceStatus,
    isLoading: serviceStatus === undefined,
  };
}