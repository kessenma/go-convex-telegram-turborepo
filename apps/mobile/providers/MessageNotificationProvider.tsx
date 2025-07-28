import React, { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../generated-convex';
import { toast } from '../stores/useToastStore';
import { useAppStore } from '../stores/useAppStore';

interface MessageNotificationProviderProps {
  children: React.ReactNode;
  enableNotifications?: boolean;
}

/**
 * Provider that listens for new Telegram messages and shows toast notifications
 * Uses Convex real-time subscriptions to detect new messages
 * Only triggers notifications for actual new incoming Telegram messages
 */
export function MessageNotificationProvider({
  children,
  enableNotifications = true,
}: MessageNotificationProviderProps): React.ReactElement {
  const lastMessageIdRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);
  const lastNotificationTimeRef = useRef<number>(0);
  
  // Get notification settings from app store
  const { settings } = useAppStore();
  
  // Subscribe to messages with a small limit to get the latest messages
  const messages = useQuery(api.messages.getAllMessages, { limit: 3 });
  
  useEffect(() => {
    // Check both prop and global settings for notifications
    const notificationsAllowed = enableNotifications && settings.notificationsEnabled;
    
    if (!notificationsAllowed || !messages || messages.length === 0) {
      return;
    }
    
    const latestMessage = messages[0]; // Messages are ordered desc, so first is latest
    const now = Date.now();
    
    // Initialize on first load - don't show notifications for existing messages
    if (!isInitializedRef.current) {
      lastMessageIdRef.current = latestMessage.messageId;
      isInitializedRef.current = true;
      return;
    }
    
    // Check if we have a genuinely new message
    const isNewMessage = latestMessage.messageId !== lastMessageIdRef.current;
    const isRecentMessage = (now - latestMessage.timestamp) < 30000; // Message is less than 30 seconds old
    const hasMinTimeBetweenNotifications = (now - lastNotificationTimeRef.current) > 2000; // At least 2 seconds between notifications
    
    if (isNewMessage && isRecentMessage && hasMinTimeBetweenNotifications) {
      // Determine sender name from available fields
      let senderName = 'Unknown User';
      if (latestMessage.firstName) {
        senderName = latestMessage.firstName;
        if (latestMessage.lastName) {
          senderName += ` ${latestMessage.lastName}`;
        }
      } else if (latestMessage.username) {
        senderName = latestMessage.username;
      }
      
      // Create message preview
      const messagePreview = latestMessage.text.length > 50 
        ? `${latestMessage.text.substring(0, 50)}...` 
        : latestMessage.text;
      
      // Show notification only for new Telegram messages
      console.log('Showing notification for new Telegram message:', {
        messageId: latestMessage.messageId,
        sender: senderName,
        timestamp: new Date(latestMessage.timestamp).toISOString(),
        preview: messagePreview.substring(0, 20) + '...'
      });
      
      toast.info(
        `New Telegram message from ${senderName}`,
        messagePreview,
        {
          duration: 6000, // Show for 6 seconds
          action: {
            label: 'View',
            onPress: () => {
              // TODO: Navigate to the message thread or chat
              console.log('Navigate to message:', latestMessage.messageId);
            },
          },
        }
      );
      
      // Update tracking refs
      lastMessageIdRef.current = latestMessage.messageId;
      lastNotificationTimeRef.current = now;
    } else if (isNewMessage) {
      // Update the last message ID even if we don't show a notification
      // This prevents showing notifications for old messages when the app restarts
      console.log('Skipping notification for message (not recent or too frequent):', {
        messageId: latestMessage.messageId,
        isRecent: isRecentMessage,
        hasMinTime: hasMinTimeBetweenNotifications,
        messageAge: (now - latestMessage.timestamp) / 1000 + 's ago'
      });
      lastMessageIdRef.current = latestMessage.messageId;
    }
  }, [messages, enableNotifications, settings.notificationsEnabled]);
  
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