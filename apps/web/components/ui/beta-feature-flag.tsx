'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface BetaFeatureFlagProps {
  children: React.ReactNode;
  enabled: boolean;
  className?: string;
  betaText?: string;
}

export function BetaFeatureFlag({
  children,
  enabled,
  className,
  betaText = 'Feature in Beta - Coming Soon'
}: BetaFeatureFlagProps) {
  if (enabled) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="flex absolute inset-0 z-50 justify-center items-center rounded-lg backdrop-blur-sm bg-gray-500/60">
        <div className="px-6 py-4 rounded-xl border border-gray-600 shadow-lg backdrop-blur-md bg-gray-800/90">
          <div className="flex gap-3 items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-200">
              {betaText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BetaFeatureFlag;