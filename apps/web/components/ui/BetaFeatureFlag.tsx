import React from 'react';
import { cn } from '../../lib/utils';

interface BetaFeatureFlagProps {
  children: React.ReactNode;
  enabled?: boolean;
  className?: string;
  message?: string;
}

export const BetaFeatureFlag: React.FC<BetaFeatureFlagProps> = ({
  children,
  enabled = false,
  className,
  message = "Feature in Beta - Coming Soon"
}) => {
  if (enabled) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      {children}
      <div className="absolute inset-0 bg-gray-400/20 backdrop-blur-sm rounded-lg border border-gray-300/30 flex items-center justify-center z-10">
        <div className="bg-gray-100/90 backdrop-blur-md px-4 py-2 rounded-lg border border-gray-300/50 shadow-lg">
          <p className="text-gray-700 font-medium text-sm text-center">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BetaFeatureFlag;