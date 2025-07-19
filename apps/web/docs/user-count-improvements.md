# User Count Tracking Improvements

## Problem Identified

The user count indicator was showing inflated numbers because:

1. **Sessions weren't properly cleaned up** when users left the site
2. **No automatic session expiration** - sessions remained active indefinitely
3. **Long session timeout** (5 minutes) made the count unresponsive
4. **Unreliable session ending** - `beforeunload` events weren't always firing
5. **No periodic cleanup** - expired sessions accumulated over time

## Solutions Implemented

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