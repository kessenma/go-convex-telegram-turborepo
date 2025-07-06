"use client";

import React, { useState } from "react";
import { Search, Loader2, FileText, Calendar, Hash } from "lucide-react";
import { renderIcon } from "../../lib/icon-utils";
import { Card } from "../../components/ui/card";
import { Button as MovingButton } from "../../components/ui/moving-border";

interface SearchResult {
  _id: string;
  _score: number;
  title: string;
  content: string;
  contentType: string;
  fileSize: number;
  uploadedAt: number;
  wordCount: number;
  summary?: string;
}

interface VectorSearchProps {
  className?: string;
  hasDocuments?: boolean;
}

export function VectorSearch({ className, hasDocuments = true }: VectorSearchProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchMessage('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setSearchMessage('');
    setHasSearched(true);

    try {
      const response = await fetch(`/api/RAG/search?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();

      if (response.ok && data.success) {
        setResults(data.results || []);
        if (data.results.length === 0) {
          setSearchMessage('No documents found matching your query');
        } else {
          setSearchMessage(`Found ${data.results.length} relevant documents`);
        }
      } else {
        setSearchMessage(data.error || 'Search failed');
        setResults([]);
      }
    } catch (error) {
      setSearchMessage('Network error. Please try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={className}>
      <Card className="p-6 border-gray-700 bg-gray-800/50">
        <h3 className="mb-4 text-xl font-semibold text-white">Vector Search</h3>
        <p className="mb-4 text-sm text-gray-300">
          Test semantic search across your uploaded documents using AI embeddings.
        </p>
        
        {!hasDocuments ? (
          <div className="p-4 text-center rounded-lg border border-gray-600 bg-gray-700/50">
            <div className="mb-4">
              {renderIcon(Search, { className: "mx-auto w-12 h-12 text-gray-500" })}
            </div>
            <p className="text-gray-400">No documents available for search.</p>
            <p className="text-sm text-gray-500">Upload documents first to enable vector search.</p>
          </div>
        ) : (
          <>
        {/* Search Input */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            {renderIcon(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" })}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search your documents... (e.g., 'machine learning concepts')"
              className="py-2 pr-3 pl-10 w-full placeholder-gray-400 text-white bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-curious-cyan-500 focus:border-transparent"
              disabled={isSearching}
            />
          </div>
          <MovingButton
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="bg-slate-900/[0.8] text-white"
            containerClassName="w-auto min-w-[100px]"
            borderClassName="bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]"
          >
            {isSearching ? (
              <span className="flex gap-2 items-center">
                {renderIcon(Loader2, { className: "w-4 h-4 animate-spin" })}
                Searching...
              </span>
            ) : (
              'Search'
            )}
          </MovingButton>
        </div>

        {/* Search Message */}
        {searchMessage && (
          <div className={`mb-4 p-3 rounded-lg ${
            results.length > 0 ? 'bg-green-900/20 text-green-300' : 'bg-yellow-900/20 text-yellow-300'
          }`}>
            {searchMessage}
          </div>
        )}

        {/* Search Results */}
        {hasSearched && results.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">Search Results</h4>
            {results.map((result, index) => (
              <Card key={result._id} className="p-4 border-gray-600 bg-gray-700/50">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="text-lg font-medium text-white">{result.title}</h5>
                  <div className="flex gap-2 items-center text-xs text-gray-400">
                    <span className="px-2 py-1 rounded bg-curious-cyan-900/30 text-curious-cyan-300">
                      Score: {(result._score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                {result.summary && (
                  <p className="mb-2 text-sm italic text-gray-300">{result.summary}</p>
                )}
                
                <p className="mb-3 text-sm text-gray-300">
                  {truncateContent(result.content)}
                </p>
                
                <div className="flex gap-4 items-center text-xs text-gray-400">
                  <div className="flex gap-1 items-center">
                    {renderIcon(FileText, { className: "w-3 h-3" })}
                    <span>{result.contentType}</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    {renderIcon(Hash, { className: "w-3 h-3" })}
                    <span>{result.wordCount} words</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    {renderIcon(Calendar, { className: "w-3 h-3" })}
                    <span>{formatDate(result.uploadedAt)}</span>
                  </div>
                  <span>{formatFileSize(result.fileSize)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* No Results State */}
        {hasSearched && results.length === 0 && !isSearching && (
          <div className="py-8 text-center">
            <div className="mb-4">
              {renderIcon(Search, { className: "mx-auto w-12 h-12 text-gray-500" })}
            </div>
            <p className="text-gray-400">No documents found matching your search.</p>
            <p className="text-sm text-gray-500">Try different keywords or upload more documents.</p>
          </div>
        )}
        </>
        )}
      </Card>
    </div>
  );
}