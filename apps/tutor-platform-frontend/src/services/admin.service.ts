import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  profile?: {
    bio?: string;
    skills?: string[];
    languages?: string[];
    hourlyRate?: number;
    rating?: number;
    totalSessions?: number;
    location?: string;
    experience?: number;
    isAvailable?: boolean;
  };
}

export interface UserQueryDto {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  sortBy?: 'createdAt' | 'email' | 'firstName' | 'lastName' | 'role';
  sortOrder?: 'asc' | 'desc';
}

export interface UserResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminStats {
  users: {
    total: number;
    byRole: { [key: string]: number };
    byStatus: { [key: string]: number };
    newThisMonth: number;
    activeThisMonth: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    thisMonth: number;
  };
  sessions: {
    total: number;
    scheduled: number;
    active: number;
    completed: number;
    cancelled: number;
    totalDuration: number;
    thisMonth: number;
  };
  payments: {
    total: number;
    pending: number;
    confirmed: number;
    rejected: number;
    totalAmount: number;
    thisMonth: number;
  };
  evaluations: {
    total: number;
    averageRating: number;
    thisMonth: number;
  };
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'critical';
    responseTime: number;
    connections: number;
  };
  redis: {
    status: 'healthy' | 'warning' | 'critical';
    responseTime: number;
    memory: number;
  };
  storage: {
    status: 'healthy' | 'warning' | 'critical';
    usedSpace: number;
    totalSpace: number;
  };
  api: {
    status: 'healthy' | 'warning' | 'critical';
    responseTime: number;
    errorRate: number;
  };
  overall: 'healthy' | 'warning' | 'critical';
}

export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface LogQueryDto {
  page?: number;
  limit?: number;
  level?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface LogResponse {
  data: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AdminService {
  // Obtenir tous les utilisateurs
  static async getUsers(query: UserQueryDto = {}): Promise<UserResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<UserResponse>(`/admin/users?${params.toString()}`);
    return response.data;
  }

  // Obtenir un utilisateur par ID
  static async getUser(id: string): Promise<User> {
    const response = await api.get<User>(`/admin/users/${id}`);
    return response.data;
  }

  // Mettre à jour un utilisateur
  static async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const response = await api.put<User>(`/admin/users/${id}`, updateData);
    return response.data;
  }

  // Désactiver un utilisateur
  static async deactivateUser(id: string, reason?: string): Promise<User> {
    const response = await api.patch<User>(`/admin/users/${id}/deactivate`, { reason });
    return response.data;
  }

  // Réactiver un utilisateur
  static async reactivateUser(id: string): Promise<User> {
    const response = await api.patch<User>(`/admin/users/${id}/reactivate`);
    return response.data;
  }

  // Supprimer un utilisateur
  static async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  }

  // Changer le rôle d'un utilisateur
  static async changeUserRole(id: string, newRole: string): Promise<User> {
    const response = await api.patch<User>(`/admin/users/${id}/role`, { role: newRole });
    return response.data;
  }

  // Obtenir les statistiques d'administration
  static async getAdminStats(): Promise<AdminStats> {
    const response = await api.get<AdminStats>('/admin/stats');
    return response.data;
  }

  // Obtenir la santé du système
  static async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get<SystemHealth>('/admin/health');
    return response.data;
  }

  // Obtenir les logs système
  static async getSystemLogs(query: LogQueryDto = {}): Promise<LogResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<LogResponse>(`/admin/logs?${params.toString()}`);
    return response.data;
  }

  // Obtenir un log spécifique
  static async getLog(id: string): Promise<LogEntry> {
    const response = await api.get<LogEntry>(`/admin/logs/${id}`);
    return response.data;
  }

  // Exporter les logs
  static async exportLogs(query: LogQueryDto = {}, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    params.append('format', format);
    
    const response = await api.get(`/admin/logs/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Vider les anciens logs
  static async clearOldLogs(daysOld: number): Promise<void> {
    await api.delete(`/admin/logs/clear?daysOld=${daysOld}`);
  }

  // Obtenir les métriques de performance
  static async getPerformanceMetrics(startDate: string, endDate: string): Promise<{
    apiResponseTime: number[];
    databaseQueryTime: number[];
    memoryUsage: number[];
    cpuUsage: number[];
    activeUsers: number[];
    requestsPerMinute: number[];
  }> {
    const response = await api.get(`/admin/metrics/performance?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  }

  // Redémarrer les services
  static async restartService(service: 'api' | 'database' | 'redis' | 'storage'): Promise<void> {
    await api.post(`/admin/services/${service}/restart`);
  }

  // Sauvegarder la base de données
  static async backupDatabase(): Promise<{ backupId: string; downloadUrl: string }> {
    const response = await api.post('/admin/database/backup');
    return response.data;
  }

  // Restaurer la base de données
  static async restoreDatabase(backupId: string): Promise<void> {
    await api.post(`/admin/database/restore/${backupId}`);
  }

  // Obtenir les informations de la base de données
  static async getDatabaseInfo(): Promise<{
    version: string;
    size: number;
    tables: { name: string; rows: number; size: number }[];
    connections: number;
    uptime: number;
  }> {
    const response = await api.get('/admin/database/info');
    return response.data;
  }

  // Optimiser la base de données
  static async optimizeDatabase(): Promise<void> {
    await api.post('/admin/database/optimize');
  }

  // Obtenir les informations de stockage
  static async getStorageInfo(): Promise<{
    totalSpace: number;
    usedSpace: number;
    availableSpace: number;
    files: number;
    directories: number;
  }> {
    const response = await api.get('/admin/storage/info');
    return response.data;
  }

  // Nettoyer le stockage
  static async cleanupStorage(): Promise<{
    deletedFiles: number;
    freedSpace: number;
  }> {
    const response = await api.post('/admin/storage/cleanup');
    return response.data;
  }
}
