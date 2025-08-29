import { api } from '../lib/api';

export interface CreateBookingDto {
  providerId: string;
  startTime: string;
  endTime: string;
  duration: number;
  subject: string;
  description?: string;
  location?: string;
  sessionType: 'online' | 'offline' | 'hybrid';
  notes?: string;
}

export interface UpdateBookingDto {
  startTime?: string;
  endTime?: string;
  duration?: number;
  subject?: string;
  description?: string;
  location?: string;
  sessionType?: 'online' | 'offline' | 'hybrid';
  notes?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export interface Booking {
  id: string;
  studentId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  duration: number;
  subject: string;
  description?: string;
  location?: string;
  sessionType: 'online' | 'offline' | 'hybrid';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  provider?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profile?: {
      hourlyRate?: number;
      rating?: number;
    };
  };
}

export interface BookingQueryDto {
  page?: number;
  limit?: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  providerId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface BookingResponse {
  data: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class BookingService {
  // Créer une réservation
  static async createBooking(bookingData: CreateBookingDto): Promise<Booking> {
    const response = await api.post<Booking>('/booking', bookingData);
    return response.data;
  }

  // Obtenir une réservation par ID
  static async getBooking(id: string): Promise<Booking> {
    const response = await api.get<Booking>(`/booking/${id}`);
    return response.data;
  }

  // Obtenir toutes les réservations avec pagination
  static async getBookings(query: BookingQueryDto = {}): Promise<BookingResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<BookingResponse>(`/booking?${params.toString()}`);
    return response.data;
  }

  // Obtenir les réservations d'un étudiant
  static async getStudentBookings(studentId: string, query: BookingQueryDto = {}): Promise<BookingResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<BookingResponse>(`/booking/student/${studentId}?${params.toString()}`);
    return response.data;
  }

  // Obtenir les réservations d'un fournisseur
  static async getProviderBookings(providerId: string, query: BookingQueryDto = {}): Promise<BookingResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<BookingResponse>(`/booking/provider/${providerId}?${params.toString()}`);
    return response.data;
  }

  // Mettre à jour une réservation
  static async updateBooking(id: string, updateData: UpdateBookingDto): Promise<Booking> {
    const response = await api.put<Booking>(`/booking/${id}`, updateData);
    return response.data;
  }

  // Annuler une réservation
  static async cancelBooking(id: string, reason?: string): Promise<Booking> {
    const response = await api.patch<Booking>(`/booking/${id}/cancel`, { reason });
    return response.data;
  }

  // Confirmer une réservation
  static async confirmBooking(id: string): Promise<Booking> {
    const response = await api.patch<Booking>(`/booking/${id}/confirm`);
    return response.data;
  }

  // Marquer une réservation comme terminée
  static async completeBooking(id: string): Promise<Booking> {
    const response = await api.patch<Booking>(`/booking/${id}/complete`);
    return response.data;
  }

  // Supprimer une réservation
  static async deleteBooking(id: string): Promise<void> {
    await api.delete(`/booking/${id}`);
  }

  // Obtenir les statistiques de réservation
  static async getBookingStats(userId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  }> {
    const response = await api.get(`/booking/stats/${userId}`);
    return response.data;
  }
}
