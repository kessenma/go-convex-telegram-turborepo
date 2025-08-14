"use client";

import { useEffect, useState } from "react";
import { api } from "../generated-convex";
import { useQuery, useMutation } from "convex/react";
import { getCachedLocationData, type LocationData } from "../lib/geolocation";
import useConvexPresence from "@convex-dev/presence/react";

interface UserWithLocation {
    userId: string;
    sessionId: string;
    online: boolean;
    ipAddress: string;
    country: string;
    region?: string;
    city?: string;
    timezone?: string;
    coordinates?: [number, number];
}

export function usePresenceWithLocation(roomId: string = "system-status") {
    console.log("usePresenceWithLocation hook called with roomId:", roomId);

    const [userId] = useState(() => {
        if (typeof window !== "undefined") {
            const existingUserId = sessionStorage.getItem("convex-presence-userId");
            if (existingUserId) {
                return existingUserId;
            }
        }
        const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (typeof window !== "undefined") {
            sessionStorage.setItem("convex-presence-userId", newUserId);
        }
        return newUserId;
    });

    // Use the official @convex-dev/presence hook
    const presenceState = useConvexPresence(api.presence, roomId, userId);

    console.log("Presence state from @convex-dev/presence:", presenceState);
    console.log("Presence state type:", typeof presenceState, "isArray:", Array.isArray(presenceState));

    // Debug: Log the first few users to see what data we have
    if (Array.isArray(presenceState) && presenceState.length > 0) {
        console.log("First 3 users in presence:", presenceState.slice(0, 3));
        console.log("Unique user IDs:", [...new Set(presenceState.map(u => u.userId))]);
    }

    // Store location data when presence is active
    const heartbeatMutation = useMutation(api.presence.heartbeat);

    useEffect(() => {
        if (!presenceState) return;

        const storeLocationData = async () => {
            try {
                const locationData = await getCachedLocationData();
                console.log("Storing location data for user:", { userId, locationData });

                // Store location data in our custom table
                await heartbeatMutation({
                    roomId,
                    userId,
                    sessionId: userId, // Use userId as sessionId for simplicity
                    interval: 30000,
                    ipAddress: locationData.ip,
                    country: locationData.country,
                    countryCode: locationData.countryCode,
                    region: locationData.region,
                    city: locationData.city,
                    zip: locationData.zip,
                    timezone: locationData.timezone,
                    coordinates: locationData.coordinates,
                    isp: locationData.isp,
                    org: locationData.org,
                    as: locationData.as,
                });

                console.log("Location data stored successfully");
            } catch (error) {
                console.warn("Error storing location data:", error);
            }
        };

        // Store location data initially and then periodically
        storeLocationData();
        const interval = setInterval(storeLocationData, 30000);

        return () => clearInterval(interval);
    }, [presenceState, userId, roomId, heartbeatMutation]);

    // Get location data for all users in presence
    const usersWithLocationData = useQuery(api.userLocation.getAllUserLocations);

    console.log("All user locations:", usersWithLocationData);

    // Transform the presence data to include location information
    // First, filter out stale users and deduplicate by userId
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes ago

    const activeUsers = Array.isArray(presenceState) ? presenceState.filter((user: any) => {
        // Filter out users that have been disconnected for more than 5 minutes
        if (user.lastDisconnected && user.lastDisconnected < fiveMinutesAgo) {
            return false;
        }
        // Keep users that are marked as online or recently active
        return user.online !== false;
    }) : [];

    // Then deduplicate by userId
    const uniqueUsers = activeUsers.reduce((acc: any[], user: any) => {
        const existingUser = acc.find(u => u.userId === user.userId);
        if (!existingUser) {
            acc.push(user);
        }
        return acc;
    }, []);

    console.log("Active users after filtering:", activeUsers.length, "from", presenceState?.length || 0);
    console.log("Unique users after deduplication:", uniqueUsers.length, "from", activeUsers.length);

    const onlineUsers: UserWithLocation[] = uniqueUsers.map((user: any) => {
        // Find location data for this user
        const locationData = Array.isArray(usersWithLocationData)
            ? usersWithLocationData.find(loc => loc.userId === user.userId)
            : undefined;

        return {
            userId: user.userId || 'unknown',
            sessionId: user.userId || 'unknown', // Use userId as sessionId
            online: true,
            ipAddress: locationData?.ipAddress || 'unknown',
            country: locationData?.country || 'unknown',
            region: locationData?.region || 'unknown',
            city: locationData?.city || 'unknown',
            timezone: locationData?.timezone || 'unknown',
            coordinates: locationData?.coordinates || [0, 0],
        };
    });

    return {
        onlineUsers,
        activeUserCount: onlineUsers.length,
        isActive: presenceState !== null && Array.isArray(presenceState) && presenceState.length > 0,
        userId,
        sessionId: userId,
    };
}