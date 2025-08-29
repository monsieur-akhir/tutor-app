import { Session, SessionStatus, SessionType } from '../../common/entities/session.entity';
import { CreateSessionDto, UpdateSessionDto, SessionQueryDto } from '../dto/session.dto';

export interface ISessionService {
  createSession(createSessionDto: CreateSessionDto, userId: string): Promise<Session>;
  getSessionById(id: string): Promise<Session>;
  getSessions(query: SessionQueryDto): Promise<{ sessions: Session[]; total: number }>;
  updateSession(id: string, updateSessionDto: UpdateSessionDto, userId: string): Promise<Session>;
  deleteSession(id: string, userId: string): Promise<void>;
  startSession(id: string, userId: string): Promise<Session>;
  endSession(id: string, userId: string): Promise<Session>;
  pauseSession(id: string, userId: string): Promise<Session>;
  resumeSession(id: string, userId: string): Promise<Session>;
  cancelSession(id: string, userId: string, reason?: string): Promise<Session>;
  getSessionsByUser(userId: string, role: 'provider' | 'student'): Promise<Session[]>;
  getSessionsByBooking(bookingId: string): Promise<Session[]>;
  getUpcomingSessions(userId: string, limit?: number): Promise<Session[]>;
  getActiveSessions(): Promise<Session[]>;
}

export interface ISessionTokenService {
  generateSessionToken(sessionId: string, userId: string, role: string): Promise<string>;
  validateSessionToken(token: string): Promise<{ sessionId: string; userId: string; role: string }>;
  revokeSessionToken(token: string): Promise<void>;
}

export interface ISessionRecordingService {
  startRecording(sessionId: string, userId: string): Promise<void>;
  stopRecording(sessionId: string, userId: string): Promise<void>;
  getRecordings(sessionId: string): Promise<any[]>;
  deleteRecording(recordingId: string, userId: string): Promise<void>;
}

export interface ISessionFeedbackService {
  createFeedback(sessionId: string, feedbackData: any, userId: string): Promise<any>;
  getSessionFeedback(sessionId: string): Promise<any[]>;
  updateFeedback(feedbackId: string, feedbackData: any, userId: string): Promise<any>;
  deleteFeedback(feedbackId: string, userId: string): Promise<void>;
}

export interface ISessionValidationService {
  validateSessionCreation(createSessionDto: CreateSessionDto, userId: string): Promise<boolean>;
  validateSessionAccess(sessionId: string, userId: string): Promise<boolean>;
  validateSessionModification(sessionId: string, userId: string): Promise<boolean>;
  checkTimeConflicts(providerId: string, startTime: Date, endTime: Date, excludeSessionId?: string): Promise<boolean>;
}

export interface ISessionNotificationService {
  notifySessionCreated(session: Session): Promise<void>;
  notifySessionUpdated(session: Session, changes: Partial<Session>): Promise<void>;
  notifySessionCancelled(session: Session, reason: string): Promise<void>;
  notifySessionStarting(session: Session): Promise<void>;
  notifySessionEnded(session: Session): Promise<void>;
}

export interface ISessionAnalyticsService {
  getSessionStats(userId: string, period: string): Promise<any>;
  getSessionMetrics(sessionId: string): Promise<any>;
  getProviderPerformance(providerId: string, period: string): Promise<any>;
  getStudentProgress(studentId: string, period: string): Promise<any>;
}
