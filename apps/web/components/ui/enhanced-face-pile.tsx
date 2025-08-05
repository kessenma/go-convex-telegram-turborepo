"use client";

import React from 'react';
import { User, Globe, MapPin, Building, Mail, Clock, Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tool-tip';
import { renderIcon } from '../../lib/icon-utils';

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

// Helper function to format location information with Lucide icons (keeping flag emojis)
function formatLocationInfo(user: any): React.ReactNode {
  const parts: React.ReactNode[] = [];

  if (user.ipAddress && user.ipAddress !== 'unknown') {
    parts.push(
      <div key="ip" className="flex items-center gap-1">
        {renderIcon(Globe, { className: "w-3 h-3 text-cyan-400" })}
        <span>{user.ipAddress}</span>
      </div>
    );
  }

  if (user.city && user.city !== 'unknown') {
    parts.push(
      <div key="city" className="flex items-center gap-1">
        {renderIcon(MapPin, { className: "w-3 h-3 text-cyan-400" })}
        <span>{user.city}</span>
      </div>
    );
  }

  if (user.region && user.region !== 'unknown' && user.region !== user.city) {
    parts.push(
      <div key="region" className="flex items-center gap-1">
        {renderIcon(Building, { className: "w-3 h-3 text-cyan-400" })}
        <span>{user.region}</span>
      </div>
    );
  }

  if (user.country && user.country !== 'unknown') {
    const flag = getCountryFlag(user.countryCode || user.country);
    parts.push(
      <div key="country" className="flex items-center gap-1">
        <span>{flag}</span>
        <span>{user.country}</span>
      </div>
    );
  }

  if (user.zip && user.zip !== 'unknown') {
    parts.push(
      <div key="zip" className="flex items-center gap-1">
        {renderIcon(Mail, { className: "w-3 h-3 text-cyan-400" })}
        <span>{user.zip}</span>
      </div>
    );
  }

  if (user.timezone && user.timezone !== 'unknown') {
    parts.push(
      <div key="timezone" className="flex items-center gap-1">
        {renderIcon(Clock, { className: "w-3 h-3 text-cyan-400" })}
        <span>{user.timezone}</span>
      </div>
    );
  }

  if (user.isp && user.isp !== 'unknown') {
    parts.push(
      <div key="isp" className="flex items-center gap-1">
        {renderIcon(Wifi, { className: "w-3 h-3 text-cyan-400" })}
        <span>ISP: {user.isp}</span>
      </div>
    );
  }

  return parts.length > 0 ? (
    <div className="space-y-1">
      {parts}
    </div>
  ) : (
    <span>Location unknown</span>
  );
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

        const locationInfo = formatLocationInfo(user as any);
        const hasLocationInfo = showLocation && (ipAddress !== "unknown" || country !== "unknown");

        const tooltipContent = hasLocationInfo ? (
          <div className="space-y-2">
            <div className="font-medium text-cyan-300">{userId}</div>
            {locationInfo}
          </div>
        ) : (
          <span>{userId}</span>
        );

        return (
          <Tooltip key={user.userId || index}>
            <TooltipTrigger asChild>
              <div className="relative w-8 h-8 rounded-full border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-400/20">
                {renderIcon(User, {
                  className: "w-4 h-4 text-cyan-300"
                })}
                {/* Tron-like glow effect */}
                <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-sm opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-slate-800/95 backdrop-blur-sm border border-cyan-400/30 text-cyan-100 shadow-lg shadow-cyan-400/10 text-center max-w-[200px] z-[9999]"
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