import { api } from '../lib/api';

export interface CreatePaymentDto {
  bookingId: string;
  amount: number;
  currency: string;
  paymentType: 'online' | 'offline' | 'mobile_money' | 'bank_transfer';
  paymentMethod: 'stripe' | 'paypal' | 'mobile_money' | 'bank_transfer' | 'cash';
  description?: string;
  metadata?: Record<string, any>;
}

export interface ConfirmPaymentDto {
  adminNotes?: string;
  confirmedBy: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  providerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'failed';
  paymentType: 'online' | 'offline' | 'mobile_money' | 'bank_transfer';
  paymentMethod: 'stripe' | 'paypal' | 'mobile_money' | 'bank_transfer' | 'cash';
  description?: string;
  metadata?: Record<string, any>;
  confirmedBy?: string;
  confirmedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    subject: string;
    duration: number;
    sessionType: string;
  };
  user?: {
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
  };
}

export interface PaymentQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  providerId?: string;
  paymentType?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaymentResponse {
  data: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentStats {
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
  cancelled: number;
  failed: number;
  totalAmount: number;
  averageAmount: number;
}

export class PaymentService {
  // Créer un paiement
  static async createPayment(paymentData: CreatePaymentDto): Promise<Payment> {
    const response = await api.post<Payment>('/payments', paymentData);
    return response.data;
  }

  // Obtenir un paiement par ID
  static async getPayment(id: string): Promise<Payment> {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  }

  // Obtenir tous les paiements avec pagination
  static async getPayments(query: PaymentQueryDto = {}): Promise<PaymentResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<PaymentResponse>(`/payments?${params.toString()}`);
    return response.data;
  }

  // Obtenir les paiements d'un utilisateur
  static async getUserPayments(userId: string, query: PaymentQueryDto = {}): Promise<PaymentResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<PaymentResponse>(`/payments/user/${userId}?${params.toString()}`);
    return response.data;
  }

  // Obtenir les paiements d'un fournisseur
  static async getProviderPayments(providerId: string, query: PaymentQueryDto = {}): Promise<PaymentResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<PaymentResponse>(`/payments/provider/${providerId}?${params.toString()}`);
    return response.data;
  }

  // Obtenir les paiements en attente
  static async getPendingPayments(query: PaymentQueryDto = {}): Promise<PaymentResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<PaymentResponse>(`/payments/pending?${params.toString()}`);
    return response.data;
  }

  // Confirmer un paiement (admin)
  static async confirmPayment(id: string, confirmData: ConfirmPaymentDto): Promise<Payment> {
    const response = await api.patch<Payment>(`/payments/${id}/confirm`, confirmData);
    return response.data;
  }

  // Rejeter un paiement (admin)
  static async rejectPayment(id: string, reason: string): Promise<Payment> {
    const response = await api.patch<Payment>(`/payments/${id}/reject`, { reason });
    return response.data;
  }

  // Annuler un paiement
  static async cancelPayment(id: string, reason?: string): Promise<Payment> {
    const response = await api.patch<Payment>(`/payments/${id}/cancel`, { reason });
    return response.data;
  }

  // Supprimer un paiement
  static async deletePayment(id: string): Promise<void> {
    await api.delete(`/payments/${id}`);
  }

  // Obtenir les statistiques de paiement
  static async getPaymentStats(): Promise<PaymentStats> {
    const response = await api.get<PaymentStats>('/payments/stats');
    return response.data;
  }

  // Obtenir les statistiques de paiement pour un utilisateur
  static async getUserPaymentStats(userId: string): Promise<PaymentStats> {
    const response = await api.get<PaymentStats>(`/payments/stats/user/${userId}`);
    return response.data;
  }

  // Obtenir les statistiques de paiement pour un fournisseur
  static async getProviderPaymentStats(providerId: string): Promise<PaymentStats> {
    const response = await api.get<PaymentStats>(`/payments/stats/provider/${providerId}`);
    return response.data;
  }

  // Traiter un webhook de paiement
  static async processWebhook(webhookData: any): Promise<void> {
    await api.post('/payments/webhook', webhookData);
  }
}
