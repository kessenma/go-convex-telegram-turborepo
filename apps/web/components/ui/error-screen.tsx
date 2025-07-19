"use client";

import React from "react";
import { Card } from "./card";
import { BackgroundGradient } from "./backgrounds/background-gradient";
import { AlertTriangle, Home } from "lucide-react";
import { renderIcon } from "../../lib/icon-utils";
import RippleGrid from "./backgrounds/ripple-grid";

interface ErrorScreenProps {
  title: string;
  message: string;
  bulletPoints?: string[];
  buttonText?: string;
  buttonHref?: string;
  gridColor?: string;
  gradientColor?: "green" | "cyan" | "white" | "purple" | "orange" | "red";
}

export function ErrorScreen({
  title,
  message,
  bulletPoints = [],
  buttonText = "Return to Homepage",
  buttonHref = "/",
  gridColor = "#ff0000",
  gradientColor = "red"
}: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* RippleGrid Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <RippleGrid
          enableRainbow={false}
          gridColor={gridColor}
          rippleIntensity={0.08}
          gridSize={8.0}
          gridThickness={12.0}
          fadeDistance={1.8}
          vignetteStrength={2.5}
          glowIntensity={0.15}
          opacity={0.4}
          gridRotation={45}
          mouseInteraction={true}
          mouseInteractionRadius={1.5}
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

export function OfflineScreen() {
  return (
    <ErrorScreen
      title="No Internet Connection"
      message="Please check your internet connection and try again."
      gridColor="#3b82f6"
      gradientColor="cyan"
      bulletPoints={[]}
    />
  );
}

export function DatabaseErrorScreen() {
  return (
    <ErrorScreen
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

export function RAGUploadErrorScreen() {
  return (
    <ErrorScreen
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