"use client";

import React from "react";

interface AnimatedBotIconProps {
  className?: string;
  state?: "analyzing" | "processing" | "generating" | "finalizing" | "idle";
  [key: string]: any;
}

export function AnimatedBotIcon({ 
  className = "", 
  state = "idle", 
  ...props 
}: AnimatedBotIconProps): React.ReactElement {
  // Define colors for different states
  const getStateColor = () => {
    switch (state) {
      case "analyzing":
        return "cyan";
      case "processing":
        return "blue";
      case "generating":
        return "purple";
      case "finalizing":
        return "emerald";
      default:
        return "white";
    }
  };

  const stateColor = getStateColor();

  return (
    <div className={className} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`lucide lucide-bot-message-square-icon lucide-bot-message-square state-${state}`}
      >
        <style>
          {`
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            .blink-eye {
              animation: blink 1.5s infinite ease-in-out;
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            .state-analyzing { stroke: rgb(6, 182, 212); }
            .state-processing { stroke: rgb(59, 130, 246); }
            .state-generating { stroke: rgb(168, 85, 247); }
            .state-finalizing { stroke: rgb(16, 185, 129); }
            .state-analyzing .bot-body,
            .state-processing .bot-body,
            .state-generating .bot-body,
            .state-finalizing .bot-body {
              animation: pulse 2s infinite ease-in-out;
            }
            @keyframes thinking {
              0%, 100% { stroke-dashoffset: 0; }
              50% { stroke-dashoffset: 10; }
            }
            .state-analyzing .antenna {
              stroke-dasharray: 4;
              animation: thinking 1.5s infinite linear;
            }
          `}
        </style>
        <path d="M12 6V2H8" className="antenna" />
        <path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" className="bot-body" />
        <path d="M2 12h2" />
        <path d="M9 11v2" className="blink-eye" />
        <path d="M15 11v2" className="blink-eye" />
        <path d="M20 12h2" />
      </svg>
    </div>
  );
}