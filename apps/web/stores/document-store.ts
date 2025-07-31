"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UploadedDocument {
  _id: string;
  title: string;
  contentType: string;
  fileSize: number;
  wordCount: number;
  uploadedAt: number;
  summary?: string;
  isActive: boolean;
}

interface DocumentStats {
  totalDocuments: number;
  totalWords: number;
  totalSize: number;
  contentTypes: {
    markdown?: number;
    text?: number;
  };
}

interface DocumentStore {
  // State
  documents: UploadedDocument[];
  stats: DocumentStats | null;
  loading: boolean;
  deletingIds: Set<string>;

  // Actions
  setDocuments: (documents: UploadedDocument[]) => void;
  setStats: (stats: DocumentStats | null) => void;
  setLoading: (loading: boolean) => void;
  addDeletingId: (id: string) => void;
  removeDeletingId: (id: string) => void;

  // Optimistic updates
  optimisticDeleteDocument: (documentId: string) => void;
  revertOptimisticDelete: (document: UploadedDocument) => void;

  // API actions
  deleteDocument: (documentId: string) => Promise<boolean>;
}

export const useDocumentStore = create<DocumentStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      documents: [],
      stats: null,
      loading: false,
      deletingIds: new Set<string>(),

      // Basic setters
      setDocuments: (documents) => set({ documents }, false, "setDocuments"),
      setStats: (stats) => set({ stats }, false, "setStats"),
      setLoading: (loading) => set({ loading }, false, "setLoading"),

      addDeletingId: (id) =>
        set(
          (state) => ({ deletingIds: new Set(state.deletingIds).add(id) }),
          false,
          "addDeletingId"
        ),

      removeDeletingId: (id) =>
        set(
          (state) => {
            const newSet = new Set(state.deletingIds);
            newSet.delete(id);
            return { deletingIds: newSet };
          },
          false,
          "removeDeletingId"
        ),

      // Optimistic updates
      optimisticDeleteDocument: (documentId) => {
        const { documents, stats } = get();
        const documentToDelete = documents.find(
          (doc) => doc._id === documentId
        );

        if (!documentToDelete) return;

        // Remove document from list
        const updatedDocuments = documents.filter(
          (doc) => doc._id !== documentId
        );

        // Update stats optimistically
        let updatedStats = stats;
        if (stats) {
          updatedStats = {
            ...stats,
            totalDocuments: Math.max(0, stats.totalDocuments - 1),
            totalWords: Math.max(
              0,
              stats.totalWords - documentToDelete.wordCount
            ),
            totalSize: Math.max(0, stats.totalSize - documentToDelete.fileSize),
            contentTypes: {
              ...stats.contentTypes,
              [documentToDelete.contentType]: Math.max(
                0,
                (stats.contentTypes[
                  documentToDelete.contentType as keyof typeof stats.contentTypes
                ] || 0) - 1
              ),
            },
          };
        }

        set(
          { documents: updatedDocuments, stats: updatedStats },
          false,
          "optimisticDeleteDocument"
        );
      },

      revertOptimisticDelete: (document) => {
        const { documents, stats } = get();

        // Add document back to list
        const updatedDocuments = [...documents, document].sort(
          (a, b) => b.uploadedAt - a.uploadedAt
        );

        // Revert stats
        let updatedStats = stats;
        if (stats) {
          updatedStats = {
            ...stats,
            totalDocuments: stats.totalDocuments + 1,
            totalWords: stats.totalWords + document.wordCount,
            totalSize: stats.totalSize + document.fileSize,
            contentTypes: {
              ...stats.contentTypes,
              [document.contentType]:
                (stats.contentTypes[
                  document.contentType as keyof typeof stats.contentTypes
                ] || 0) + 1,
            },
          };
        }

        set(
          { documents: updatedDocuments, stats: updatedStats },
          false,
          "revertOptimisticDelete"
        );
      },

      // API actions
      deleteDocument: async (documentId) => {
        console.log("🗑️ deleteDocument called with ID:", documentId);
        console.log("🗑️ Document ID type:", typeof documentId);
        console.log("🗑️ Document ID length:", documentId.length);

        // Get document details before deletion for the toast
        const originalDocuments = get().documents;
        const documentToDelete = originalDocuments.find(doc => doc._id === documentId);
        const documentTitle = documentToDelete?.title || "Unknown Document";
        
        console.log("📋 Original documents count:", originalDocuments.length);

        set((state) => ({
          documents: state.documents.filter((doc) => doc._id !== documentId),
        }));
        console.log(
          "📋 Documents after optimistic update:",
          get().documents.length
        );

        try {
          const deleteUrl = `/api/documents/${documentId}`;
          console.log("🌐 Making DELETE request to:", deleteUrl);

          const response = await fetch(deleteUrl, {
            method: "DELETE",
          });

          console.log(
            "📡 DELETE response status:",
            response.status,
            response.statusText
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ DELETE request failed:", errorText);
            throw new Error(
              `Failed to delete document: ${response.statusText}`
            );
          }

          const responseData = await response.json();
          console.log("✅ DELETE response data:", responseData);

          // Import toast dynamically to avoid SSR issues
          const { toast } = await import("sonner");
          toast.success(`Successfully deleted "${documentTitle}"`);

          return true;
        } catch (error) {
          console.error("❌ Error in deleteDocument:", error);
          console.error(
            "❌ Document not found for deletion:",
            JSON.stringify(documentId)
          );
          
          // Revert optimistic update on error
          set({ documents: originalDocuments });
          
          // Import toast dynamically to avoid SSR issues
          const { toast } = await import("sonner");
          toast.error(`Failed to delete "${documentTitle}"`);
          
          throw error;
        }
      },
    }),
    {
      name: "document-store",
    }
  )
);

export type { UploadedDocument, DocumentStats };
