"use client";

import { toast } from "sonner";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// LLM Status Types
interface LLMStatus {
  status: "healthy" | "error" | "loading" | "starting" | "connecting";
  ready: boolean;
  message: string;
  model?: string;
  details?: {
    service_status?: string;
    model_loaded?: boolean;
    model_loading?: boolean;
    uptime?: string;
    timestamp?: string;
    error?: string;
  };
  memory_usage?: {
    process_memory_mb?: number;
    process_memory_percent?: number;
    process_cpu_percent?: number;
    system_memory_total_gb?: number;
    system_memory_available_gb?: number;
    system_memory_used_percent?: number;
    error?: string;
  };
}

// Lightweight LLM Status Types
interface LightweightLLMStatus {
  status: "healthy" | "error" | "loading" | "starting" | "connecting";
  ready: boolean;
  message: string;
  model?: string;
  details?: {
    service_status?: string;
    model_loaded?: boolean;
    gpu_available?: boolean;
    timestamp?: string;
    error?: string;
  };
  memory_usage?: {
    rss_mb?: number;
    vms_mb?: number;
    percent?: number;
    available_mb?: number;
  };
}

// Convex Status Types
interface ConvexStatus {
  status: "connected" | "disconnected" | "connecting";
  ready: boolean;
  message: string;
  uptime?: number;
  statistics?: {
    requestsPerHour?: number;
    requestsPerDay?: number;
    successRate?: number;
    avgResponseTime?: number;
    totalRequests?: number;
  };
  performance?: {
    processingTimeMs?: number;
    memoryUsage?: string;
    activeConnections?: string;
  };
  details?: {
    service_status?: string;
    database_status?: string;
    uptime?: string;
    timestamp?: string;
    error?: string;
    service?: string;
    version?: string;
    last_check?: string;
  };
}

// User Count Status Types
interface UserCountStatus {
  status: "connected" | "disconnected" | "connecting" | "error";
  ready: boolean;
  message: string;
  activeUsers: number;
  bySource?: {
    web?: number;
    mobile?: number;
    telegram?: number;
  };
  details?: {
    timestamp?: string;
    lastUpdated?: string;
    error?: string;
    sourceBreakdown?: {
      web?: number;
      mobile?: number;
      telegram?: number;
    };
  };
}

// Docker Status Types
interface DockerService {
  name: string;
  status: "running" | "stopped" | "starting" | "error";
  uptime?: string;
  health?: "healthy" | "unhealthy" | "starting";
  port?: string;
  restarts?: number;
}

interface DockerNetwork {
  name?: string;
  driver?: string;
  scope?: string;
  attachedServices?: number;
  ports?: string[];
}

interface DockerResources {
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
}

interface DockerStatus {
  status: "healthy" | "degraded" | "critical" | "connecting";
  ready: boolean;
  message: string;
  services?: DockerService[];
  networks?: DockerNetwork[];
  resources?: DockerResources;
  details?: {
    compose_version?: string;
    total_services?: number;
    running_services?: number;
    timestamp?: string;
    error?: string;
  };
}

// Combined Status Interface
interface SystemStatus {
  llm: LLMStatus;
  lightweightLlm: LightweightLLMStatus;
  convex: ConvexStatus;
  docker: DockerStatus;
  userCount: UserCountStatus;
  lastUpdated: number;
  consecutiveErrors: {
    llm: number;
    lightweightLlm: number;
    convex: number;
    docker: number;
    userCount: number;
  };
  pollingIntervals: {
    llm: number;
    lightweightLlm: number;
    convex: number;
    docker: number;
    userCount: number;
  };
}

interface StatusStore {
  // State
  llmStatus: LLMStatus;
  lightweightLlmStatus: LightweightLLMStatus;
  convexStatus: ConvexStatus;
  dockerStatus: DockerStatus;
  userCountStatus: UserCountStatus;
  loading: {
    llm: boolean;
    lightweightLlm: boolean;
    convex: boolean;
    docker: boolean;
    userCount: boolean;
  };
  lastUpdated: {
    llm: number;
    lightweightLlm: number;
    convex: number;
    docker: number;
    userCount: number;
  };
  consecutiveErrors: {
    llm: number;
    lightweightLlm: number;
    convex: number;
    docker: number;
    userCount: number;
  };
  pollingIntervals: {
    llm: number;
    lightweightLlm: number;
    convex: number;
    docker: number;
    userCount: number;
  };

  // Basic setters
  setLLMStatus: (status: LLMStatus) => void;
  setLightweightLlmStatus: (status: LightweightLLMStatus) => void;
  setConvexStatus: (status: ConvexStatus) => void;
  setDockerStatus: (status: DockerStatus) => void;
  setUserCountStatus: (status: UserCountStatus) => void;
  setLLMLoading: (loading: boolean) => void;
  setLightweightLlmLoading: (loading: boolean) => void;
  setConvexLoading: (loading: boolean) => void;
  setDockerLoading: (loading: boolean) => void;
  setUserCountLoading: (loading: boolean) => void;

  // Error tracking
  incrementLLMErrors: () => void;
  incrementLightweightLlmErrors: () => void;
  incrementConvexErrors: () => void;
  incrementDockerErrors: () => void;
  incrementUserCountErrors: () => void;
  resetLLMErrors: () => void;
  resetLightweightLlmErrors: () => void;
  resetConvexErrors: () => void;
  resetDockerErrors: () => void;
  resetUserCountErrors: () => void;

  // Polling interval management
  updateLLMPollingInterval: () => void;
  updateLightweightLlmPollingInterval: () => void;
  updateConvexPollingInterval: () => void;
  updateDockerPollingInterval: () => void;
  updateUserCountPollingInterval: () => void;

  // Optimistic updates
  optimisticLLMUpdate: (partialStatus: Partial<LLMStatus>) => void;
  optimisticLightweightLlmUpdate: (
    partialStatus: Partial<LightweightLLMStatus>
  ) => void;
  optimisticConvexUpdate: (partialStatus: Partial<ConvexStatus>) => void;
  optimisticDockerUpdate: (partialStatus: Partial<DockerStatus>) => void;
  optimisticUserCountUpdate: (partialStatus: Partial<UserCountStatus>) => void;

  // API actions
  checkLLMStatus: () => Promise<boolean>;
  checkLightweightLlmStatus: () => Promise<boolean>;
  checkConvexStatus: () => Promise<boolean>;
  checkDockerStatus: () => Promise<boolean>;
  checkUserCountStatus: () => Promise<boolean>;
  checkAllStatus: () => Promise<{
    llm: boolean;
    lightweightLlm: boolean;
    convex: boolean;
    docker: boolean;
    userCount: boolean;
  }>;

  // Utility getters
  getSystemHealth: () => "healthy" | "degraded" | "critical";
  isSystemReady: () => boolean;
}

const initialLLMStatus: LLMStatus = {
  status: "connecting",
  ready: false,
  message: "Checking LLM Transformer service...",
};

const initialLightweightLlmStatus: LightweightLLMStatus = {
  status: "connecting",
  ready: false,
  message: "Checking LLM service...",
};

const initialConvexStatus: ConvexStatus = {
  status: "connecting",
  ready: false,
  message: "Checking Convex connection...",
};

const initialDockerStatus: DockerStatus = {
  status: "connecting",
  ready: false,
  message: "Checking Docker system...",
};

const initialUserCountStatus: UserCountStatus = {
  status: "connecting",
  ready: false,
  message: "Checking active users...",
  activeUsers: 0,
};

export const useStatusStore = create<StatusStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      llmStatus: initialLLMStatus,
      lightweightLlmStatus: initialLightweightLlmStatus,
      convexStatus: initialConvexStatus,
      dockerStatus: initialDockerStatus,
      userCountStatus: initialUserCountStatus,
      loading: {
        llm: false,
        lightweightLlm: false,
        convex: false,
        docker: false,
        userCount: false,
      },
      lastUpdated: {
        llm: 0,
        lightweightLlm: 0,
        convex: 0,
        docker: 0,
        userCount: 0,
      },
      consecutiveErrors: {
        llm: 0,
        lightweightLlm: 0,
        convex: 0,
        docker: 0,
        userCount: 0,
      },
      pollingIntervals: {
        llm: 120000, // 2 minutes default (further reduced frequency)
        lightweightLlm: 120000, // 2 minutes default (further reduced frequency)
        convex: 180000, // 3 minutes default (significantly reduced for Convex)
        docker: 150000, // 2.5 minutes default for Docker
        userCount: 90000, // 1.5 minutes default for user count
      },

      // Basic setters
      setLLMStatus: (status) =>
        set(
          (state) => ({
            llmStatus: status,
            lastUpdated: { ...state.lastUpdated, llm: Date.now() },
          }),
          false,
          "setLLMStatus"
        ),

      setLightweightLlmStatus: (status) =>
        set(
          (state) => ({
            lightweightLlmStatus: status,
            lastUpdated: { ...state.lastUpdated, lightweightLlm: Date.now() },
          }),
          false,
          "setLightweightLlmStatus"
        ),

      setConvexStatus: (status) =>
        set(
          (state) => ({
            convexStatus: status,
            lastUpdated: { ...state.lastUpdated, convex: Date.now() },
          }),
          false,
          "setConvexStatus"
        ),

      setDockerStatus: (status) =>
        set(
          (state) => ({
            dockerStatus: status,
            lastUpdated: { ...state.lastUpdated, docker: Date.now() },
          }),
          false,
          "setDockerStatus"
        ),

      setUserCountStatus: (status) =>
        set(
          (state) => ({
            userCountStatus: status,
            lastUpdated: { ...state.lastUpdated, userCount: Date.now() },
          }),
          false,
          "setUserCountStatus"
        ),

      setLLMLoading: (loading) =>
        set(
          (state) => ({ loading: { ...state.loading, llm: loading } }),
          false,
          "setLLMLoading"
        ),

      setLightweightLlmLoading: (loading) =>
        set(
          (state) => ({
            loading: { ...state.loading, lightweightLlm: loading },
          }),
          false,
          "setLightweightLlmLoading"
        ),

      setConvexLoading: (loading) =>
        set(
          (state) => ({ loading: { ...state.loading, convex: loading } }),
          false,
          "setConvexLoading"
        ),

      setDockerLoading: (loading) =>
        set(
          (state) => ({ loading: { ...state.loading, docker: loading } }),
          false,
          "setDockerLoading"
        ),

      setUserCountLoading: (loading) =>
        set(
          (state) => ({ loading: { ...state.loading, userCount: loading } }),
          false,
          "setUserCountLoading"
        ),

      // Error tracking
      incrementLLMErrors: () =>
        set(
          (state) => ({
            consecutiveErrors: {
              ...state.consecutiveErrors,
              llm: state.consecutiveErrors.llm + 1,
            },
          }),
          false,
          "incrementLLMErrors"
        ),

      incrementLightweightLlmErrors: () =>
        set(
          (state) => ({
            consecutiveErrors: {
              ...state.consecutiveErrors,
              lightweightLlm: state.consecutiveErrors.lightweightLlm + 1,
            },
          }),
          false,
          "incrementLightweightLlmErrors"
        ),

      incrementConvexErrors: () =>
        set(
          (state) => ({
            consecutiveErrors: {
              ...state.consecutiveErrors,
              convex: state.consecutiveErrors.convex + 1,
            },
          }),
          false,
          "incrementConvexErrors"
        ),

      incrementDockerErrors: () =>
        set(
          (state) => ({
            consecutiveErrors: {
              ...state.consecutiveErrors,
              docker: state.consecutiveErrors.docker + 1,
            },
          }),
          false,
          "incrementDockerErrors"
        ),

      incrementUserCountErrors: () =>
        set(
          (state) => ({
            consecutiveErrors: {
              ...state.consecutiveErrors,
              userCount: state.consecutiveErrors.userCount + 1,
            },
          }),
          false,
          "incrementUserCountErrors"
        ),

      resetLLMErrors: () =>
        set(
          (state) => ({
            consecutiveErrors: { ...state.consecutiveErrors, llm: 0 },
          }),
          false,
          "resetLLMErrors"
        ),

      resetLightweightLlmErrors: () =>
        set(
          (state) => ({
            consecutiveErrors: {
              ...state.consecutiveErrors,
              lightweightLlm: 0,
            },
          }),
          false,
          "resetLightweightLlmErrors"
        ),

      resetConvexErrors: () =>
        set(
          (state) => ({
            consecutiveErrors: { ...state.consecutiveErrors, convex: 0 },
          }),
          false,
          "resetConvexErrors"
        ),

      resetDockerErrors: () =>
        set(
          (state) => ({
            consecutiveErrors: { ...state.consecutiveErrors, docker: 0 },
          }),
          false,
          "resetDockerErrors"
        ),

      resetUserCountErrors: () =>
        set(
          (state) => ({
            consecutiveErrors: { ...state.consecutiveErrors, userCount: 0 },
          }),
          false,
          "resetUserCountErrors"
        ),

      // Polling interval management
      updateLLMPollingInterval: () => {
        const { llmStatus, consecutiveErrors } = get();
        let interval = 120000; // Default 2 minutes (further reduced frequency)

        if (
          llmStatus.status === "healthy" &&
          llmStatus.ready &&
          consecutiveErrors.llm === 0
        ) {
          interval = 300000; // 5 minutes for stable connections
        } else if (consecutiveErrors.llm > 0) {
          interval = 60000; // 1 minute when there are issues
        }

        set(
          (state) => ({
            pollingIntervals: { ...state.pollingIntervals, llm: interval },
          }),
          false,
          "updateLLMPollingInterval"
        );
      },

      updateLightweightLlmPollingInterval: () => {
        const { lightweightLlmStatus, consecutiveErrors } = get();
        let interval = 120000; // Default 2 minutes (further reduced frequency)

        if (
          lightweightLlmStatus.status === "healthy" &&
          lightweightLlmStatus.ready &&
          consecutiveErrors.lightweightLlm === 0
        ) {
          interval = 300000; // 5 minutes for stable connections
        } else if (consecutiveErrors.lightweightLlm > 0) {
          interval = 60000; // 1 minute when there are issues
        }

        set(
          (state) => ({
            pollingIntervals: {
              ...state.pollingIntervals,
              lightweightLlm: interval,
            },
          }),
          false,
          "updateLightweightLlmPollingInterval"
        );
      },

      updateConvexPollingInterval: () => {
        const { convexStatus, consecutiveErrors } = get();
        let interval = 90000; // Default 90 seconds (significantly reduced for Convex)

        if (
          convexStatus.status === "connected" &&
          convexStatus.ready &&
          consecutiveErrors.convex === 0
        ) {
          interval = 180000; // 3 minutes for stable connections
        } else if (consecutiveErrors.convex > 0) {
          interval = 60000; // 1 minute when there are issues
        }

        set(
          (state) => ({
            pollingIntervals: { ...state.pollingIntervals, convex: interval },
          }),
          false,
          "updateConvexPollingInterval"
        );
      },

      updateDockerPollingInterval: () => {
        const { dockerStatus, consecutiveErrors } = get();
        let interval = 30000; // Default 30 seconds

        if (
          dockerStatus.status === "healthy" &&
          dockerStatus.ready &&
          consecutiveErrors.docker === 0
        ) {
          interval = 60000; // 60 seconds for stable Docker systems
        } else if (consecutiveErrors.docker > 0) {
          interval = 15000; // 15 seconds when there are issues
        }

        set(
          (state) => ({
            pollingIntervals: { ...state.pollingIntervals, docker: interval },
          }),
          false,
          "updateDockerPollingInterval"
        );
      },

      updateUserCountPollingInterval: () => {
        const { userCountStatus, consecutiveErrors } = get();
        let interval = 45000; // Default 45 seconds (reduced frequency)

        if (
          userCountStatus.status === "connected" &&
          userCountStatus.ready &&
          consecutiveErrors.userCount === 0
        ) {
          interval = 90000; // 90 seconds for stable connections
        } else if (consecutiveErrors.userCount > 0) {
          interval = 30000; // 30 seconds when there are issues
        }

        set(
          (state) => ({
            pollingIntervals: {
              ...state.pollingIntervals,
              userCount: interval,
            },
          }),
          false,
          "updateUserCountPollingInterval"
        );
      },

      // Optimistic updates
      optimisticLLMUpdate: (partialStatus) => {
        const { llmStatus } = get();
        const updatedStatus = { ...llmStatus, ...partialStatus };

        set(
          (state) => ({
            llmStatus: updatedStatus,
            lastUpdated: { ...state.lastUpdated, llm: Date.now() },
          }),
          false,
          "optimisticLLMUpdate"
        );
      },

      optimisticLightweightLlmUpdate: (partialStatus) => {
        const { lightweightLlmStatus } = get();
        const updatedStatus = { ...lightweightLlmStatus, ...partialStatus };

        set(
          (state) => ({
            lightweightLlmStatus: updatedStatus,
            lastUpdated: { ...state.lastUpdated, lightweightLlm: Date.now() },
          }),
          false,
          "optimisticLightweightLlmUpdate"
        );
      },

      optimisticConvexUpdate: (partialStatus) => {
        const { convexStatus } = get();
        const updatedStatus = { ...convexStatus, ...partialStatus };

        set(
          (state) => ({
            convexStatus: updatedStatus,
            lastUpdated: { ...state.lastUpdated, convex: Date.now() },
          }),
          false,
          "optimisticConvexUpdate"
        );
      },

      optimisticDockerUpdate: (partialStatus) => {
        const { dockerStatus } = get();
        const updatedStatus = { ...dockerStatus, ...partialStatus };

        set(
          (state) => ({
            dockerStatus: updatedStatus,
            lastUpdated: { ...state.lastUpdated, docker: Date.now() },
          }),
          false,
          "optimisticDockerUpdate"
        );
      },

      optimisticUserCountUpdate: (partialStatus: Partial<UserCountStatus>) => {
        const { userCountStatus } = get();
        const updatedStatus = { ...userCountStatus, ...partialStatus };

        set(
          (state) => ({
            userCountStatus: updatedStatus,
            lastUpdated: { ...state.lastUpdated, userCount: Date.now() },
          }),
          false,
          "optimisticUserCountUpdate"
        );
      },

      // API actions
      checkLLMStatus: async () => {
        const {
          setLLMLoading,
          setLLMStatus,
          incrementLLMErrors,
          resetLLMErrors,
          updateLLMPollingInterval,
        } = get();

        setLLMLoading(true);

        try {
          const response = await fetch("/api/llm/status", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            incrementLLMErrors();
            toast.error(
              `LLM Transformer Error: ${response.status} ${response.statusText}`
            );
            setLLMStatus({
              status: "error",
              ready: false,
              message: `LLM Transformer service unavailable (${response.status})`,
              details: {
                error: `HTTP ${response.status}: ${response.statusText}`,
                timestamp: new Date().toISOString(),
              },
            });
            updateLLMPollingInterval();
            return false;
          }

          const data = await response.json();
          resetLLMErrors();
          setLLMStatus({
            status: data.status || "error",
            ready: data.ready ?? false,
            message: data.message || "LLM Transformer status unknown",
            model: data.model,
            details: {
              ...data.details,
              timestamp: new Date().toISOString(),
            },
            memory_usage: data.memory_usage, // propagate memory usage if present
          });
          updateLLMPollingInterval();
          return true;
        } catch (error) {
          incrementLLMErrors();
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Cannot connect to LLM Transformer service";
          toast.error(`LLM Transformer Error: ${errorMessage}`);
          setLLMStatus({
            status: "error",
            ready: false,
            message: "Cannot connect to LLM Transformer service",
            details: {
              error: errorMessage,
              timestamp: new Date().toISOString(),
            },
          });
          updateLLMPollingInterval();
          return false;
        } finally {
          setLLMLoading(false);
        }
      },

      checkConvexStatus: async () => {
        const {
          setConvexLoading,
          setConvexStatus,
          incrementConvexErrors,
          resetConvexErrors,
          updateConvexPollingInterval,
        } = get();

        setConvexLoading(true);

        try {
          const response = await fetch("/api/convex/status", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            incrementConvexErrors();
            setConvexStatus({
              status: "disconnected",
              ready: false,
              message: `Convex service unavailable (${response.status})`,
              details: {
                error: `HTTP ${response.status}: ${response.statusText}`,
                timestamp: new Date().toISOString(),
              },
            });
            updateConvexPollingInterval();
            return false;
          }

          const data = await response.json();
          resetConvexErrors();
          setConvexStatus({
            status: data.status || "disconnected",
            ready: data.ready || false,
            message: data.message || "Convex status unknown",
            uptime: data.uptime,
            statistics: data.statistics,
            performance: data.performance,
            details: data.details || { timestamp: new Date().toISOString() },
          });
          updateConvexPollingInterval();
          return true;
        } catch (error) {
          incrementConvexErrors();
          const errorMessage =
            error instanceof Error ? error.message : "Cannot connect to Convex";
          setConvexStatus({
            status: "disconnected",
            ready: false,
            message: "Cannot connect to Convex database",
            details: {
              error: errorMessage,
              timestamp: new Date().toISOString(),
            },
          });
          updateConvexPollingInterval();
          return false;
        } finally {
          setConvexLoading(false);
        }
      },

      checkDockerStatus: async () => {
        const {
          setDockerLoading,
          setDockerStatus,
          incrementDockerErrors,
          resetDockerErrors,
          updateDockerPollingInterval,
        } = get();

        setDockerLoading(true);

        try {
          const response = await fetch("/api/docker/status", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(10000), // Longer timeout for Docker operations
          });

          if (!response.ok) {
            incrementDockerErrors();
            setDockerStatus({
              status: "critical",
              ready: false,
              message: `Docker service unavailable (${response.status})`,
              details: {
                error: `HTTP ${response.status}: ${response.statusText}`,
                timestamp: new Date().toISOString(),
              },
            });
            updateDockerPollingInterval();
            return false;
          }

          const data = await response.json();
          resetDockerErrors();
          setDockerStatus({
            status: data.status || "critical",
            ready: data.ready || false,
            message: data.message || "Docker status unknown",
            services: data.services,
            networks: data.networks,
            resources: data.resources,
            details: data.details || { timestamp: new Date().toISOString() },
          });
          updateDockerPollingInterval();
          return true;
        } catch (error) {
          incrementDockerErrors();
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Cannot connect to Docker service";
          setDockerStatus({
            status: "critical",
            ready: false,
            message: "Cannot connect to Docker system",
            details: {
              error: errorMessage,
              timestamp: new Date().toISOString(),
            },
          });
          updateDockerPollingInterval();
          return false;
        } finally {
          setDockerLoading(false);
        }
      },

      checkLightweightLlmStatus: async () => {
        const {
          setLightweightLlmLoading,
          setLightweightLlmStatus,
          incrementLightweightLlmErrors,
          resetLightweightLlmErrors,
          updateLightweightLlmPollingInterval,
        } = get();

        setLightweightLlmLoading(true);

        try {
          const response = await fetch("/api/lightweight-llm/status", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            incrementLightweightLlmErrors();
            toast.error(`LLM Error: ${response.status} ${response.statusText}`);
            setLightweightLlmStatus({
              status: "error",
              ready: false,
              message: `LLM service unavailable (${response.status})`,
              details: {
                error: `HTTP ${response.status}: ${response.statusText}`,
                timestamp: new Date().toISOString(),
              },
            });
            updateLightweightLlmPollingInterval();
            return false;
          }

          const data = await response.json();
          resetLightweightLlmErrors();
          setLightweightLlmStatus({
            status: data.status || "error",
            ready: data.ready ?? false,
            message: data.message || "LLM status unknown",
            model: data.model,
            memory_usage: data.memory_usage,
            details: {
              ...data.details,
              timestamp: new Date().toISOString(),
            },
          });
          updateLightweightLlmPollingInterval();
          return true;
        } catch (error) {
          incrementLightweightLlmErrors();
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Cannot connect to LLM service";
          toast.error(`LLM Error: ${errorMessage}`);
          setLightweightLlmStatus({
            status: "error",
            ready: false,
            message: "Cannot connect to LLM service",
            details: {
              error: errorMessage,
              timestamp: new Date().toISOString(),
            },
          });
          updateLightweightLlmPollingInterval();
          return false;
        } finally {
          setLightweightLlmLoading(false);
        }
      },

      checkUserCountStatus: async () => {
        const {
          setUserCountLoading,
          setUserCountStatus,
          incrementUserCountErrors,
          resetUserCountErrors,
          updateUserCountPollingInterval,
        } = get();

        setUserCountLoading(true);

        try {
          const response = await fetch("/api/users/active-count", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            incrementUserCountErrors();
            setUserCountStatus({
              status: "error",
              ready: false,
              message: `User count service unavailable (${response.status})`,
              activeUsers: 0,
              details: {
                error: `HTTP ${response.status}: ${response.statusText}`,
                timestamp: new Date().toISOString(),
              },
            });
            updateUserCountPollingInterval();
            return false;
          }

          const response_data = await response.json();
          const data = response_data.data || response_data; // Handle both wrapped and unwrapped responses
          resetUserCountErrors();
          setUserCountStatus({
            status: "connected",
            ready: true,
            message: `${data.activeUsers || 0} active users`,
            activeUsers: data.activeUsers || 0,
            bySource: data.bySource,
            details: {
              sourceBreakdown: data.bySource,
              timestamp: new Date().toISOString(),
            },
          });
          updateUserCountPollingInterval();
          return true;
        } catch (error) {
          incrementUserCountErrors();
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Cannot connect to user count service";
          setUserCountStatus({
            status: "error",
            ready: false,
            message: "Cannot connect to user count service",
            activeUsers: 0,
            details: {
              error: errorMessage,
              timestamp: new Date().toISOString(),
            },
          });
          updateUserCountPollingInterval();
          return false;
        } finally {
          setUserCountLoading(false);
        }
      },

      checkAllStatus: async () => {
        const {
          checkLLMStatus,
          checkLightweightLlmStatus,
          checkConvexStatus,
          checkDockerStatus,
          checkUserCountStatus,
        } = get();

        const [
          llmResult,
          lightweightLlmResult,
          convexResult,
          dockerResult,
          userCountResult,
        ] = await Promise.allSettled([
          checkLLMStatus(),
          checkLightweightLlmStatus(),
          checkConvexStatus(),
          checkDockerStatus(),
          checkUserCountStatus(),
        ]);

        return {
          llm: llmResult.status === "fulfilled" ? llmResult.value : false,
          lightweightLlm:
            lightweightLlmResult.status === "fulfilled"
              ? lightweightLlmResult.value
              : false,
          convex:
            convexResult.status === "fulfilled" ? convexResult.value : false,
          docker:
            dockerResult.status === "fulfilled" ? dockerResult.value : false,
          userCount:
            userCountResult.status === "fulfilled"
              ? userCountResult.value
              : false,
        };
      },

      // Utility getters
      getSystemHealth: () => {
        const {
          llmStatus,
          lightweightLlmStatus,
          convexStatus,
          dockerStatus,
          userCountStatus,
        } = get();

        const llmHealthy = llmStatus.status === "healthy" && llmStatus.ready;
        const lightweightLlmHealthy =
          lightweightLlmStatus.status === "healthy" &&
          lightweightLlmStatus.ready;
        const convexHealthy =
          convexStatus.status === "connected" && convexStatus.ready;
        const dockerHealthy =
          dockerStatus.status === "healthy" && dockerStatus.ready;
        const userCountHealthy =
          userCountStatus.status === "connected" && userCountStatus.ready;

        const healthyCount = [
          llmHealthy,
          lightweightLlmHealthy,
          convexHealthy,
          dockerHealthy,
          userCountHealthy,
        ].filter(Boolean).length;

        if (healthyCount === 5) return "healthy";
        if (healthyCount >= 3) return "degraded";
        return "critical";
      },

      isSystemReady: () => {
        const {
          llmStatus,
          lightweightLlmStatus,
          convexStatus,
          dockerStatus,
          userCountStatus,
        } = get();
        return (
          llmStatus.ready &&
          lightweightLlmStatus.ready &&
          convexStatus.ready &&
          dockerStatus.ready &&
          userCountStatus.ready
        );
      },
    }),
    {
      name: "status-store",
    }
  )
);

export type {
  LLMStatus,
  LightweightLLMStatus,
  ConvexStatus,
  DockerStatus,
  UserCountStatus,
  DockerService,
  DockerNetwork,
  DockerResources,
  SystemStatus,
};
