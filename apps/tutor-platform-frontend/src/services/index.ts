// Export de tous les services API
export * from './auth.service';
export * from './search.service';
export * from './booking.service';
export * from './session.service';
export * from './payment.service';
export * from './availability.service';
export * from './evaluation.service';
export * from './notification.service';
export * from './admin.service';

// Export du client API
export { api } from '../lib/api';
export type { ApiResponse, PaginatedResponse } from '../lib/api';

// Export des types spécifiques
export type { SearchFilters, SearchResult } from './search.service';
export type { CreateBookingDto, UpdateBookingDto, Booking } from './booking.service';
export type { CreateSessionDto, UpdateSessionDto, Session } from './session.service';
export type { CreatePaymentDto, ConfirmPaymentDto, Payment } from './payment.service';
export type { CreateAvailabilityDto, UpdateAvailabilityDto, Availability } from './availability.service';
export type { CreateEvaluationDto, UpdateEvaluationDto, Evaluation } from './evaluation.service';
export type { CreateNotificationDto, UpdateNotificationDto, Notification } from './notification.service';
export type { User, UserQueryDto, UserResponse, AdminStats } from './admin.service';
