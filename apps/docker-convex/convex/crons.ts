// apps/docker-convex/convex/crons.ts
import { cronJobs } from "convex/server";

const crons = cronJobs();

// Note: User presence cleanup is now handled automatically by the @convex-dev/presence component
// No need for manual session cleanup crons anymore

// TODO: Re-enable service status cleanup once TypeScript issues are resolved
// crons.interval(
//   "cleanup old service statuses",
//   { minutes: 5 },
//   api.serviceStatus.cleanupOldStatuses
// );

export default crons;