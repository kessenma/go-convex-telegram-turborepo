'use client';

import { FileText, Eye } from 'lucide-react';
import React from 'react';
import { renderIcon } from '../../../lib/icon-utils';

interface Document {
  _id: string;
  title: string;
  [key: string]: any;
}

interface SelectedDocumentsListProps {
  documents: Document[];
  onDocumentClick: (documentId: string) => void;
}

export const SelectedDocumentsList = React.memo(function SelectedDocumentsList({
  documents,
  onDocumentClick
}: SelectedDocumentsListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {documents.map((doc, index) => (
        <div
          key={`doc-${doc._id}-${index}`}
          className="flex gap-2 items-center px-3 py-1 rounded-lg border transition-all duration-200 cursor-pointer bg-slate-700/50 border-cyan-500/20 hover:bg-slate-600/50"
          onClick={() => onDocumentClick(doc._id)}
          title="Click to view document"
        >
          {renderIcon(FileText, { className: "w-3 h-3 text-cyan-400" })}
          <span className="text-xs text-cyan-200 truncate max-w-[150px]">
            {doc.title}
          </span>
          {renderIcon(Eye, { className: "w-3 h-3 text-cyan-400/60" })}
        </div>
      ))}
    </div>
  );
});
