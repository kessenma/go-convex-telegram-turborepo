"use client";

import React from 'react';

interface DocumentStatsProps {
  statsQuery: {
    totalDocuments: number;
    totalWords: number;
    totalSize: number;
    contentTypes: {
      markdown?: number;
      text?: number;
    };
  } | undefined;
}

export function DocumentStats({ statsQuery }: DocumentStatsProps): React.ReactElement | null {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!statsQuery) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-4">
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-curious-blue-400">Total Documents</div>
        <div className="text-2xl font-bold text-white">{statsQuery.totalDocuments}</div>
      </div>
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-curious-blue-400">Total Words</div>
        <div className="text-2xl font-bold text-white">{statsQuery.totalWords.toLocaleString()}</div>
      </div>
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-curious-blue-400">Total Size</div>
        <div className="text-2xl font-bold text-white">{formatFileSize(statsQuery.totalSize)}</div>
      </div>
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-curious-blue-400">Markdown Files</div>
        <div className="text-2xl font-bold text-white">{statsQuery.contentTypes.markdown || 0}</div>
      </div>
    </div>
  );
}