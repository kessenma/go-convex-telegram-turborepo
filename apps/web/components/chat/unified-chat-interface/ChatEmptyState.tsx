'use client';

import { FileText } from 'lucide-react';
import React from 'react';
import { renderIcon } from '../../../lib/icon-utils';
import { AnimatedBotIcon } from '../../ui/icons/AnimatedBotIcon';

interface ChatEmptyStateProps {
  chatMode: 'general' | 'rag';
  selectedDocuments: any[];
}

export const ChatEmptyState = React.memo(function ChatEmptyState({
  chatMode,
  selectedDocuments
}: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col justify-center items-center h-full text-center">
      <div className="relative mb-8">
        <div className="flex justify-center items-center w-24 h-24">
          <AnimatedBotIcon className="w-10 h-10 text-cyan-400" />
        </div>

        {/* Show orbiting document icons only when documents are selected */}
        {selectedDocuments.length > 0 && (
          <>
            {selectedDocuments.slice(0, 3).map((doc, index) => (
              <div
                key={`orbit-${doc._id}-${index}`}
                className={`flex absolute z-10 justify-center items-center w-8 h-8 rounded-full orbit-animation-${index + 1}`}
              >
                <div className="flex justify-center items-center w-6 h-6 rounded-full border border-cyan-400/40">
                  {renderIcon(FileText, { className: "w-4 h-4 text-cyan-400" })}
                </div>
              </div>
            ))}

            <style jsx>{`
              @keyframes orbit1 {
                0% { transform: translate(-50%, -50%) rotate(0deg) translateX(30px) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg) translateX(30px) rotate(-360deg); }
              }
              @keyframes orbit2 {
                0% { transform: translate(-50%, -50%) rotate(120deg) translateX(35px) rotate(-120deg); }
                100% { transform: translate(-50%, -50%) rotate(480deg) translateX(35px) rotate(-480deg); }
              }
              @keyframes orbit3 {
                0% { transform: translate(-50%, -50%) rotate(240deg) translateX(40px) rotate(-240deg); }
                100% { transform: translate(-50%, -50%) rotate(600deg) translateX(40px) rotate(-600deg); }
              }
              .orbit-animation-1 {
                position: absolute;
                top: 50%;
                left: 50%;
                transform-origin: center;
                animation: orbit1 8s infinite linear;
              }
              .orbit-animation-2 {
                position: absolute;
                top: 50%;
                left: 50%;
                transform-origin: center;
                animation: orbit2 10s infinite linear;
              }
              .orbit-animation-3 {
                position: absolute;
                top: 50%;
                left: 50%;
                transform-origin: center;
                animation: orbit3 12s infinite linear;
              }
            `}</style>
          </>
        )}
      </div>
      <h3 className="mb-3 text-xl font-semibold text-cyan-100">
        {chatMode === 'general' ? 'Ready to chat' : 'Ready to explore your documents'}
      </h3>
      <p className="max-w-md leading-relaxed text-cyan-200/70">
        {chatMode === 'general'
          ? "I'm here to help with any questions or topics you'd like to discuss. What's on your mind?"
          : "Ask me anything about your selected documents. I'll provide detailed answers with source references."
        }
      </p>
    </div>
  );
});
