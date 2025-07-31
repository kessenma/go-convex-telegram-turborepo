"use client";

import { useQuery } from "convex/react";
import { useCallback } from "react";
import { api } from "../generated-convex";
import { useDocumentStore } from "../stores/document-store";

/**
 * Custom hook for document operations with optimized data fetching and state management
 */
export function useDocumentOperations(limit: number = 10) {
  // Convex queries
  const documentsQuery = useQuery(api.documents.getAllDocuments, { limit });
  const statsQuery = useQuery(api.documents.getDocumentStats);

  // Zustand store
  const {
    documents: storeDocuments,
    stats: storeStats,
    loading,
    deletingIds,
    setDocuments,
    setStats,
    setLoading,
    deleteDocument,
  } = useDocumentStore();

  // Derived state
  const documents = documentsQuery?.page || [];
  const loadingDocuments = documentsQuery === undefined;
  const loadingStats = statsQuery === undefined;

  // Use store data if available, fallback to query data
  const displayDocuments =
    storeDocuments.length > 0 ? storeDocuments : documents;
  const displayStats = storeStats || statsQuery;

  // Sync data with store when queries update
  const syncData = useCallback(() => {
    if (documents.length > 0) {
      setDocuments(documents);
    }
    if (statsQuery) {
      setStats(statsQuery);
    }
    setLoading(loadingDocuments || loadingStats);
  }, [
    documents,
    statsQuery,
    loadingDocuments,
    loadingStats,
    setDocuments,
    setStats,
    setLoading,
  ]);

  // Optimized delete operation
  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      try {
        await deleteDocument(documentId);
        return true;
      } catch (error) {
        console.error("Failed to delete document:", error);
        return false;
      }
    },
    [deleteDocument]
  );

  return {
    // Data
    documents: displayDocuments,
    stats: displayStats,

    // Loading states
    loadingDocuments,
    loadingStats,
    loading,

    // UI state
    deletingIds,

    // Operations
    deleteDocument: handleDeleteDocument,
    syncData,

    // Raw query data (for debugging or special cases)
    rawDocuments: documents,
    rawStats: statsQuery,
  };
}
