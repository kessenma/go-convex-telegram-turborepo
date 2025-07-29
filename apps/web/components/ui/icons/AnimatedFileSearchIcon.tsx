"use client";

import React from "react";
import { FileSearch } from "lucide-react";
import { renderIcon } from "../../../lib/icon-utils";

interface AnimatedFileSearchIconProps {
  className?: string;
  [key: string]: any;
}

export function AnimatedFileSearchIcon({ className = "", ...props }: AnimatedFileSearchIconProps): React.ReactElement {
  return (
    <div className={className} {...props}>
      {renderIcon(FileSearch, { className: "w-full h-full" })}
    </div>
  );
}