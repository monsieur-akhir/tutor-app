import { api } from '../lib/api';

export interface CreateEvaluationDto {
  sessionId: string;
  rating: number; // 1-5
  comment?: string;
  categories: {
    teachingQuality: number;
    communication: number;
    punctuality: number;
    knowledge: number;
    overall: number;
  };
  tags?: string[];
  isAnonymous?: boolean;
}

export interface UpdateEvaluationDto {
  rating?: number;
  comment?: string;
  categories?: {
    teachingQuality?: number;
    communication?: number;
    punctuality?: number;
    knowledge?: number;
    overall?: number;
  };
  tags?: string[];
}

export interface Evaluation {
  id: string;
  sessionId: string;
  providerId: string;
  studentId: string;
  rating: number;
  comment?: string;
  categories: {
    teachingQuality: number;
    communication: number;
    punctuality: number;
    knowledge: number;
    overall: number;
  };
  tags?: string[];
  isAnonymous: boolean;
  isPublic: boolean;
  isModerated: boolean;
  helpfulCount: number;
  reportCount: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  session?: {
    id: string;
    subject: string;
    duration: number;
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

export interface EvaluationQueryDto {
  page?: number;
  limit?: number;
  providerId?: string;
  studentId?: string;
  sessionId?: string;
  minRating?: number;
  maxRating?: number;
  tags?: string[];
  isPublic?: boolean;
  sortBy?: 'rating' | 'createdAt' | 'helpfulCount';
  sortOrder?: 'asc' | 'desc';
}

export interface EvaluationResponse {
  data: Evaluation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EvaluationStats {
  total: number;
  averageRating: number;
  ratingDistribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  categoryAverages: {
    teachingQuality: number;
    communication: number;
    punctuality: number;
    knowledge: number;
    overall: number;
  };
  totalTags: number;
  topTags: { tag: string; count: number }[];
}

export class EvaluationService {
  // Créer une évaluation
  static async createEvaluation(evaluationData: CreateEvaluationDto): Promise<Evaluation> {
    const response = await api.post<Evaluation>('/evaluations', evaluationData);
    return response.data;
  }

  // Obtenir une évaluation par ID
  static async getEvaluation(id: string): Promise<Evaluation> {
    const response = await api.get<Evaluation>(`/evaluations/${id}`);
    return response.data;
  }

  // Obtenir toutes les évaluations avec pagination
  static async getEvaluations(query: EvaluationQueryDto = {}): Promise<EvaluationResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    const response = await api.get<EvaluationResponse>(`/evaluations?${params.toString()}`);
    return response.data;
  }

  // Obtenir les évaluations d'un fournisseur
  static async getProviderEvaluations(providerId: string, query: EvaluationQueryDto = {}): Promise<EvaluationResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    const response = await api.get<EvaluationResponse>(`/evaluations/provider/${providerId}?${params.toString()}`);
    return response.data;
  }

  // Obtenir les évaluations d'un étudiant
  static async getStudentEvaluations(studentId: string, query: EvaluationQueryDto = {}): Promise<EvaluationResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    const response = await api.get<EvaluationResponse>(`/evaluations/student/${studentId}?${params.toString()}`);
    return response.data;
  }

  // Mettre à jour une évaluation
  static async updateEvaluation(id: string, updateData: UpdateEvaluationDto): Promise<Evaluation> {
    const response = await api.put<Evaluation>(`/evaluations/${id}`, updateData);
    return response.data;
  }

  // Supprimer une évaluation
  static async deleteEvaluation(id: string): Promise<void> {
    await api.delete(`/evaluations/${id}`);
  }

  // Marquer une évaluation comme utile
  static async markHelpful(id: string): Promise<Evaluation> {
    const response = await api.patch<Evaluation>(`/evaluations/${id}/helpful`);
    return response.data;
  }

  // Signaler une évaluation
  static async reportEvaluation(id: string, reason: string): Promise<void> {
    await api.post(`/evaluations/${id}/report`, { reason });
  }

  // Modérer une évaluation (admin)
  static async moderateEvaluation(id: string, action: 'approve' | 'reject' | 'hide', reason?: string): Promise<Evaluation> {
    const response = await api.patch<Evaluation>(`/evaluations/${id}/moderate`, { action, reason });
    return response.data;
  }

  // Obtenir les statistiques d'évaluation
  static async getEvaluationStats(): Promise<EvaluationStats> {
    const response = await api.get<EvaluationStats>('/evaluations/stats');
    return response.data;
  }

  // Obtenir les statistiques d'évaluation pour un fournisseur
  static async getProviderEvaluationStats(providerId: string): Promise<EvaluationStats> {
    const response = await api.get<EvaluationStats>(`/evaluations/stats/provider/${providerId}`);
    return response.data;
  }

  // Obtenir les tags populaires
  static async getPopularTags(limit: number = 20): Promise<{ tag: string; count: number }[]> {
    const response = await api.get<{ tags: { tag: string; count: number }[] }>(`/evaluations/tags/popular?limit=${limit}`);
    return response.data.tags;
  }

  // Rechercher des évaluations par tag
  static async searchByTag(tag: string, query: EvaluationQueryDto = {}): Promise<EvaluationResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    const response = await api.get<EvaluationResponse>(`/evaluations/tag/${encodeURIComponent(tag)}?${params.toString()}`);
    return response.data;
  }
}
