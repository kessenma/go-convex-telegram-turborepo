"use client";

import type React from "react";
import CountUp from "../ui/text-animations/count-up";

interface DocumentStatsProps {
  stats: {
    totalDocuments: number;
    totalWords: number;
    totalSize: number;
    estimatedLines: number;
    fileTypes: {
      markdown?: number;
      pdf?: number;
      word?: number;
      text?: number;
      other?: number;
    };
    contentTypes: {
      markdown?: number;
      text?: number;
    };
    totalEmbeddings: number;
    totalChunks: number;
    documentsWithEmbeddings: number;
    documentsWithoutEmbeddings: number;
    embeddingCoverage: number;
    embeddingModels: Record<string, number>;
    recentActivity: {
      uploadsLast24h: number;
      embeddingsLast24h: number;
    };
  } | null;
  loading: boolean;
}

export function DocumentStats({
  stats,
  loading,
}: DocumentStatsProps): React.ReactElement | null {
  if (loading) {
    return (
      <div className="space-y-6 mb-8">
        {/* Main Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-gray-800 rounded-lg border border-gray-700 animate-pulse"
            >
              <div className="mb-2 w-20 h-4 bg-gray-600 rounded"></div>
              <div className="w-16 h-8 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
        {/* File Types & Embeddings */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i + 4}
              className="p-4 bg-gray-800 rounded-lg border border-gray-700 animate-pulse"
            >
              <div className="mb-2 w-20 h-4 bg-gray-600 rounded"></div>
              <div className="w-16 h-8 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.totalDocuments === 0) {
    return (
      <div className="space-y-6 mb-8">
        {/* Main Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: "Total Documents", value: "0" },
            { label: "Total Words", value: "0" },
            { label: "Total Size", value: "0 B" },
            { label: "Estimated Lines", value: "0" },
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 bg-gray-800/50 rounded-lg border border-gray-600"
            >
              <div className="text-sm font-medium text-gray-500">
                {item.label}
              </div>
              <div className="text-2xl font-bold text-gray-500">{item.value}</div>
              <div className="text-xs text-gray-600 mt-1">
                No documents uploaded
              </div>
            </div>
          ))}
        </div>
        {/* File Types & Embeddings */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: "Markdown Files", value: "0" },
            { label: "PDF Files", value: "0" },
            { label: "Word Documents", value: "0" },
            { label: "Embeddings", value: "0" },
          ].map((item, i) => (
            <div
              key={i + 4}
              className="p-4 bg-gray-800/50 rounded-lg border border-gray-600"
            >
              <div className="text-sm font-medium text-gray-500">
                {item.label}
              </div>
              <div className="text-2xl font-bold text-gray-500">{item.value}</div>
              <div className="text-xs text-gray-600 mt-1">
                No documents uploaded
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Main Document Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-curious-cyan-400">
            Total Documents
          </div>
          <CountUp
            to={stats.totalDocuments}
            duration={2}
            className="text-2xl font-bold text-white"
          />
          <div className="text-xs text-gray-400 mt-1">
            {stats.recentActivity?.uploadsLast24h || 0} uploaded today
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-curious-cyan-400">
            Total Words
          </div>
          <CountUp
            to={stats.totalWords}
            duration={2}
            className="text-2xl font-bold text-white"
            separator=","
          />
          <div className="text-xs text-gray-400 mt-1">
            ~{Math.round(stats.totalWords / 250)} pages
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-curious-cyan-400">
            Total Size
          </div>
          <div className="text-2xl font-bold text-white">
            <CountUp
              to={Math.round(stats.totalSize / 1024)}
              duration={2}
              separator=","
            /> KB
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {Math.round(stats.totalSize / stats.totalDocuments / 1024)} KB avg
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-curious-cyan-400">
            Estimated Lines
          </div>
          <CountUp
            to={stats.estimatedLines}
            duration={2}
            className="text-2xl font-bold text-white"
            separator=","
          />
          <div className="text-xs text-gray-400 mt-1">
            ~12 words per line
          </div>
        </div>
      </div>

      {/* File Types */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-green-400">
            Markdown Files
          </div>
          <CountUp
            to={stats.fileTypes?.markdown || 0}
            duration={2}
            className="text-2xl font-bold text-white"
          />
          <div className="text-xs text-gray-400 mt-1">
            {stats.totalDocuments > 0 ? Math.round(((stats.fileTypes?.markdown || 0) / stats.totalDocuments) * 100) : 0}% of total
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-red-400">
            PDF Files
          </div>
          <CountUp
            to={stats.fileTypes?.pdf || 0}
            duration={2}
            className="text-2xl font-bold text-white"
          />
          <div className="text-xs text-gray-400 mt-1">
            {stats.totalDocuments > 0 ? Math.round(((stats.fileTypes?.pdf || 0) / stats.totalDocuments) * 100) : 0}% of total
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-blue-400">
            Word Documents
          </div>
          <CountUp
            to={stats.fileTypes?.word || 0}
            duration={2}
            className="text-2xl font-bold text-white"
          />
          <div className="text-xs text-gray-400 mt-1">
            {stats.totalDocuments > 0 ? Math.round(((stats.fileTypes?.word || 0) / stats.totalDocuments) * 100) : 0}% of total
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-yellow-400">
            Text Files
          </div>
          <CountUp
            to={stats.fileTypes?.text || 0}
            duration={2}
            className="text-2xl font-bold text-white"
          />
          <div className="text-xs text-gray-400 mt-1">
            {stats.totalDocuments > 0 ? Math.round(((stats.fileTypes?.text || 0) / stats.totalDocuments) * 100) : 0}% of total
          </div>
        </div>
      </div>

      {/* Embedding Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-purple-400">
            Total Embeddings
          </div>
          <CountUp
            to={stats.totalEmbeddings}
            duration={2}
            className="text-2xl font-bold text-white"
            separator=","
          />
          <div className="text-xs text-gray-400 mt-1">
            {stats.recentActivity?.embeddingsLast24h || 0} created today
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-purple-400">
            Documents with Embeddings
          </div>
          <CountUp
            to={stats.documentsWithEmbeddings}
            duration={2}
            className="text-2xl font-bold text-white"
          />
          <div className="text-xs text-gray-400 mt-1">
            {stats.embeddingCoverage}% coverage
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-purple-400">
            Total Chunks
          </div>
          <CountUp
            to={stats.totalChunks}
            duration={2}
            className="text-2xl font-bold text-white"
            separator=","
          />
          <div className="text-xs text-gray-400 mt-1">
            {stats.documentsWithEmbeddings > 0 ? Math.round(stats.totalChunks / stats.documentsWithEmbeddings) : 0} avg per doc
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-purple-400">
            Pending Embeddings
          </div>
          <CountUp
            to={stats.documentsWithoutEmbeddings}
            duration={2}
            className="text-2xl font-bold text-white"
          />
          <div className="text-xs text-gray-400 mt-1">
            {stats.totalDocuments > 0 ? Math.round((stats.documentsWithoutEmbeddings / stats.totalDocuments) * 100) : 0}% remaining
          </div>
        </div>
      </div>
    </div>
  );
}
