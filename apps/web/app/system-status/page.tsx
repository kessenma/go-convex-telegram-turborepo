"use client";

export const runtime = "edge";
export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { ConvexStatusIndicator } from "../../components/settings/convex-status-indicator";
import { LightweightLLMStatus } from "../../components/settings/lightweight-llm-status-indicator";
import { ConsolidatedLLMMonitor } from "../../components/settings/consolidated-llm-monitor";
import { LLMUsageBarChart } from "../../components/settings/llm-usage-bar-chart";
import { DockerStatus } from "../../components/settings/docker-status";
import { UserCountIndicator } from "../../components/settings/user-count-indicator";
import { Card } from "../../components/ui/card";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { Hero, TextAnimationType } from "../../components/ui/hero";

import { useStatusData } from "../../hooks/use-consolidated-health-check";
import { useManualHealthCheck } from "../../hooks/use-manual-health-check";
import { useLLMMetrics } from "../../hooks/use-llm-metrics";

function SystemStatusPageContent() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use hooks with error handling
  const { systemHealth = 'critical', systemReady = false } = useStatusData() || {};
  const { checkAll = async () => { } } = useManualHealthCheck() || {};
  const {
    consolidatedMetrics = null,
    summary = null,
    isLoading = true
  } = useLLMMetrics() || {};

  // Ensure we have safe defaults during SSR/build time
  const safeConsolidatedMetrics = consolidatedMetrics || null;
  const safeSummary = summary || null;

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await checkAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSystemHealthColor = () => {
    switch (systemHealth) {
      case 'healthy': return 'text-emerald-500';
      case 'degraded': return 'text-amber-500';
      case 'critical': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  const getSystemHealthBadge = () => {
    switch (systemHealth) {
      case 'healthy': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'degraded': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Show loading state if no data is available yet
  if (!safeConsolidatedMetrics && isLoading) {
    return (
      <div className="pt-20 pb-8 min-h-screen">
        <div className="px-4 mx-auto max-w-6xl">
          <Hero
            titleAnimation={TextAnimationType.TextRoll}
            title="System Status"
            subtitle="Monitor the health and performance of all system components"
            textAlign="center"
          />
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <RefreshCw className="mx-auto mb-4 w-8 h-8 text-cyan-500 animate-spin" />
              <p className="text-slate-400">Loading system status...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-8 min-h-screen">
      <div className="px-4 mx-auto max-w-6xl">
        {/* Header */}
        <Hero
          titleAnimation={TextAnimationType.TextRoll}
          title="System Status"
          subtitle="Monitor the health and performance of all system components"
          textAlign="center"
        />

        {/* System Overview */}
        <div className="mb-8">
          <Card className="border-gray-700 bg-gray-800/50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-3 items-center">
                  <h2 className="text-xl font-semibold text-white">System Overview</h2>
                  <span className={`px-3 py-1 text-sm rounded-full border ${getSystemHealthBadge()}`}>
                    {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
                  </span>
                </div>
                <button
                  onClick={handleRefreshAll}
                  disabled={isRefreshing}
                  className="flex gap-2 items-center px-4 py-2 ml-4 text-cyan-300 rounded-md border-2 border-cyan-300 transition-colors hover:text-slate-950 hover:bg-cyan-300 disabled:bg-cyan-800 disabled:border-cyan-800"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : ''}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getSystemHealthColor()}`}>
                    {systemReady ? 'Ready' : 'Not Ready'}
                  </div>
                  <div className="text-sm text-slate-400">System Status</div>
                </div>

                {safeSummary ? (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {safeSummary.healthyServices}/{safeSummary.totalServices}
                      </div>
                      <div className="text-sm text-slate-400">LLM Services Healthy</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {safeSummary.totalMemoryMB.toFixed(0)}MB
                      </div>
                      <div className="text-sm text-slate-400">Total LLM Memory</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-500">
                        --/--
                      </div>
                      <div className="text-sm text-slate-400">LLM Services Healthy</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-500">
                        --MB
                      </div>
                      <div className="text-sm text-slate-400">Total LLM Memory</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* LLM Services Section */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-white">LLM Services</h2>
          <div className="space-y-6">
            {/* Historical Metrics Chart - Full Width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full"
            >
              <Card className="border-gray-700 bg-gray-800/50 w-full">
                <div className="p-4 w-full">
                  <LLMUsageBarChart
                    showExpandedByDefault={true}
                    maxSamples={30} />
                </div>
              </Card>
            </motion.div>

            {/* Current Status Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 gap-4 lg:grid-cols-2"
            >
              <LightweightLLMStatus
                size="md"
                showLabel={true}
                className="border-gray-700 bg-blue-900/20"
                showDetails={true}
              />
              <ConsolidatedLLMMonitor
                size="md"
                showLabel={true}
                className="border-gray-700 bg-green-900/20"
              />
            </motion.div>
          </div>
        </div>

        {/* Infrastructure Services */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-white">Infrastructure Services</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ConvexStatusIndicator
                size="md"
                showLogs={true}
                className="border-gray-700 bg-gray-800/50"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <DockerStatus
                size="md"
                showLogs={true}
                className="border-gray-700 bg-gray-800/50"
              />
            </motion.div>
          </div>
        </div>

        {/* User Activity */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-white">User Activity</h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <UserCountIndicator
              size="md"
              showLogs={true}
              className="border-gray-700 bg-gray-800/50"
            />
          </motion.div>
        </div>

        {/* Debug Information */}
        {safeConsolidatedMetrics && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">Debug Information</h2>
            <Card className="border-gray-700 bg-gray-800/50">
              <div className="p-4">
                <div className="mb-2 text-sm text-slate-400">
                  Last Updated: {safeConsolidatedMetrics.timestamp ? new Date(safeConsolidatedMetrics.timestamp).toLocaleString() : 'Never'}
                </div>
                <div className="mb-2 text-sm text-slate-400">Loading: {isLoading ? 'Yes' : 'No'}</div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-slate-300 hover:text-white">Raw Metrics Data</summary>
                  <pre className="overflow-auto p-3 mt-2 text-xs rounded bg-slate-900">
                    {JSON.stringify(safeConsolidatedMetrics, null, 2)}
                  </pre>
                </details>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SystemStatusPage() {
  return (
    <ErrorBoundary>
      <SystemStatusPageContent />
    </ErrorBoundary>
  );
}

