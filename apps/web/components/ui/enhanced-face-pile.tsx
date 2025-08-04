"use client";

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tool-tip';

interface EnhancedFacePileProps {
  presenceState: any[];
  showLocation?: boolean;
}

// Helper function to get country flag emoji
function getCountryFlag(countryCode: string): string {
  const flagMap: Record<string, string> = {
    'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷',
    'JP': '🇯🇵', 'CN': '🇨🇳', 'IN': '🇮🇳', 'BR': '🇧🇷', 'AU': '🇦🇺',
    'RU': '🇷🇺', 'KR': '🇰🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱',
    'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'CH': '🇨🇭',
    'AT': '🇦🇹', 'BE': '🇧🇪', 'PL': '🇵🇱', 'CZ': '🇨🇿', 'HU': '🇭🇺',
    'Local': '🏠', 'Unknown': '🌍'
  };
  return flagMap[countryCode] || '🌍';
}

// Helper function to format location information
function formatLocationInfo(user: any): string {
  const parts: string[] = [];
  
  if (user.ipAddress && user.ipAddress !== 'unknown') {
    parts.push(`🌐 ${user.ipAddress}`);
  }
  
  if (user.city && user.city !== 'unknown') {
    parts.push(`📍 ${user.city}`);
  }
  
  if (user.region && user.region !== 'unknown' && user.region !== user.city) {
    parts.push(`🏛️ ${user.region}`);
  }
  
  if (user.country && user.country !== 'unknown') {
    const flag = getCountryFlag(user.countryCode || user.country);
    parts.push(`${flag} ${user.country}`);
  }
  
  if (user.zip && user.zip !== 'unknown') {
    parts.push(`📮 ${user.zip}`);
  }
  
  if (user.timezone && user.timezone !== 'unknown') {
    parts.push(`🕐 ${user.timezone}`);
  }
  
  if (user.isp && user.isp !== 'unknown') {
    parts.push(`🌐 ISP: ${user.isp}`);
  }
  
  return parts.length > 0 ? parts.join('\n') : 'Location unknown';
}

/**
 * Enhanced FacePile component that displays user avatars with location tooltips
 */
export function EnhancedFacePile({ 
  presenceState, 
  showLocation = true 
}: EnhancedFacePileProps): React.ReactElement {
  
  return (
    <div className="flex -space-x-2">
      {presenceState.slice(0, 5).map((user: any, index: number) => {
        const ipAddress = (user as any).ipAddress || "unknown";
        const country = (user as any).country || "unknown";
        const userId = user.userId || `User ${index + 1}`;
        
        const tooltipContent = showLocation && (ipAddress !== "unknown" || country !== "unknown")
          ? `${userId}\n${formatLocationInfo(user as any)}`
          : userId;

        return (
          <Tooltip key={user.userId || index}>
            <TooltipTrigger asChild>
              <div className="relative w-8 h-8 rounded-full border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-400/20">
                <span className="text-xs font-medium text-cyan-300">
                  {userId.charAt(0).toUpperCase()}
                </span>
                {/* Tron-like glow effect */}
                <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-sm opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="bg-slate-800/95 backdrop-blur-sm border border-cyan-400/30 text-cyan-100 shadow-lg shadow-cyan-400/10 whitespace-pre-line text-center max-w-[200px] z-[9999]"
            >
              {tooltipContent}
            </TooltipContent>
          </Tooltip>
        );
      })}
      
      {presenceState.length > 5 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative w-8 h-8 rounded-full border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 hover:border-cyan-300">
              <span className="text-xs font-medium text-cyan-300">
                +{presenceState.length - 5}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="bg-slate-800/95 backdrop-blur-sm border border-cyan-400/30 text-cyan-100 shadow-lg shadow-cyan-400/10 z-[9999]"
          >
            {presenceState.length - 5} more user{presenceState.length - 5 !== 1 ? 's' : ''} online
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}