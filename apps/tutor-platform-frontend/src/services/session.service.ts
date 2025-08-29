import { api } from '../lib/api';

export interface CreateSessionDto {
  bookingId: string;
  roomName?: string;
  roomUrl?: string;
  metadata?: Record<string, any>;
}

export interface UpdateSessionDto {
  roomName?: string;
  roomUrl?: string;
  metadata?: Record<string, any>;
  actualStartTime?: string;
  actualEndTime?: string;
  actualDuration?: number;
  status?: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface Session {
  id: string;
  bookingId: string;
  providerId: string;
  studentId: string;
  startTime: string;
  endTime: string;
  duration: number;
  roomName?: string;
  roomUrl?: string;
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  metadata?: Record<string, any>;
  recordingStatus: 'not_started' | 'recording' | 'paused' | 'completed' | 'failed';
  participants: string[];
  timezone: string;
  actualStartTime?: string;
  actualEndTime?: string;
  actualDuration?: number;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    subject: string;
    sessionType: 'online' | 'offline' | 'hybrid';
  };
  provider?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SessionQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  providerId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface SessionResponse {
  data: Session[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SessionToken {
  token: string;
  roomName: string;
  participantName: string;
  expiresAt: string;
}

export class SessionService {
  // Créer une session
  static async createSession(sessionData: CreateSessionDto): Promise<Session> {
    const response = await api.post<Session>('/sessions', sessionData);
    return response.data;
  }

  // Obtenir une session par ID
  static async getSession(id: string): Promise<Session> {
    const response = await api.get<Session>(`/sessions/${id}`);
    return response.data;
  }

  // Obtenir toutes les sessions avec pagination
  static async getSessions(query: SessionQueryDto = {}): Promise<SessionResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<SessionResponse>(`/sessions?${params.toString()}`);
    return response.data;
  }

  // Obtenir les sessions d'un fournisseur
  static async getProviderSessions(providerId: string, query: SessionQueryDto = {}): Promise<SessionResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<SessionResponse>(`/sessions/provider/${providerId}?${params.toString()}`);
    return response.data;
  }

  // Obtenir les sessions d'un étudiant
  static async getStudentSessions(studentId: string, query: SessionQueryDto = {}): Promise<SessionResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<SessionResponse>(`/sessions/student/${studentId}?${params.toString()}`);
    return response.data;
  }

  // Mettre à jour une session
  static async updateSession(id: string, updateData: UpdateSessionDto): Promise<Session> {
    const response = await api.put<Session>(`/sessions/${id}`, updateData);
    return response.data;
  }

  // Démarrer une session
  static async startSession(id: string): Promise<Session> {
    const response = await api.patch<Session>(`/sessions/${id}/start`);
    return response.data;
  }

  // Mettre en pause une session
  static async pauseSession(id: string): Promise<Session> {
    const response = await api.patch<Session>(`/sessions/${id}/pause`);
    return response.data;
  }

  // Reprendre une session
  static async resumeSession(id: string): Promise<Session> {
    const response = await api.patch<Session>(`/sessions/${id}/resume`);
    return response.data;
  }

  // Terminer une session
  static async endSession(id: string): Promise<Session> {
    const response = await api.patch<Session>(`/sessions/${id}/end`);
    return response.data;
  }

  // Annuler une session
  static async cancelSession(id: string, reason?: string): Promise<Session> {
    const response = await api.patch<Session>(`/sessions/${id}/cancel`, { reason });
    return response.data;
  }

  // Supprimer une session
  static async deleteSession(id: string): Promise<void> {
    await api.delete(`/sessions/${id}`);
  }

  // Obtenir un token de session
  static async getSessionToken(sessionId: string, participantName: string): Promise<SessionToken> {
    const response = await api.post<SessionToken>(`/sessions/${sessionId}/token`, { participantName });
    return response.data;
  }

  // Valider un token de session
  static async validateSessionToken(sessionId: string, token: string): Promise<boolean> {
    try {
      await api.post(`/sessions/${sessionId}/validate-token`, { token });
      return true;
    } catch {
      return false;
    }
  }

  // Obtenir les statistiques de session
  static async getSessionStats(userId: string): Promise<{
    total: number;
    scheduled: number;
    active: number;
    completed: number;
    cancelled: number;
    totalDuration: number;
  }> {
    const response = await api.get(`/sessions/stats/${userId}`);
    return response.data;
  }
}
