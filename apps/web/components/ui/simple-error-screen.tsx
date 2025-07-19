"use client";

import React from "react";
import { Card } from "./card";
import { BackgroundGradient } from "./backgrounds/background-gradient";
import { AlertTriangle, Home } from "lucide-react";
import { renderIcon } from "../../lib/icon-utils";

interface SimpleErrorScreenProps {
  title: string;
  message: string;
  bulletPoints?: string[];
  buttonText?: string;
  buttonHref?: string;
  gradientColor?: "green" | "cyan" | "white" | "purple" | "orange" | "red";
}

export function SimpleErrorScreen({
  title,
  message,
  bulletPoints = [],
  buttonText = "Return to Homepage",
  buttonHref = "/",
  gradientColor = "red"
}: SimpleErrorScreenProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 w-full h-full opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 0, 0, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 0, 0, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>
      
      {/* Error Card with Background Gradient */}
      <div className="relative z-10">
        <BackgroundGradient color={gradientColor} className="rounded-xl">
          <Card className="max-w-md w-full p-6 bg-slate-900/90 border-red-500/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              {renderIcon(AlertTriangle, { className: "w-6 h-6 text-red-400" })}
              <h2 className="text-xl font-semibold text-red-300">{title}</h2>
            </div>
            <p className="text-red-200 mb-4">
              {message}
            </p>
            {bulletPoints.length > 0 && (
              <div className="text-sm text-red-300 mb-6">
                <p>This could be due to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-red-200">
                  {bulletPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            <a
              href={buttonHref}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {renderIcon(Home, { className: "w-4 h-4" })}
              {buttonText}
            </a>
          </Card>
        </BackgroundGradient>
      </div>
    </div>
  );
}

export function SimpleOfflineScreen() {
  return (
    <SimpleErrorScreen
      title="No Internet Connection"
      message="Please check your internet connection and try again."
      gradientColor="cyan"
      bulletPoints={[]}
    />
  );
}

export function SimpleDatabaseErrorScreen() {
  return (
    <SimpleErrorScreen
      title="Database Connection Error"
      message="Unable to connect to the database. The application is temporarily unavailable."
      bulletPoints={[
        "Database server is temporarily down",
        "Network connectivity issues",
        "Configuration problems"
      ]}
    />
  );
}

export function SimpleRAGUploadErrorScreen() {
  return (
    <SimpleErrorScreen
      title="RAG Upload Page Not Available"
      message="The RAG upload functionality is temporarily unavailable due to database connectivity issues."
      bulletPoints={[
        "Database server is temporarily down",
        "Network connectivity issues",
        "Configuration problems"
      ]}
    />
  );
}