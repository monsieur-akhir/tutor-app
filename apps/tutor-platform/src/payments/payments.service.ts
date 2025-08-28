import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentStatus, PaymentType, PaymentMethod } from '../common/entities/payment.entity';
import { Booking } from '../common/entities/booking.entity';
import { BookingStatus } from '../common/enums/booking.enum';
import { User } from '../common/entities/user.entity';

export interface CreatePaymentDto {
  bookingId: string;
  userId: string; // Qui paie
  providerId: string; // Qui reçoit
  provider: string; // Fournisseur de paiement (Stripe, Mobile Money, etc.)
  providerRef: string; // Référence du fournisseur
  amount: number;
  currency?: string;
  paymentType?: PaymentType;
  paymentMethod?: PaymentMethod;
  metadata?: any;
}

export interface ConfirmPaymentDto {
  paymentId: string;
  adminId: string;
  adminNotes?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Créer un nouveau paiement
   * Workflow: Étudiant paie → Paiement en attente → Admin confirme → Service débloqué
   */
  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    // Vérifier que le booking existe et est en attente
    const booking = await this.bookingRepository.findOne({
      where: { id: data.bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking must be in pending status to create payment');
    }

    // Créer le paiement
    const payment = this.paymentRepository.create({
      ...data,
      status: PaymentStatus.PENDING,
      currency: data.currency || 'USD',
      paymentType: data.paymentType || PaymentType.DEPOSIT,
      paymentMethod: data.paymentMethod || PaymentMethod.MOBILE_MONEY,
    });

    return await this.paymentRepository.save(payment);
  }

  /**
   * Confirmer un paiement (Admin seulement)
   * Débloque automatiquement le service associé
   */
  async confirmPayment(data: ConfirmPaymentDto): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Récupérer le paiement
      const payment = await this.paymentRepository.findOne({
        where: { id: data.paymentId },
        // relations: ['booking'], // Temporairement commenté
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new BadRequestException('Payment is not in pending status');
      }

      // Confirmer le paiement
      payment.status = PaymentStatus.CONFIRMED;
      payment.confirmedBy = data.adminId;
      payment.confirmedAt = new Date();
      payment.adminNotes = data.adminNotes || null;

      const updatedPayment = await queryRunner.manager.save(Payment, payment);

      // Mettre à jour le statut du booking (débloquer le service)
      // Utiliser directement l'ID du booking sans relation
      if (payment.bookingId) {
        const booking = await queryRunner.manager.findOne(Booking, {
          where: { id: payment.bookingId }
        });
        
        if (booking) {
          booking.status = BookingStatus.CONFIRMED;
          await queryRunner.manager.save(Booking, booking);
        }
      }

      await queryRunner.commitTransaction();
      return updatedPayment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Rejeter un paiement (Admin seulement)
   */
  async rejectPayment(paymentId: string, adminId: string, reason: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not in pending status');
    }

    payment.status = PaymentStatus.REJECTED;
    payment.adminNotes = reason;

    return await this.paymentRepository.save(payment);
  }

  /**
   * Annuler un paiement (Admin seulement)
   */
  async cancelPayment(paymentId: string, adminId: string, reason: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = PaymentStatus.CANCELLED;
    payment.adminNotes = reason;

    return await this.paymentRepository.save(payment);
  }

  /**
   * Récupérer un paiement par ID
   */
  async getPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      // relations: ['booking', 'user', 'paymentProvider', 'admin'], // Temporairement commenté
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Récupérer tous les paiements d'un utilisateur
   */
  async getUserPayments(userId: string, status?: PaymentStatus): Promise<Payment[]> {
    const whereClause: any = { userId };
    if (status) {
      whereClause.status = status;
    }

    return this.paymentRepository.find({
      where: whereClause,
      // relations: ['booking'], // Temporairement commenté
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupérer tous les paiements d'un fournisseur
   */
  async getProviderPayments(providerId: string, status?: PaymentStatus): Promise<Payment[]> {
    const whereClause: any = { providerId };
    if (status) {
      whereClause.status = status;
    }

    return this.paymentRepository.find({
      where: whereClause,
      // relations: ['booking'], // Temporairement commenté
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupérer tous les paiements en attente (Admin seulement)
   */
  async getPendingPayments(): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { status: PaymentStatus.PENDING },
      // relations: ['booking', 'user', 'paymentProvider'], // Temporairement commenté
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Statistiques des paiements (Admin seulement)
   */
  async getPaymentStats(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    rejected: number;
    cancelled: number;
    totalAmount: number;
  }> {
    const [total, pending, confirmed, rejected, cancelled, totalAmount] = await Promise.all([
      this.paymentRepository.count(),
      this.paymentRepository.count({ where: { status: PaymentStatus.PENDING } }),
      this.paymentRepository.count({ where: { status: PaymentStatus.CONFIRMED } }),
      this.paymentRepository.count({ where: { status: PaymentStatus.REJECTED } }),
      this.paymentRepository.count({ where: { status: PaymentStatus.CANCELLED } }),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: PaymentStatus.CONFIRMED })
        .getRawOne(),
    ]);

    return {
      total,
      pending,
      confirmed,
      rejected,
      cancelled,
      totalAmount: parseFloat(totalAmount?.total || '0'),
    };
  }
}
