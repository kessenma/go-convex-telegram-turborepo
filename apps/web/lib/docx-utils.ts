'use client';

/**
 * DOCX TEXT EXTRACTION UTILITY
 * ============================
 * 
 * PURPOSE: Client-side DOCX text extraction for RAG document upload
 * 
 * FEATURES:
 * - Extracts text content from DOCX files using mammoth.js
 * - Preserves basic formatting and structure
 * - Handles errors gracefully
 * - Returns metadata about the DOCX (word count, etc.)
 * - Browser-compatible without native dependencies
 */

import * as mammoth from 'mammoth';

export interface DOCXExtractionResult {
  text: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    title?: string;
    author?: string;
    lastModified?: Date;
  };
}

export interface DOCXExtractionError {
  success: false;
  error: string;
  details?: string;
}

export type DOCXExtractionResponse = DOCXExtractionResult | DOCXExtractionError;

/**
 * Extract text content from a DOCX file
 * @param file - The DOCX file to extract text from
 * @returns Promise with extracted text and metadata or error
 */
export async function extractTextFromDOCX(file: File): Promise<DOCXExtractionResponse> {
  // Validate file type
  if (!file.type.includes('wordprocessingml') && 
      !file.type.includes('msword') && 
      !file.name.toLowerCase().endsWith('.docx') && 
      !file.name.toLowerCase().endsWith('.doc')) {
    return {
      success: false as const,
      error: 'Invalid file type. Please provide a DOCX or DOC file.',
    };
  }

  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract raw text using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    // Clean the extracted text
    const cleanedText = cleanDOCXText(result.value);
    
    // Calculate basic metadata
    const wordCount = countWords(cleanedText);
    const characterCount = cleanedText.length;
    
    const extractionResult: DOCXExtractionResult = {
      text: cleanedText,
      metadata: {
        wordCount,
        characterCount,
        title: file.name.replace(/\.[^/.]+$/, ''), // Use filename as title
        lastModified: file.lastModified ? new Date(file.lastModified) : undefined,
      },
    };
    
    return extractionResult;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return {
      success: false as const,
      error: 'Failed to extract text from DOCX file',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Clean and format extracted DOCX text
 * @param rawText - Raw text extracted from DOCX
 * @returns Cleaned and formatted text
 */
function cleanDOCXText(rawText: string): string {
  return rawText
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Normalize line breaks
    .replace(/\n\s*\n/g, '\n\n')
    // Remove leading/trailing whitespace
    .trim();
}

/**
 * Count words in text
 * @param text - Text to count words in
 * @returns Number of words
 */
function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Validate DOCX file before processing
 * @param file - File to validate
 * @returns Validation result
 */
export function validateDOCXFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.includes('wordprocessingml') && 
      !file.type.includes('msword') && 
      !file.name.toLowerCase().endsWith('.docx') && 
      !file.name.toLowerCase().endsWith('.doc')) {
    return {
      valid: false,
      error: 'File must be a DOCX or DOC file (.docx or .doc extension)',
    };
  }

  // Check file size (10MB limit for DOCX files)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'DOCX file size must be less than 10MB',
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'DOCX file appears to be empty',
    };
  }

  return { valid: true };
}

/**
 * Generate a summary from DOCX metadata
 * @param metadata - DOCX metadata
 * @returns Generated summary string
 */
export function generateDOCXSummary(metadata: DOCXExtractionResult['metadata']): string {
  if (!metadata) {
    return 'DOCX document';
  }

  const parts: string[] = [];

  if (metadata.wordCount) {
    parts.push(`${metadata.wordCount} word${metadata.wordCount > 1 ? 's' : ''}`);
  }

  if (metadata.title && metadata.title !== 'Untitled') {
    parts.push(`titled "${metadata.title}"`);
  }

  if (metadata.lastModified) {
    parts.push(`modified ${metadata.lastModified.toLocaleDateString()}`);
  }

  return parts.length > 0 ? `DOCX document (${parts.join(', ')})` : 'DOCX document';
}