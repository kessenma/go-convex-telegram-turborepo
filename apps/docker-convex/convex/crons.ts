// apps/docker-convex/convex/crons.ts
import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Clean up expired user sessions every minute
crons.interval(
  "cleanup expired sessions",
  { minutes: 1 },
  api.userSessions.cleanupExpiredSessions
);

// Clean up old service statuses every 5 minutes (keep only latest 100 entries)
crons.interval(
  "cleanup old service statuses",
  { minutes: 5 },
  api.serviceStatus.cleanupOldStatuses
);

export default crons;