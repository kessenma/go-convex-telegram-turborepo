"use client";

import { BarChart3, Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { renderIcon } from "../../lib/icon-utils";
import { Card } from "../ui/card";

interface VectorEmbeddingProps {
  hasDocuments: boolean;
}

export function VectorEmbedding({
  hasDocuments,
}: VectorEmbeddingProps): React.ReactElement {
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingMessage, setEmbeddingMessage] = useState("");

  const handleGenerateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    setEmbeddingMessage("");

    try {
      const response = await fetch("/api/RAG/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setEmbeddingMessage(
          "Successfully generated embeddings for all documents!"
        );
      } else {
        const error = await response.text();
        setEmbeddingMessage(`Error: ${error}`);
      }
    } catch (error) {
      setEmbeddingMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  return (
    <Card className="mb-6 border-gray-700 bg-gray-800/50">
      <div className="p-6">
        <h3 className="mb-4 text-xl font-semibold text-white">
          Vector Embeddings
        </h3>
        <p className="mb-4 text-sm text-gray-300">
          Generate AI embeddings for your documents to enable semantic search.
          This process converts your text into vector representations for
          similarity matching.
        </p>

        {!hasDocuments ? (
          <div className="p-4 text-center rounded-lg border border-gray-600 bg-gray-700/50">
            <p className="text-gray-400">
              No documents available. Upload documents first to generate
              embeddings.
            </p>
          </div>
        ) : (
          <div className="flex gap-4 items-center">
            <button
              onClick={handleGenerateEmbeddings}
              disabled={isGeneratingEmbeddings}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                isGeneratingEmbeddings
                  ? "text-gray-400 bg-gray-600 border-gray-500 cursor-not-allowed"
                  : "text-white bg-curious-cyan-600 border-curious-cyan-500 hover:bg-curious-cyan-700"
              }`}
            >
              {isGeneratingEmbeddings ? (
                <>
                  {renderIcon(Loader2, { className: "w-4 h-4 animate-spin" })}
                  Generating...
                </>
              ) : (
                <>
                  {renderIcon(BarChart3, { className: "w-4 h-4" })}
                  Generate Embeddings
                </>
              )}
            </button>
            {embeddingMessage && (
              <span
                className={`text-sm ${
                  embeddingMessage.includes("Successfully")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {embeddingMessage}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
