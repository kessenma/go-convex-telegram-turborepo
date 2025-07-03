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
import type * as documentApi from "../documentApi.js";
import type * as documents from "../documents.js";
import type * as embeddingApi from "../embeddingApi.js";
import type * as embeddings from "../embeddings.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as messagesThread from "../messagesThread.js";
import type * as telegram from "../telegram.js";
import type * as threads from "../threads.js";

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
  documentApi: typeof documentApi;
  documents: typeof documents;
  embeddingApi: typeof embeddingApi;
  embeddings: typeof embeddings;
  http: typeof http;
  messages: typeof messages;
  messagesThread: typeof messagesThread;
  telegram: typeof telegram;
  threads: typeof threads;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
