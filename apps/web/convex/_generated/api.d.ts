/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as api_ from "../api.js";
import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as embeddings from "../embeddings.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as messagesThread from "../messagesThread.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as ragChat from "../ragChat.js";
import type * as ragSearch from "../ragSearch.js";
import type * as serviceStatus from "../serviceStatus.js";
import type * as threads from "../threads.js";
import type * as userSessions from "../userSessions.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  api: typeof api_;
  crons: typeof crons;
  documents: typeof documents;
  embeddings: typeof embeddings;
  http: typeof http;
  messages: typeof messages;
  messagesThread: typeof messagesThread;
  migrations: typeof migrations;
  notifications: typeof notifications;
  ragChat: typeof ragChat;
  ragSearch: typeof ragSearch;
  serviceStatus: typeof serviceStatus;
  threads: typeof threads;
  userSessions: typeof userSessions;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
