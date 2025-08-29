import { api } from '../lib/api';

export interface CreateNotificationDto {
  userId: string;
  type: 'booking' | 'session' | 'payment' | 'evaluation' | 'system' | 'reminder';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: string;
}

export interface UpdateNotificationDto {
  isRead?: boolean;
  isArchived?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'booking' | 'session' | 'payment' | 'evaluation' | 'system' | 'reminder';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  isArchived: boolean;
  scheduledFor?: string;
  readAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationQueryDto {
  page?: number;
  limit?: number;
  type?: string;
  priority?: string;
  isRead?: boolean;
  isArchived?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'priority' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  archived: number;
  byType: {
    [key: string]: number;
  };
  byPriority: {
    [key: string]: number;
  };
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  types: {
    booking: boolean;
    session: boolean;
    payment: boolean;
    evaluation: boolean;
    system: boolean;
    reminder: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export class NotificationService {
  // Créer une notification
  static async createNotification(notificationData: CreateNotificationDto): Promise<Notification> {
    const response = await api.post<Notification>('/notifications', notificationData);
    return response.data;
  }

  // Obtenir une notification par ID
  static async getNotification(id: string): Promise<Notification> {
    const response = await api.get<Notification>(`/notifications/${id}`);
    return response.data;
  }

  // Obtenir toutes les notifications d'un utilisateur
  static async getUserNotifications(userId: string, query: NotificationQueryDto = {}): Promise<NotificationResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<NotificationResponse>(`/notifications/user/${userId}?${params.toString()}`);
    return response.data;
  }

  // Obtenir les notifications non lues
  static async getUnreadNotifications(userId: string, query: NotificationQueryDto = {}): Promise<NotificationResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<NotificationResponse>(`/notifications/user/${userId}/unread?${params.toString()}`);
    return response.data;
  }

  // Mettre à jour une notification
  static async updateNotification(id: string, updateData: UpdateNotificationDto): Promise<Notification> {
    const response = await api.put<Notification>(`/notifications/${id}`, updateData);
    return response.data;
  }

  // Marquer une notification comme lue
  static async markAsRead(id: string): Promise<Notification> {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(userId: string): Promise<void> {
    await api.patch(`/notifications/user/${userId}/read-all`);
  }

  // Archiver une notification
  static async archiveNotification(id: string): Promise<Notification> {
    const response = await api.patch<Notification>(`/notifications/${id}/archive`);
    return response.data;
  }

  // Supprimer une notification
  static async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  }

  // Supprimer toutes les notifications archivées
  static async deleteArchivedNotifications(userId: string): Promise<void> {
    await api.delete(`/notifications/user/${userId}/archived`);
  }

  // Obtenir les statistiques de notification
  static async getNotificationStats(userId: string): Promise<NotificationStats> {
    const response = await api.get<NotificationStats>(`/notifications/stats/${userId}`);
    return response.data;
  }

  // Obtenir les préférences de notification
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const response = await api.get<NotificationPreferences>(`/notifications/preferences/${userId}`);
    return response.data;
  }

  // Mettre à jour les préférences de notification
  static async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await api.put<NotificationPreferences>(`/notifications/preferences/${userId}`, preferences);
    return response.data;
  }

  // Envoyer une notification de test
  static async sendTestNotification(userId: string, type: string): Promise<void> {
    await api.post(`/notifications/test/${userId}`, { type });
  }

  // S'abonner aux notifications push
  static async subscribeToPushNotifications(userId: string, subscription: any): Promise<void> {
    await api.post(`/notifications/push/subscribe/${userId}`, subscription);
  }

  // Se désabonner des notifications push
  static async unsubscribeFromPushNotifications(userId: string): Promise<void> {
    await api.post(`/notifications/push/unsubscribe/${userId}`);
  }

  // Envoyer une notification en masse (admin)
  static async sendBulkNotification(userIds: string[], notificationData: Omit<CreateNotificationDto, 'userId'>): Promise<void> {
    await api.post('/notifications/bulk', { userIds, ...notificationData });
  }

  // Programmer une notification
  static async scheduleNotification(notificationData: CreateNotificationDto & { scheduledFor: string }): Promise<Notification> {
    const response = await api.post<Notification>('/notifications/schedule', notificationData);
    return response.data;
  }

  // Annuler une notification programmée
  static async cancelScheduledNotification(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/cancel-schedule`);
  }
}
