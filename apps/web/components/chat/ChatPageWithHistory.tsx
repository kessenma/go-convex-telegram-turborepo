'use client';

import { UnifiedChatInterface } from './UnifiedChatInterface';

interface ChatPageWithHistoryProps {
  onDocumentCountChange?: (count: number) => void;
  onMessageCountChange?: (hasMessages: boolean) => void;
}

export function ChatPageWithHistory({ 
  onDocumentCountChange, 
  onMessageCountChange 
}: ChatPageWithHistoryProps) {
  return (
    <UnifiedChatInterface
      onDocumentCountChange={onDocumentCountChange}
      onMessageCountChange={onMessageCountChange}
    />
  );
}