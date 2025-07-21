"use client";

/**
 * PDF TEXT EXTRACTION UTILITY
 * ===========================
 *
 * PURPOSE: Client-side PDF text extraction for RAG document upload
 *
 * FEATURES:
 * - Extracts text content from PDF files using PDF.js
 * - Preserves basic formatting and structure
 * - Handles errors gracefully
 * - Returns metadata about the PDF (page count, etc.)
 * - Browser-compatible without native dependencies
 */

import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface PDFExtractionResult {
  text: string;
  metadata: {
    pageCount: number;
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export interface PDFExtractionError {
  success: false;
  error: string;
  details?: string;
}

export type PDFExtractionResponse = PDFExtractionResult | PDFExtractionError;

/**
 * Extract text content from a PDF file
 * @param file - The PDF file to extract text from
 * @returns Promise with extracted text and metadata or error
 */
export async function extractTextFromPDF(
  file: File
): Promise<PDFExtractionResponse> {
  // Validate file type
  if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    return {
      success: false as const,
      error: "Invalid file type. Please provide a PDF file.",
    };
  }

  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Extract text from all pages
    const textPromises: Promise<string>[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const pagePromise = pdf.getPage(pageNum).then(async (page) => {
        const textContent = await page.getTextContent();
        return textContent.items.map((item: any) => item.str).join(" ");
      });
      textPromises.push(pagePromise);
    }

    // Wait for all pages to be processed
    const pageTexts = await Promise.all(textPromises);
    const fullText = pageTexts.join("\n\n");

    // Clean the extracted text
    const cleanedText = cleanPDFText(fullText);

    // Get PDF metadata
    const metadata = await pdf.getMetadata();
    const info = metadata.info as any;

    const result: PDFExtractionResult = {
      text: cleanedText,
      metadata: {
        pageCount: pdf.numPages,
        title: info?.Title,
        author: info?.Author,
        creator: info?.Creator,
        producer: info?.Producer,
        creationDate: info?.CreationDate
          ? new Date(info.CreationDate)
          : undefined,
        modificationDate: info?.ModDate ? new Date(info.ModDate) : undefined,
      },
    };

    return result;
  } catch (error) {
    console.error("PDF extraction error:", error);
    return {
      success: false as const,
      error: "Failed to extract text from PDF",
      details:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Clean and format extracted PDF text
 * @param rawText - Raw text extracted from PDF
 * @returns Cleaned and formatted text
 */
function cleanPDFText(rawText: string): string {
  return (
    rawText
      // Remove excessive whitespace
      .replace(/\s+/g, " ")
      // Remove page breaks and form feeds
      .replace(/[\f\r]/g, "")
      // Normalize line breaks
      .replace(/\n\s*\n/g, "\n\n")
      // Remove leading/trailing whitespace
      .trim()
  );
}

/**
 * Validate PDF file before processing
 * @param file - File to validate
 * @returns Validation result
 */
export function validatePDFFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    return {
      valid: false,
      error: "File must be a PDF (.pdf extension)",
    };
  }

  // Check file size (10MB limit for PDFs)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "PDF file size must be less than 10MB",
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: "PDF file appears to be empty",
    };
  }

  return { valid: true };
}

/**
 * Generate a summary from PDF metadata
 * @param metadata - PDF metadata
 * @returns Generated summary string
 */
export function generatePDFSummary(
  metadata: PDFExtractionResult["metadata"]
): string {
  if (!metadata) {
    return "PDF document";
  }

  const parts: string[] = [];

  if (metadata.pageCount) {
    parts.push(
      `${metadata.pageCount} page${metadata.pageCount > 1 ? "s" : ""}`
    );
  }

  if (metadata.author) {
    parts.push(`by ${metadata.author}`);
  }

  if (metadata.creationDate) {
    parts.push(`created ${metadata.creationDate.toLocaleDateString()}`);
  }

  return parts.length > 0
    ? `PDF document (${parts.join(", ")})`
    : "PDF document";
}
