# User Count System Improvements

## Problem
The active user counter was firing on every component re-render, causing excessive API calls and poor performance. The system lacked proper session caching and throttling mechanisms.

## Solution
Implemented cookie-based session caching with intelligent throttling to prevent unnecessary API calls while maintaining accurate user tracking.

## Key Improvements

### 1. Cookie-Based Session Caching
- **Session ID Persistence**: User sessions are now stored in cookies (`user-session-id`) with a 5-minute expiration
- **Activity Tracking**: Last activity timestamp is cached in cookies (`user-session-activity`) to determine session validity
- **Session Reuse**: Existing valid sessions are reused instead of creating new ones on every page load

### 2. Intelligent Session Management
- **Session Timeout**: Sessions expire after 3 minutes of inactivity
- **Automatic Renewal**: Active sessions are automatically renewed when user interacts with the page
- **Graceful Cleanup**: Sessions are properly cleaned up on page unload

### 3. API Call Throttling
- **Heartbeat Throttling**: Minimum 30-second interval between heartbeat API calls
- **Visibility-Based Optimization**: Heartbeats only sent when page becomes visible and enough time has passed
- **Efficient Intervals**: Heartbeat checks run every minute but only send requests when throttling conditions are met

### 4. Performance Optimizations
- **Reduced Re-renders**: Session creation only happens once per valid session
- **Conditional API Calls**: New sessions are only created when no valid cached session exists
- **Memory Management**: Proper cleanup of intervals and event listeners

## Technical Implementation

### Cookie Structure
```
user-session-id: web_1234567890_abc123def (5 min expiration)
user-session-activity: 1234567890123 (5 min expiration)
user-session-exists: true (5 min expiration)
```

### Session Lifecycle
1. **Page Load**: Check for existing valid session in cookies
2. **Session Validation**: Verify session hasn't expired (3-minute timeout)
3. **Session Creation**: Only create new session if none exists or expired
4. **Activity Updates**: Update activity timestamp on user interactions
5. **Cleanup**: Remove session markers on page unload

### API Call Reduction
- **Before**: Potential API call on every component re-render
- **After**: Maximum one API call per 30 seconds per user session
- **Estimated Reduction**: 90%+ reduction in unnecessary API calls

## Benefits

1. **Performance**: Dramatically reduced server load and API calls
2. **User Experience**: Faster page loads and smoother interactions
3. **Accuracy**: More reliable user count tracking with proper session management
4. **Scalability**: System can handle more concurrent users efficiently
5. **Resource Efficiency**: Reduced bandwidth and server processing requirements

## Configuration

- **Session Timeout**: 3 minutes (configurable)
- **Cookie Expiration**: 5 minutes (configurable)
- **Heartbeat Throttle**: 30 seconds minimum (configurable)
- **Heartbeat Interval**: 60 seconds check frequency (configurable)

## Future Enhancements

1. **Server-Side Session Validation**: Add server-side session validation for enhanced security
2. **Analytics Integration**: Track session patterns for user behavior analysis
3. **Real-Time Updates**: Implement WebSocket connections for real-time user count updates
4. **Geographic Tracking**: Add optional location-based user tracking

## Previous Solutions Implemented

### 1. Improved Session Cleanup

**File: `apps/web/hooks/use-user-session.ts`**

- Added `pagehide` event listener for better mobile browser support
- Improved `navigator.sendBeacon` usage with proper Blob formatting
- Reduced heartbeat interval from 2 minutes to 1 minute for more responsive tracking

### 2. Reduced Session Timeout

**File: `apps/docker-convex/convex/userSessions.ts`**

- Reduced session timeout from 5 minutes to 2 minutes
- Sessions now expire faster when users become inactive

### 3. Automatic Session Cleanup

**File: `apps/docker-convex/convex/crons.ts` (NEW)**

- Added Convex cron job that runs every minute
- Automatically cleans up expired sessions
- Ensures user count stays accurate even if manual cleanup fails

### 4. Additional Cleanup Triggers

**File: `apps/web/hooks/use-consolidated-health-check.ts`**

- Added session cleanup trigger during user count health checks
- Provides redundant cleanup every 75 seconds
- Ensures cleanup happens even if cron job fails

**File: `apps/web/app/api/users/active-count/cleanup/route.ts` (NEW)**

- New API endpoint for manual session cleanup
- Called by health check system for additional reliability

## Technical Details

### Session Lifecycle

1. **Session Creation**: When user visits the site
2. **Heartbeat**: Every 1 minute while page is active
3. **Pause/Resume**: Heartbeat pauses when page is hidden, resumes when visible
4. **Session End**: Triggered on `beforeunload` and `pagehide` events
5. **Automatic Cleanup**: Expired sessions cleaned up every minute

### Cleanup Mechanisms

1. **Cron Job**: Runs every minute via Convex scheduler
2. **Health Check**: Triggers cleanup every 75 seconds
3. **Manual Cleanup**: Available via API endpoint
4. **Session Timeout**: 2-minute inactivity timeout

### Browser Event Handling

- **`beforeunload`**: Primary session end trigger
- **`pagehide`**: Backup trigger for mobile browsers
- **`visibilitychange`**: Pause/resume heartbeat based on page visibility
- **`navigator.sendBeacon`**: Reliable session end requests

## Expected Results

- **More accurate user counts**: Sessions end promptly when users leave
- **Responsive tracking**: 1-minute heartbeat and 2-minute timeout
- **Reliable cleanup**: Multiple cleanup mechanisms ensure accuracy
- **Better mobile support**: `pagehide` event handles mobile browser behavior
- **Reduced server load**: Expired sessions are automatically removed

## Monitoring

The user count should now:

- Increment immediately when users visit
- Decrement within 2-3 minutes when users leave
- Show more realistic concurrent user numbers
- Handle mobile browsers more reliably

## Files Modified

- `apps/web/hooks/use-user-session.ts` - Improved session management
- `apps/docker-convex/convex/userSessions.ts` - Reduced timeout
- `apps/docker-convex/convex/crons.ts` - Added cleanup cron job
- `apps/web/hooks/use-consolidated-health-check.ts` - Added cleanup trigger
- `apps/web/app/api/users/active-count/cleanup/route.ts` - New cleanup endpoint
- `apps/web/docs/user-count-improvements.md` - This documentation
