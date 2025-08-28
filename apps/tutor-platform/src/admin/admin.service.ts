import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';
import { Booking } from '../common/entities/booking.entity';
import { Payment } from '../common/entities/payment.entity';
import { BookingStatus } from '../common/enums/booking.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async getSystemStats(): Promise<any> {
    const [
      totalUsers,
      totalBookings,
      totalPayments,
      activeUsers,
      pendingBookings,
      completedPayments,
    ] = await Promise.all([
      this.userRepository.count(),
      this.bookingRepository.count(),
      this.paymentRepository.count(),
      this.userRepository.count({ where: { status: 'active' as any } }),
      this.bookingRepository.count({ where: { status: BookingStatus.PENDING } }),
      this.paymentRepository.count({ where: { status: 'confirmed' as any } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        completed: totalBookings - pendingBookings,
      },
      payments: {
        total: totalPayments,
        successful: completedPayments,
        failed: totalPayments - completedPayments,
      },
    };
  }

  async getAllUsers(page: number = 1, limit: number = 20): Promise<any> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAllBookings(page: number = 1, limit: number = 20): Promise<any> {
    const [bookings, total] = await this.bookingRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['student', 'provider'],
      order: { createdAt: 'DESC' },
    });

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getQueueStatus(): Promise<any> {
    // TODO: Intégrer avec BullMQ pour obtenir le statut des queues
    return {
      queues: {
        emails: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
        },
        sms: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
        },
        payments: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
        },
      },
      workers: {
        total: 0,
        active: 0,
        idle: 0,
      },
    };
  }

  async getUserDetails(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'bookingsAsStudent', 'bookingsAsProvider'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userStats = await this.getUserStats(userId);

    return {
      user,
      stats: userStats,
    };
  }

  async getUserStats(userId: string): Promise<any> {
    const [
      totalBookings,
      completedBookings,
      totalSpent,
      totalEarned,
    ] = await Promise.all([
      this.bookingRepository.count({ where: { studentId: userId } }),
      this.bookingRepository.count({ where: { studentId: userId, status: BookingStatus.COMPLETED } }),
      this.bookingRepository
        .createQueryBuilder('booking')
        .select('SUM(booking.price)', 'total')
        .where('booking.studentId = :userId', { userId })
        .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
        .getRawOne(),
      this.bookingRepository
        .createQueryBuilder('booking')
        .select('SUM(booking.price)', 'total')
        .where('booking.providerId = :userId', { userId })
        .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
        .getRawOne(),
    ]);

    return {
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        pending: totalBookings - completedBookings,
      },
      financial: {
        totalSpent: totalSpent?.total || 0,
        totalEarned: totalEarned?.total || 0,
      },
    };
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    await this.userRepository.update(userId, { status: isActive ? 'active' as any : 'inactive' as any });
  }

  async getSystemHealth(): Promise<any> {
    // TODO: Vérifier la santé des services externes (DB, Redis, etc.)
    return {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        email: 'healthy',
        sms: 'healthy',
      },
    };
  }
}
