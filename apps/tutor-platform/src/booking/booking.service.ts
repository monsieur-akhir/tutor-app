import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking } from '../common/entities/booking.entity';
import { Payment } from '../common/entities/payment.entity';
import { BookingStatus } from '../common/enums/booking.enum';
import { User } from '../common/entities/user.entity';
import { UserProfile } from '../common/entities/user-profile.entity';
import { Availability } from '../common/entities/availability.entity';
import { RedisService } from '../common/services/redis.service';
import { AvailabilityStatus } from '../common/enums/availability.enum';
import { CreateBookingDto, UpdateBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    private dataSource: DataSource,
    private redisService: RedisService,
  ) {}

  async createBooking(data: any): Promise<Booking> {
    const { studentId, providerId, start, end, mode, notes } = data;

    // Vérifier que l'étudiant et le fournisseur existent
    const [student, provider] = await Promise.all([
      this.userRepository.findOne({ where: { id: studentId } }),
      this.userRepository.findOne({ where: { id: providerId } }),
    ]);

    if (!student || !provider) {
      throw new NotFoundException('Student or provider not found');
    }

    // Vérifier la disponibilité avec un verrou Redis
    const lockKey = `booking:${providerId}:${start.getTime()}`;
    const lockAcquired = await this.redisService.acquireLock(lockKey, 30000); // 30s

    if (!lockAcquired) {
      throw new ConflictException('Booking slot is being processed by another request');
    }

    try {
      // Vérifier la disponibilité
      const availability = await this.availabilityRepository.findOne({
        where: {
          providerId,
          status: AvailabilityStatus.AVAILABLE,
          start: start,
        },
      });

      if (!availability) {
        throw new BadRequestException('Provider is not available at this time');
      }

      // Créer la réservation
      const booking = this.bookingRepository.create({
        studentId,
        providerId,
        providerType: 'tutor', // Default value
        start,
        end,
        mode: mode || 'online',
        status: BookingStatus.PENDING,
        price: this.calculatePrice(start, end, 50), // Default hourly rate
        currency: 'CFA',
        notes,
      });

      const savedBooking = await this.bookingRepository.save(booking);

      return savedBooking;
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }

  async getBooking(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['student', 'provider', 'payments', 'evaluations'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getUserBookings(userId: string, role: 'student' | 'provider'): Promise<Booking[]> {
    const whereClause = role === 'student' ? { studentId: userId } : { providerId: userId };
    
    return this.bookingRepository.find({
      where: whereClause,
      relations: ['student', 'provider', 'payments'],
      order: { start: 'DESC' },
    });
  }



  async cancelBooking(id: string, userId: string, cancelReason?: string): Promise<Booking> {
    const booking = await this.getBooking(id);
    
    // Vérifier que l'utilisateur peut annuler
    if (booking.studentId !== userId && booking.providerId !== userId) {
      throw new ForbiddenException('Non autorisé à annuler cette réservation');
    }

    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELED) {
      throw new BadRequestException('Impossible d\'annuler une réservation terminée ou annulée');
    }

    // Vérifier la politique d'annulation (24h avant pour les étudiants)
    const now = new Date();
    const hoursUntilStart = (booking.start.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (booking.studentId === userId && hoursUntilStart < 24) {
      throw new BadRequestException('Impossible d\'annuler moins de 24h avant la session');
    }

    booking.status = BookingStatus.CANCELED;
    if (cancelReason) {
      booking.cancelReason = cancelReason;
    }
    
    return this.bookingRepository.save(booking);
  }

  async confirmBooking(id: string, providerId: string): Promise<Booking> {
    const booking = await this.getBooking(id);
    
    // Vérifier que le fournisseur confirme sa propre réservation
    if (booking.providerId !== providerId) {
      throw new ForbiddenException('Non autorisé à confirmer cette réservation');
    }
    
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('La réservation n\'est pas en attente de confirmation');
    }

    booking.status = BookingStatus.CONFIRMED;
    return this.bookingRepository.save(booking);
  }

  async updateBooking(id: string, userId: string, updateData: UpdateBookingDto): Promise<Booking> {
    const booking = await this.getBooking(id);
    
    // Vérifier que l'utilisateur peut modifier
    if (booking.studentId !== userId && booking.providerId !== userId) {
      throw new ForbiddenException('Non autorisé à modifier cette réservation');
    }
    
    // Vérifier que la réservation peut être modifiée
    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELED) {
      throw new BadRequestException('Impossible de modifier une réservation terminée ou annulée');
    }

    // Mettre à jour les champs autorisés
    if (updateData.notes !== undefined) {
      booking.notes = updateData.notes;
    }
    if (updateData.status !== undefined) {
      // Seul le fournisseur peut changer le statut
      if (booking.providerId !== userId) {
        throw new ForbiddenException('Seul le fournisseur peut changer le statut');
      }
      booking.status = updateData.status;
    }

    return this.bookingRepository.save(booking);
  }

  async deleteBooking(id: string): Promise<void> {
    const booking = await this.getBooking(id);
    
    if (booking.status !== BookingStatus.CANCELED) {
      throw new BadRequestException('Seules les réservations annulées peuvent être supprimées');
    }

    await this.bookingRepository.remove(booking);
  }

  async getBookingsWithPagination(filters: any, offset: number, limit: number): Promise<{ bookings: Booking[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.bookingRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.student', 'student')
      .leftJoinAndSelect('booking.provider', 'provider');
      // Temporairement désactivé pour éviter les erreurs de relations
      // .leftJoinAndSelect('booking.payments', 'payments');

    // Appliquer les filtres
    if (filters.studentId) {
      queryBuilder.andWhere('booking.studentId = :studentId', { studentId: filters.studentId });
    }
    if (filters.providerId) {
      queryBuilder.andWhere('booking.providerId = :providerId', { providerId: filters.providerId });
    }
    if (filters.status) {
      queryBuilder.andWhere('booking.status = :status', { status: filters.status });
    }
    if (filters.startDate) {
      queryBuilder.andWhere('booking.start >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('booking.end <= :endDate', { endDate: new Date(filters.endDate) });
    }

    // Compter le total
    const total = await queryBuilder.getCount();

    // Pagination
    queryBuilder
      .orderBy('booking.start', 'DESC')
      .skip(offset)
      .take(limit);

    const bookings = await queryBuilder.getMany();

    return {
      bookings,
      total,
      page: Math.floor(offset / limit) + 1,
      limit
    };
  }

  private async getProviderProfile(providerId: string): Promise<UserProfile | null> {
    return this.dataSource.getRepository(UserProfile).findOne({
      where: { id: providerId }
    });
  }

  private calculatePrice(start: Date, end: Date, hourlyRate: number): number {
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.round(durationHours * hourlyRate * 100) / 100; // Arrondir à 2 décimales
  }
}
