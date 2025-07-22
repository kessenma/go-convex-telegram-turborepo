"use client";

// TODO: Replace with HTTP API calls when backend is ready
import { ArrowLeft, FileText } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { renderIcon } from "../../../lib/icon-utils";
import type { Document } from "../../../models/telegram";

export default function DocumentReader(): React.ReactElement {
  const router = useRouter();
  // TODO: Replace with HTTP API call to fetch document by ID
  const [document] = useState<Document | null>(null);

  if (!document) {
    return (
      <div className="flex justify-center items-center pt-20 pb-8 min-h-screen bg-gray-900">
        <div className="w-8 h-8 rounded-full border-t-2 border-b-2 animate-spin border-curious-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-8 min-h-screen bg-gray-900">
      <div className="px-4 mx-auto max-w-4xl">
        <div className="mb-6">
          <button
            onClick={() => router.push("/RAG-upload")}
            className="inline-flex items-center bg-transparent border-none transition-colors cursor-pointer text-curious-cyan-400 hover:text-curious-cyan-300"
          >
            {renderIcon(ArrowLeft, { className: "w-4 h-4 mr-2" })}
            Back to Documents
          </button>
        </div>

        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center mb-6">
            <div
              className={`p-3 rounded-lg mr-4 ${document.contentType === "markdown" ? "bg-curious-cyan-900 text-curious-cyan-300" : "bg-gray-700 text-gray-300"}`}
            >
              {renderIcon(FileText, { className: "w-6 h-6" })}
            </div>
            <div>
              <h1 className="mb-1 text-2xl font-semibold text-white">
                {document.title}
              </h1>
              <p className="text-sm text-gray-400">
                {document.wordCount.toLocaleString()} words •
                {new TextEncoder().encode(document.content).length} bytes •
                {new Date(document.uploadedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {document.summary && (
            <div className="p-4 mb-6 bg-gray-700 rounded-lg">
              <h2 className="mb-2 text-lg font-medium text-white">Summary</h2>
              <p className="text-gray-300">{document.summary}</p>
            </div>
          )}

          <div className="max-w-none prose prose-invert">
            {document.contentType === "markdown" ? (
              <div className="markdown-content">{document.content}</div>
            ) : (
              <pre className="p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap bg-gray-700 rounded-lg">
                {document.content}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
