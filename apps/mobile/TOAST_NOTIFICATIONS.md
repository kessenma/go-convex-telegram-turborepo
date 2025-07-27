# Toast Notifications for Telegram Messages

This document explains how the toast notification system works in the mobile app to show notifications when new Telegram messages arrive.

## Architecture Overview

The toast notification system consists of several components working together:

1. **Toast Store** (`stores/useToastStore.ts`) - Zustand store managing toast state
2. **Toast Component** (`components/Toast.tsx`) - UI component rendering toasts
3. **MessageNotificationProvider** (`providers/MessageNotificationProvider.tsx`) - Listens for new messages
4. **Provider Integration** - All providers integrated in `App.tsx`

## How It Works

### Real-time Message Detection

The `MessageNotificationProvider` uses Convex's real-time subscriptions to:
- Subscribe to the latest 5 messages using `api.messages.getAllMessages`
- Track the most recent message ID
- Detect when a new message arrives (different message ID)
- Trigger a toast notification for new messages

### Toast Display

When a new message is detected:
- Shows sender name (firstName + lastName or username)
- Displays message preview (first 50 characters)
- Includes a "View" action button
- Auto-dismisses after 5 seconds
- Can be swiped away manually

### Provider Chain

The providers are nested in this order in `App.tsx`:
```
SafeAreaProvider
  ConvexClientProvider
    ClientOnlyProvider
      HealthCheckProvider
        SessionProvider
          MessageNotificationProvider  // ← New provider
            AuthProvider
              NavigationContainer
                AppContent
                ToastContainer  // ← Renders toasts
```

## Testing the System

### Manual Testing

1. **Test Button**: Go to Telegram Manager screen and tap "Test Notification"
2. **Real Messages**: Send a message to your Telegram bot to see live notifications

### Expected Behavior

- ✅ Toast appears at the top of the screen
- ✅ Shows sender information and message preview
- ✅ Has a "View" action button
- ✅ Auto-dismisses after 5 seconds
- ✅ Can be swiped away manually
- ✅ Multiple toasts stack vertically

## Configuration Options

### MessageNotificationProvider Props

```typescript
interface MessageNotificationProviderProps {
  children: React.ReactNode;
  enableNotifications?: boolean; // Default: true
}
```

### Toast Customization

You can customize toast behavior by modifying the `toast.info()` call in `MessageNotificationProvider.tsx`:

```typescript
toast.info(
  `New message from ${senderName}`,
  messagePreview,
  {
    duration: 5000, // Show duration in ms
    action: {
      label: 'View',
      onPress: () => {
        // Navigate to message thread
      },
    },
  }
);
```

## Troubleshooting

### Notifications Not Showing

1. **Check Convex Connection**: Ensure the app is connected to Convex
2. **Check Provider Order**: Verify `MessageNotificationProvider` is inside `ConvexClientProvider`
3. **Check Console**: Look for error messages in the console
4. **Test Button**: Use the test button in Telegram Manager to verify toast system works

### Performance Considerations

- The provider only queries the latest 5 messages to minimize data transfer
- Uses message ID comparison instead of timestamp for reliability
- Notifications are only shown for truly new messages (not on app startup)

## Future Enhancements

- [ ] Navigate to specific message thread when "View" is tapped
- [ ] Add sound/vibration for notifications
- [ ] Support for different notification types (mentions, replies, etc.)
- [ ] User preferences for notification settings
- [ ] Background notification support
- [ ] Rich message previews (images, files, etc.)

## Related Files

- `stores/useToastStore.ts` - Toast state management
- `components/Toast.tsx` - Toast UI component
- `providers/MessageNotificationProvider.tsx` - Message detection logic
- `views/TelegramManager.tsx` - Test button implementation
- `App.tsx` - Provider integration