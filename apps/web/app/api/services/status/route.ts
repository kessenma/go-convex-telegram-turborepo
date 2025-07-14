import { NextRequest, NextResponse } from 'next/server';
import { sessionManager, SessionManager } from '../../../../lib/session-manager';

export async function GET(request: NextRequest) {
  try {
    const chatStatus = sessionManager.getServiceStatus(SessionManager.LIGHTWEIGHT_LLM);
    const vectorStatus = sessionManager.getServiceStatus(SessionManager.VECTOR_CONVERT);
    const allSessions = sessionManager.getAllSessions();

    return NextResponse.json({
      services: {
        chat: {
          id: SessionManager.LIGHTWEIGHT_LLM,
          name: 'Chat Service',
          available: chatStatus.available,
          message: chatStatus.message
        },
        vectorConvert: {
          id: SessionManager.VECTOR_CONVERT,
          name: 'Document Conversion Service',
          available: vectorStatus.available,
          message: vectorStatus.message
        }
      },
      activeSessions: allSessions.map(session => ({
        serviceId: session.serviceId,
        sessionId: session.sessionId,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        duration: Date.now() - session.startTime
      })),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 }
    );
  }
}
