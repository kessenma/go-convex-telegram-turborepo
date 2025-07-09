"use client";

import React, { memo } from 'react';
import CountUp from '../../../components/ui/text-animations/count-up';

interface DocumentStatsProps {
  stats: {
    totalDocuments: number;
    totalWords: number;
    totalSize: number;
    contentTypes: {
      markdown?: number;
      text?: number;
    };
  } | null;
  loading: boolean;
}

const DocumentStats = memo(function DocumentStats({ stats, loading }: DocumentStatsProps): React.ReactElement | null {

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 bg-gray-800 rounded-lg border border-gray-700 animate-pulse">
            <div className="mb-2 w-20 h-4 bg-gray-600 rounded"></div>
            <div className="w-16 h-8 bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats || stats.totalDocuments === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-4">
        {[
          { label: "Total Documents", value: "0" },
          { label: "Total Words", value: "0" },
          { label: "Total Size", value: "0 B" },
          { label: "Markdown Files", value: "0" }
        ].map((item, i) => (
          <div key={i} className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
            <div className="text-sm font-medium text-gray-500">{item.label}</div>
            <div className="text-2xl font-bold text-gray-500">{item.value}</div>
            <div className="text-xs text-gray-600 mt-1">No documents uploaded</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-4">
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-curious-cyan-400">Total Documents</div>
        <CountUp
          to={stats.totalDocuments}
          duration={2}
          className="text-2xl font-bold text-white"
        />
      </div>
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-curious-cyan-400">Total Words</div>
        <CountUp
          to={stats.totalWords}
          duration={2}
          className="text-2xl font-bold text-white"
          separator=","
        />
      </div>
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-curious-cyan-400">Total Size</div>
        <CountUp
          to={stats.totalSize}
          duration={2}
          className="text-2xl font-bold text-white"
        />
      </div>
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-curious-cyan-400">Markdown Files</div>
        <CountUp
          to={stats.contentTypes?.markdown || 0}
          duration={2}
          className="text-2xl font-bold text-white"
        />
      </div>
    </div>
  );
});

export { DocumentStats };