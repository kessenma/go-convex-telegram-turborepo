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

export default crons;