// API utility functions for the frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Generic API call function
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(
      `API call failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// Message API functions
export const messageApi = {
  getMessages: (params?: { chatId?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.chatId) searchParams.append("chatId", params.chatId.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    return apiCall(`/api/messages?${searchParams}`);
  },

  sendMessage: (data: any) => {
    return apiCall("/api/messages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Thread API functions
export const threadApi = {
  getThreads: (params?: { chatId?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.chatId) searchParams.append("chatId", params.chatId.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    return apiCall(`/api/threads?${searchParams}`);
  },

  getThreadById: (threadDocId: string) => {
    const searchParams = new URLSearchParams();
    searchParams.append("threadDocId", threadDocId);

    return apiCall(`/api/threads?${searchParams}`);
  },

  getThreadStats: () => {
    return apiCall("/api/threads/stats");
  },
};

// Document API functions
export const documentApi = {
  getDocuments: (params?: { limit?: number; cursor?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.cursor) searchParams.append("cursor", params.cursor);

    return apiCall(`/api/documents?${searchParams}`);
  },

  uploadDocument: (data: any) => {
    return apiCall("/api/documents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getDocumentStats: () => {
    return apiCall("/api/documents/stats");
  },
};

// WebSocket connection for real-time updates
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private url: string) {}

  connect(onMessage?: (data: any) => void, onError?: (error: Event) => void) {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.attemptReconnect(onMessage, onError);
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError?.(error);
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      onError?.(error as Event);
    }
  }

  private attemptReconnect(
    onMessage?: (data: any) => void,
    onError?: (error: Event) => void
  ) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect(onMessage, onError);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error("WebSocket is not connected");
    }
  }
}
