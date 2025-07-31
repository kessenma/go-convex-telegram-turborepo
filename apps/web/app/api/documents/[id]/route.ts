import { type NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../generated-convex";

const CONVEX_HTTP_URL = process.env.CONVEX_HTTP_URL || "http://localhost:3211";
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const documentId = resolvedParams?.id;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // First, get the document details before deletion for the notification
    let documentTitle = "Unknown Document";
    try {
      const docResponse = await fetch(`${CONVEX_HTTP_URL}/api/documents/${documentId}`);
      if (docResponse.ok) {
        const docData = await docResponse.json();
        documentTitle = docData.title || documentTitle;
      }
    } catch (error) {
      console.warn("Could not fetch document details for notification:", error);
    }

    const response = await fetch(`${CONVEX_HTTP_URL}/api/documents/${documentId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Create a notification for the successful deletion using Convex mutation
    try {
      console.log("🔔 Creating deletion notification for:", documentTitle);
      const notificationId = await convex.mutation(api.notifications.createDocumentDeletionNotification, {
        documentTitle,
        documentId: documentId as any, // Type assertion for the ID
        source: "document_management",
      });
      console.log("✅ Notification created with ID:", notificationId);
    } catch (notificationError) {
      console.error("❌ Failed to create deletion notification via Convex:", notificationError);
      
      // Fallback to HTTP API
      try {
        console.log("🔄 Trying HTTP API fallback for notification");
        await fetch(`${CONVEX_HTTP_URL}/api/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "document_deleted",
            title: "Document Deleted",
            message: `Successfully deleted "${documentTitle}"`,
            documentId: documentId,
            source: "document_management",
            metadata: JSON.stringify({
              documentTitle,
              deletedAt: new Date().toISOString(),
            }),
          }),
        });
        console.log("✅ Notification created via HTTP API fallback");
      } catch (httpError) {
        console.error("❌ HTTP API fallback also failed:", httpError);
      }
    }
    
    return NextResponse.json({ success: true, documentTitle });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const documentId = resolvedParams?.id;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${CONVEX_HTTP_URL}/api/documents/${documentId}`);
    
    if (response.status === 404) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const document = await response.json();
    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}
