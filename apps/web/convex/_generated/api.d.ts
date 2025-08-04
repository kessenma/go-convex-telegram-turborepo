/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as conversations_index from "../conversations/index.js";
import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as embeddings from "../embeddings.js";
import type * as generalChat from "../generalChat.js";
import type * as http from "../http.js";
import type * as https_endpoints_ai_chat_index from "../https_endpoints/ai_chat/index.js";
import type * as https_endpoints_documents_index from "../https_endpoints/documents/index.js";
import type * as https_endpoints_embedding_index from "../https_endpoints/embedding/index.js";
import type * as https_endpoints_monitoring_index from "../https_endpoints/monitoring/index.js";
import type * as https_endpoints_notifications_index from "../https_endpoints/notifications/index.js";
import type * as https_endpoints_shared_ip_utils from "../https_endpoints/shared/ip_utils.js";
import type * as https_endpoints_shared_utils from "../https_endpoints/shared/utils.js";
import type * as https_endpoints_telegram_index from "../https_endpoints/telegram/index.js";
import type * as messages from "../messages.js";
import type * as messagesThread from "../messagesThread.js";
import type * as migrations_01_2024_01_01_initial_setup from "../migrations/01_2024_01_01_initial_setup.js";
import type * as migrations__template from "../migrations/_template.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as presence from "../presence.js";
import type * as ragChat from "../ragChat.js";
import type * as serviceStatus from "../serviceStatus.js";
import type * as shared from "../shared.js";
import type * as threads from "../threads.js";
import type * as userSessions from "../userSessions.js";
import type * as vectorSearch from "../vectorSearch.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "conversations/index": typeof conversations_index;
  conversations: typeof conversations;
  crons: typeof crons;
  documents: typeof documents;
  embeddings: typeof embeddings;
  generalChat: typeof generalChat;
  http: typeof http;
  "https_endpoints/ai_chat/index": typeof https_endpoints_ai_chat_index;
  "https_endpoints/documents/index": typeof https_endpoints_documents_index;
  "https_endpoints/embedding/index": typeof https_endpoints_embedding_index;
  "https_endpoints/monitoring/index": typeof https_endpoints_monitoring_index;
  "https_endpoints/notifications/index": typeof https_endpoints_notifications_index;
  "https_endpoints/shared/ip_utils": typeof https_endpoints_shared_ip_utils;
  "https_endpoints/shared/utils": typeof https_endpoints_shared_utils;
  "https_endpoints/telegram/index": typeof https_endpoints_telegram_index;
  messages: typeof messages;
  messagesThread: typeof messagesThread;
  "migrations/01_2024_01_01_initial_setup": typeof migrations_01_2024_01_01_initial_setup;
  "migrations/_template": typeof migrations__template;
  migrations: typeof migrations;
  notifications: typeof notifications;
  presence: typeof presence;
  ragChat: typeof ragChat;
  serviceStatus: typeof serviceStatus;
  shared: typeof shared;
  threads: typeof threads;
  userSessions: typeof userSessions;
  vectorSearch: typeof vectorSearch;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; names?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      migrate: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
  };
  presence: {
    public: {
      disconnect: FunctionReference<
        "mutation",
        "internal",
        { sessionToken: string },
        null
      >;
      heartbeat: FunctionReference<
        "mutation",
        "internal",
        {
          interval?: number;
          roomId: string;
          sessionId: string;
          userId: string;
        },
        { roomToken: string; sessionToken: string }
      >;
      list: FunctionReference<
        "query",
        "internal",
        { limit?: number; roomToken: string },
        Array<{ lastDisconnected: number; online: boolean; userId: string }>
      >;
      listRoom: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; roomId: string },
        Array<{ lastDisconnected: number; online: boolean; userId: string }>
      >;
      listUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; userId: string },
        Array<{ lastDisconnected: number; online: boolean; roomId: string }>
      >;
      removeRoom: FunctionReference<
        "mutation",
        "internal",
        { roomId: string },
        null
      >;
      removeRoomUser: FunctionReference<
        "mutation",
        "internal",
        { roomId: string; userId: string },
        null
      >;
    };
  };
};
