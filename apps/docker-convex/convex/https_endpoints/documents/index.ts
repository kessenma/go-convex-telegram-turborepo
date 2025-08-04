/*
 * DOCUMENT API ENDPOINTS
 * apps/docker-convex/convex/https-endpoints/documents/index.ts
 * =====================
 * 
 * RAG document management endpoints for CRUD operations.
 */

import { httpAction } from "../../_generated/server";
import { api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { errorResponse, successResponse } from "../shared/utils";
import { saveDocumentToDb, SaveDocumentInput, saveDocumentsBatchToDb, SaveDocumentsBatchInput, getAllDocumentsFromDb, GetAllDocumentsInput, getDocumentByIdFromDb, GetDocumentByIdInput, getDocumentsByIdsFromDb, GetDocumentsByIdsInput, getDocumentStatsFromDb, GetDocumentStatsInput, getEnhancedDocumentStatsFromDb, GetEnhancedDocumentStatsInput, deleteDocumentFromDb, DeleteDocumentInput } from "../../documents";

// Save a single document
type SaveDocumentArgs = {
  title: string;
  content: string;
  contentType: string;
  tags?: string[];
  summary?: string;
};

export const saveDocumentAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    if (!body.title || !body.content || !body.contentType) {
      return errorResponse("Missing required fields: title, content, contentType", 400);
    }

    const args: SaveDocumentInput = {
      title: body.title,
      content: body.content,
      contentType: body.contentType,
      tags: body.tags,
      summary: body.summary
    };

    const documentId = await saveDocumentToDb(ctx, args);

    return successResponse({ success: true, documentId }, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// Save multiple documents in batch
export const saveDocumentsBatchAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    // Validate required fields
    if (!body.documents || !Array.isArray(body.documents)) {
      return errorResponse("Missing or invalid documents array", 400);
    }
    // Validate each document
    for (let i = 0; i < body.documents.length; i++) {
      const doc = body.documents[i];
      if (!doc.title || !doc.content || !doc.contentType) {
        return errorResponse(`Document ${i + 1}: Missing required fields: title, content, contentType`, 400);
      }
      if (!["markdown", "text"].includes(doc.contentType)) {
        return errorResponse(`Document ${i + 1}: contentType must be 'markdown' or 'text'`, 400);
      }
      if (doc.content.length > 1024 * 1024) {
        return errorResponse(`Document ${i + 1}: Content too large. Maximum size is 1MB`, 400);
      }
    }
    const batchResult = await saveDocumentsBatchToDb(ctx, { documents: body.documents });
    return successResponse(batchResult, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// Get all documents with pagination
export const getDocumentsAPI = httpAction(async (ctx, request) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor") || undefined;
    const paginatedDocs = await getAllDocumentsFromDb(ctx, { limit, cursor });
    return successResponse(paginatedDocs);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// Get document by ID
export const getDocumentByIdAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    let documentId: string | undefined;
    // Check if documentId is in query parameters (for /api/documents/by-id route)
    const queryDocumentId = url.searchParams.get("documentId");
    if (queryDocumentId) {
      documentId = queryDocumentId;
    } else {
      // Extract from path (for /api/documents/{id} route)
      const pathParts = url.pathname.split('/');
      documentId = pathParts[pathParts.length - 1];
    }
    if (!documentId) {
      return errorResponse("Missing documentId in path or query parameter", 400);
    }
    const foundDoc = await getDocumentByIdFromDb(ctx, { documentId });
    if (!foundDoc) {
      return errorResponse("Document not found", 404);
    }
    return successResponse(foundDoc);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// Get multiple documents by IDs
export const getDocumentsByIdsAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { documentIds } = body;
    if (!documentIds || !Array.isArray(documentIds)) {
      return errorResponse("Missing or invalid documentIds array", 400);
    }
    const documents = await getDocumentsByIdsFromDb(ctx, { documentIds });
    return successResponse({
      success: true,
      documents,
      count: documents.length
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// Delete document by ID
export const deleteDocumentAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const documentId = pathParts[pathParts.length - 1];
    if (!documentId) {
      return errorResponse("Missing documentId in path", 400);
    }
    await deleteDocumentFromDb(ctx, { documentId });
    console.log("Document deletion temporarily disabled:", documentId);
    return successResponse({ success: true, message: "Document deletion temporarily disabled" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// Get document statistics
export const getDocumentStatsAPI = httpAction(async (ctx, request) => {
  try {
    const documentStats = await getDocumentStatsFromDb(ctx, {});
    return successResponse(documentStats);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// Get enhanced document statistics with embeddings and file types
export const getEnhancedDocumentStatsAPI = httpAction(async (ctx, request) => {
  try {
    const stats = await getEnhancedDocumentStatsFromDb(ctx, {});
    return successResponse(stats);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});