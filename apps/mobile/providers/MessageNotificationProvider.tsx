import React, { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../generated-convex';
import { toast } from '../stores/useToastStore';

interface MessageNotificationProviderProps {
  children: React.ReactNode;
  enableNotifications?: boolean;
}

/**
 * Provider that listens for new Telegram messages and shows toast notifications
 * Uses Convex real-time subscriptions to detect new messages
 */
export function MessageNotificationProvider({
  children,
  enableNotifications = true,
}: MessageNotificationProviderProps): React.ReactElement {
  const previousMessageCountRef = useRef<number | null>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  
  // Subscribe to messages with a small limit to get the latest messages
  const messages = useQuery(api.messages.getAllMessages, { limit: 5 });
  
  useEffect(() => {
    if (!enableNotifications || !messages || messages.length === 0) {
      return;
    }
    
    const currentMessageCount = messages.length;
    const latestMessage = messages[0]; // Messages are ordered desc, so first is latest
    
    // Initialize refs on first load
    if (previousMessageCountRef.current === null) {
      previousMessageCountRef.current = currentMessageCount;
      lastMessageIdRef.current = latestMessage.messageId;
      return;
    }
    
    // Check if we have a new message (different messageId from the latest)
    if (latestMessage.messageId !== lastMessageIdRef.current) {
      // Show toast notification for new message
      const senderName = latestMessage.firstName 
        ? `${latestMessage.firstName}${latestMessage.lastName ? ` ${latestMessage.lastName}` : ''}`
        : latestMessage.username || 'Unknown User';
      
      const messagePreview = latestMessage.text.length > 50 
        ? `${latestMessage.text.substring(0, 50)}...` 
        : latestMessage.text;
      
      toast.info(
        `New message from ${senderName}`,
        messagePreview,
        {
          duration: 5000, // Show for 5 seconds
          action: {
            label: 'View',
            onPress: () => {
              // TODO: Navigate to the message thread or chat
              console.log('Navigate to message:', latestMessage.messageId);
            },
          },
        }
      );
      
      // Update refs
      lastMessageIdRef.current = latestMessage.messageId;
    }
    
    previousMessageCountRef.current = currentMessageCount;
  }, [messages, enableNotifications]);
  
  return <>{children}</>;
}

// Hook to manually trigger message notifications (useful for testing)
export function useMessageNotifications() {
  const showTestNotification = () => {
    toast.info(
      'Test Notification',
      'This is a test message notification',
      {
        duration: 3000,
        action: {
          label: 'Dismiss',
          onPress: () => console.log('Test notification dismissed'),
        },
      }
    );
  };
  
  return { showTestNotification };
}