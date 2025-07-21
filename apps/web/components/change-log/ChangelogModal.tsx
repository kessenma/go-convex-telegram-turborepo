"use client";

import { useState } from "react";
import { GitBranch } from "lucide-react";
import { ChainLogCard } from "./ChangeLogCard";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalTrigger,
  ResponsiveModalTitle,
  ResponsiveModalHeader,
} from "../ui/responsive-modal";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

interface ChangelogModalProps {
  trigger?: React.ReactNode;
  maxCommits?: number;
  className?: string;
}

export function ChangelogModal({
  trigger,
  maxCommits = 10,
  className = "",
}: ChangelogModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <ResponsiveModalTrigger asChild>
        {trigger || (
          <Button variant="secondary" size="sm" className={className}>
            View Changelog
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent className="max-w-2xl bg-slate-950" side="right">
        <ResponsiveModalHeader className="mb-4">
          <div className="flex gap-2 items-center">
            <GitBranch className="text-cyan-500" size={18} />
            <ResponsiveModalTitle>Project Changelog</ResponsiveModalTitle>
          </div>
        </ResponsiveModalHeader>
        
        <ScrollArea className="h-[calc(100vh-150px)]">
          <div className="pr-4">
            <ChainLogCard maxCommits={maxCommits} showTitle={false} />
          </div>
        </ScrollArea>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}