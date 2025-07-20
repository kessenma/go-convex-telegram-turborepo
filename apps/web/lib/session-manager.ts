// Simple in-memory session management for Python services
// This prevents concurrent usage of the lightweight LLM and vector conversion services

interface ServiceSession {
  serviceId: string;
  sessionId: string;
  startTime: number;
  lastActivity: number;
}

class SessionManager {
  private sessions: Map<string, ServiceSession> = new Map();
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes timeout

  // Service IDs
  static readonly LIGHTWEIGHT_LLM = "lightweight-llm";
  static readonly VECTOR_CONVERT = "vector-convert";

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [serviceId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.sessions.delete(serviceId);
        console.log(`Session expired for service: ${serviceId}`);
      }
    }
  }

  public acquireService(serviceId: string): {
    success: boolean;
    sessionId?: string;
    message?: string;
  } {
    this.cleanupExpiredSessions();

    const existingSession = this.sessions.get(serviceId);
    if (existingSession) {
      return {
        success: false,
        message: `Someone else is using the ${this.getServiceDisplayName(serviceId)} right now. Please try again in a minute or two.`,
      };
    }

    const sessionId = this.generateSessionId();
    const now = Date.now();

    this.sessions.set(serviceId, {
      serviceId,
      sessionId,
      startTime: now,
      lastActivity: now,
    });

    console.log(`Service acquired: ${serviceId} with session: ${sessionId}`);
    return { success: true, sessionId };
  }

  public releaseService(serviceId: string, sessionId: string): boolean {
    const session = this.sessions.get(serviceId);
    if (session && session.sessionId === sessionId) {
      this.sessions.delete(serviceId);
      console.log(`Service released: ${serviceId} with session: ${sessionId}`);
      return true;
    }
    return false;
  }

  public updateActivity(serviceId: string, sessionId: string): boolean {
    const session = this.sessions.get(serviceId);
    if (session && session.sessionId === sessionId) {
      session.lastActivity = Date.now();
      return true;
    }
    return false;
  }

  public isServiceAvailable(serviceId: string): boolean {
    this.cleanupExpiredSessions();
    return !this.sessions.has(serviceId);
  }

  public getServiceStatus(serviceId: string): {
    available: boolean;
    message?: string;
  } {
    this.cleanupExpiredSessions();
    const session = this.sessions.get(serviceId);

    if (session) {
      return {
        available: false,
        message: `Someone else is using the ${this.getServiceDisplayName(serviceId)} right now. Please try again in a minute or two.`,
      };
    }

    return { available: true };
  }

  private getServiceDisplayName(serviceId: string): string {
    switch (serviceId) {
      case SessionManager.LIGHTWEIGHT_LLM:
        return "chat service";
      case SessionManager.VECTOR_CONVERT:
        return "document conversion service";
      default:
        return "service";
    }
  }

  public getAllSessions(): ServiceSession[] {
    this.cleanupExpiredSessions();
    return Array.from(this.sessions.values());
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
export { SessionManager };
