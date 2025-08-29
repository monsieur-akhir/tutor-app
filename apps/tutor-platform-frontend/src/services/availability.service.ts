import { api } from '../lib/api';

export interface CreateAvailabilityDto {
  dayOfWeek: number; // 0-6 (Dimanche-Samedi)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
  notes?: string;
}

export interface UpdateAvailabilityDto {
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  notes?: string;
}

export interface Availability {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityResponse {
  data: Availability[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookingId?: string;
}

export interface DayAvailability {
  dayOfWeek: number;
  dayName: string;
  slots: TimeSlot[];
}

export interface WeeklyAvailability {
  userId: string;
  weekStart: string;
  weekEnd: string;
  days: DayAvailability[];
}

export class AvailabilityService {
  // Créer une disponibilité
  static async createAvailability(availabilityData: CreateAvailabilityDto): Promise<Availability> {
    const response = await api.post<Availability>('/availability', availabilityData);
    return response.data;
  }

  // Obtenir une disponibilité par ID
  static async getAvailability(id: string): Promise<Availability> {
    const response = await api.get<Availability>(`/availability/${id}`);
    return response.data;
  }

  // Obtenir toutes les disponibilités d'un utilisateur
  static async getUserAvailability(userId: string): Promise<AvailabilityResponse> {
    const response = await api.get<AvailabilityResponse>(`/availability/user/${userId}`);
    return response.data;
  }

  // Mettre à jour une disponibilité
  static async updateAvailability(id: string, updateData: UpdateAvailabilityDto): Promise<Availability> {
    const response = await api.put<Availability>(`/availability/${id}`, updateData);
    return response.data;
  }

  // Supprimer une disponibilité
  static async deleteAvailability(id: string): Promise<void> {
    await api.delete(`/availability/${id}`);
  }

  // Obtenir la disponibilité hebdomadaire d'un utilisateur
  static async getWeeklyAvailability(userId: string, weekStart: string): Promise<WeeklyAvailability> {
    const response = await api.get<WeeklyAvailability>(`/availability/weekly/${userId}?weekStart=${weekStart}`);
    return response.data;
  }

  // Obtenir les créneaux disponibles pour une date donnée
  static async getAvailableSlots(userId: string, date: string, duration: number = 60): Promise<TimeSlot[]> {
    const response = await api.get<{ slots: TimeSlot[] }>(`/availability/slots/${userId}?date=${date}&duration=${duration}`);
    return response.data.slots;
  }

  // Vérifier la disponibilité pour un créneau spécifique
  static async checkAvailability(userId: string, startTime: string, endTime: string): Promise<{
    isAvailable: boolean;
    conflictingBookings?: string[];
  }> {
    const response = await api.post(`/availability/check/${userId}`, { startTime, endTime });
    return response.data;
  }

  // Bloquer un créneau (marquer comme indisponible)
  static async blockSlot(userId: string, startTime: string, endTime: string, reason?: string): Promise<void> {
    await api.post(`/availability/block/${userId}`, { startTime, endTime, reason });
  }

  // Libérer un créneau (marquer comme disponible)
  static async unblockSlot(userId: string, startTime: string, endTime: string): Promise<void> {
    await api.post(`/availability/unblock/${userId}`, { startTime, endTime });
  }

  // Obtenir les exceptions de disponibilité (jours fériés, congés, etc.)
  static async getAvailabilityExceptions(userId: string, startDate: string, endDate: string): Promise<{
    date: string;
    isAvailable: boolean;
    reason?: string;
  }[]> {
    const response = await api.get(`/availability/exceptions/${userId}?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  }

  // Créer une exception de disponibilité
  static async createAvailabilityException(userId: string, date: string, isAvailable: boolean, reason?: string): Promise<void> {
    await api.post(`/availability/exceptions/${userId}`, { date, isAvailable, reason });
  }

  // Supprimer une exception de disponibilité
  static async deleteAvailabilityException(userId: string, date: string): Promise<void> {
    await api.delete(`/availability/exceptions/${userId}?date=${date}`);
  }

  // Obtenir les statistiques de disponibilité
  static async getAvailabilityStats(userId: string, startDate: string, endDate: string): Promise<{
    totalHours: number;
    availableHours: number;
    bookedHours: number;
    utilizationRate: number;
  }> {
    const response = await api.get(`/availability/stats/${userId}?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  }
}
