import React, { ReactNode, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { renderIcon } from '../../../lib/icon-utils';

interface CodeBlockProps {
    children?: ReactNode;
    className?: string;
    colors?: {
      light?: string;
      medium?: string;
      dark?: string;
      border?: string;
    };
    animationSpeed?: number;
    showBorder?: boolean;
    title?: string;
    code?: string;
    language?: string;
}

export default function CodeBlock({ 
  children, 
  className, 
  colors = {
    light: '#62748e',
    medium: '#314158',
    dark: '#0f172b',
    border: 'hsl(189,100%,50%)'
  }, 
  animationSpeed, 
  showBorder = true, 
  title = "terminal", 
  code, 
  language = "bash" 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Create background gradient with user-defined colors
  const bgGradient = `radial-gradient(at 88% 40%,${colors.dark} 0,transparent 85%),
                     radial-gradient(at 49% 30%,${colors.dark} 0,transparent 85%),
                     radial-gradient(at 14% 26%,${colors.dark} 0,transparent 85%),
                     radial-gradient(at 0% 64%,${colors.medium} 0,transparent 85%),
                     radial-gradient(at 41% 94%,${colors.light} 0,transparent 85%),
                     radial-gradient(at 100% 99%,${colors.medium} 0,transparent 85%)`;

  return (
    <>
      <div className={`relative w-full max-w-2xl mx-auto rounded-xl p-0.5 ${className || ''}`}>
        {showBorder && <div className="code-border-anim" />}
        <div className="rounded-xl bg-slate-900 p-6 shadow-[0px_-16px_24px_0px_rgba(255,255,255,0.05)_inset]">
          <div className="flex justify-between items-center pb-4">
            <span className="text-base font-semibold text-white">{title}</span>
            <button 
              className={`rounded-full ${copied ? 'bg-green-500' : 'bg-slate-700'} px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-600 flex items-center gap-1.5`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  {renderIcon(Check, { className: "w-3.5 h-3.5" })}
                  <span>Copied</span>
                </>
              ) : (
                <>
                  {renderIcon(Copy, { className: "w-3.5 h-3.5" })}
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto p-0 m-0 text-sm leading-relaxed text-blue-100 whitespace-pre bg-transparent rounded-lg">
            <code>
              {code ? (
                <span className="text-blue-300">{code}</span>
              ) : (
                children
              )}
            </code>
          </pre>
        </div>
      </div>
 
      <style>{`
        .code-border-anim {
          position: absolute;
          z-index: -10;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: calc(100% + 2px);
          height: calc(100% + 2px);
          border-radius: 1rem;
          overflow: hidden;
          pointer-events: none;
        }
        .code-border-anim::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200%;
          height: 10rem;
          background: linear-gradient(
            0deg,
            hsla(0,0%,100%,0) 0%,
            ${colors.border} 40%,
            ${colors.border} 60%,
            hsla(0,0%,40%,0) 100%
          );
          transform: translate(-50%, -50%) rotate(0deg);
          transform-origin: left;
          animation: border-rotate ${animationSpeed || 8}s linear infinite;
          z-index: 2;
          pointer-events: none;
        }
        @keyframes border-rotate {
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};
 