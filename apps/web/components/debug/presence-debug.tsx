"use client";

import { useQuery } from "convex/react";
import { api } from "../../generated-convex";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function PresenceDebug() {
  const debugInfo = useQuery(api.presence.getPresenceDebugInfo, { roomId: "system-status" });

  const handleRefresh = () => {
    // Force a refresh by invalidating the query
    window.location.reload();
  };

  if (!debugInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Presence Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading debug information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Presence Debug Info</CardTitle>
        <Button onClick={handleRefresh} variant="secondary" size="sm">
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold">Total Users: {debugInfo.total}</h4>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(debugInfo.timestamp).toLocaleString()}
          </p>
        </div>
        
        <div>
          <h4 className="mb-2 font-semibold">User Details:</h4>
          <div className="space-y-2">
            {debugInfo.users.map((user, index) => (
              <div key={index} className="p-2 text-sm rounded border">
                <div><strong>User ID:</strong> {user.userId}</div>
                <div><strong>Online:</strong> {user.online ? 'Yes' : 'No'}</div>
                <div><strong>Last Disconnected:</strong> {new Date(user.lastDisconnected).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> If you see multiple entries or stale entries, this explains the stuck count.</p>
          <p>The @convex-dev/presence component should auto-cleanup after timeout.</p>
        </div>
      </CardContent>
    </Card>
  );
}