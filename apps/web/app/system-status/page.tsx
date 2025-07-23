"use client";

export const runtime = "edge";
export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { ConvexStatusIndicator } from "../../components/convex/convex-status-indicator";
import { LightweightLLMStatusIndicator } from "../../components/rag/lightweight-llm-status-indicator";
import { LLMStatusIndicator } from "../../components/rag/llm-status-indicator";
import { LLMStatusSummary } from "../../components/rag/llm-status-summary";
import { LLMUsageBarChart } from "../../components/rag/llm-usage-bar-chart";
import { DockerStatus } from "../../components/topNav/docker-status";
import { UserCountIndicator } from "../../components/user-count/user-count-indicator";
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
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-500" />
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white">System Overview</h2>
                  <span className={`px-3 py-1 rounded-full text-sm border ${getSystemHealthBadge()}`}>
                    {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
                  </span>
                </div>
                <button
                  onClick={handleRefreshAll}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh All'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <h2 className="text-2xl font-semibold text-white mb-4">LLM Services</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="border-gray-700 bg-gray-800/50">
              <div className="p-4">
                <LLMStatusSummary />
              </div>
            </Card>

            <Card className="border-gray-700 bg-gray-800/50">
              <div className="p-4">
                <LLMUsageBarChart />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <LightweightLLMStatusIndicator
                size="md"
                showLogs={true}
                className="bg-gray-800/50 border-gray-700"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <LLMStatusIndicator
                size="md"
                showLogs={true}
                className="bg-gray-800/50 border-gray-700"
              />
            </motion.div>
          </div>
        </div>

        {/* Infrastructure Services */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Infrastructure Services</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ConvexStatusIndicator
                size="md"
                showLogs={true}
                className="bg-gray-800/50 border-gray-700"
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
                className="bg-gray-800/50 border-gray-700"
              />
            </motion.div>
          </div>
        </div>

        {/* User Activity */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">User Activity</h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <UserCountIndicator
              size="md"
              showLogs={true}
              className="bg-gray-800/50 border-gray-700"
            />
          </motion.div>
        </div>

        {/* Debug Information */}
        {safeConsolidatedMetrics && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Debug Information</h2>
            <Card className="border-gray-700 bg-gray-800/50">
              <div className="p-4">
                <div className="text-sm text-slate-400 mb-2">
                  Last Updated: {safeConsolidatedMetrics.timestamp ? new Date(safeConsolidatedMetrics.timestamp).toLocaleString() : 'Never'}
                </div>
                <div className="text-sm text-slate-400 mb-2">Loading: {isLoading ? 'Yes' : 'No'}</div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-slate-300 hover:text-white">Raw Metrics Data</summary>
                  <pre className="mt-2 p-3 bg-slate-900 rounded text-xs overflow-auto">
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

