"use client";

import React from "react";

interface BasicErrorScreenProps {
  title: string;
  message: string;
  bulletPoints?: string[];
  buttonText?: string;
  buttonHref?: string;
}

export function BasicErrorScreen({
  title,
  message,
  bulletPoints = [],
  buttonText = "Return to Homepage",
  buttonHref = "/"
}: BasicErrorScreenProps) {
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
      
      {/* Error Card */}
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent p-[1px] rounded-xl">
          <div className="bg-slate-900/90 backdrop-blur-sm border border-red-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-400">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              {buttonText}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BasicOfflineScreen() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 w-full h-full opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>
      
      {/* Error Card */}
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent p-[1px] rounded-xl">
          <div className="bg-slate-900/90 backdrop-blur-sm border border-blue-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-blue-400">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <h2 className="text-xl font-semibold text-blue-300">No Internet Connection</h2>
            </div>
            <p className="text-slate-300 mb-4">
              Please check your internet connection and try again.
            </p>
            <a
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Return to Homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BasicDatabaseErrorScreen() {
  return (
    <BasicErrorScreen
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

export function BasicRAGUploadErrorScreen() {
  return (
    <BasicErrorScreen
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