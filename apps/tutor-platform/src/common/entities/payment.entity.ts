import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  DEPOSIT = 'deposit',      // Dépôt d'argent par l'étudiant
  PAYOUT = 'payout',        // Versement au tuteur/coach/mentor
  REFUND = 'refund',        // Remboursement
}

export enum PaymentMethod {
  MOBILE_MONEY = 'mobile_money',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHECK = 'check',
}

@Entity('payments')
@Index(['bookingId', 'status'])
@Index(['provider', 'status'])
@Index(['status', 'createdAt'])
@Index(['userId', 'status'])
@Index(['providerId', 'status'])
@Index(['confirmedBy', 'status'])
@Index(['paymentType', 'status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  bookingId: string;

  @Column({ type: 'varchar', length: 50 })
  provider: string; // Nom du fournisseur de paiement (Stripe, Mobile Money, etc.)

  @Column({ type: 'varchar', length: 255 })
  providerRef: string; // Référence du fournisseur (ID de transaction)

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any | null; // Données additionnelles du fournisseur

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  // Nouvelles colonnes pour le workflow métier
  @Column({ type: 'uuid', nullable: true, name: 'userid' })
  userId: string | null; // Qui paie (étudiant)

  @Column({ type: 'uuid', nullable: true, name: 'providerid' })
  providerId: string | null; // Qui reçoit (tuteur/coach/mentor)

  @Column({ type: 'varchar', length: 50, default: 'deposit', name: 'paymenttype' })
  paymentType: string; // Type de paiement

  @Column({ type: 'varchar', length: 50, default: 'mobile_money', name: 'paymentmethod' })
  paymentMethod: string; // Méthode de paiement

  @Column({ type: 'uuid', nullable: true, name: 'confirmedby' })
  confirmedBy: string | null; // Admin qui confirme le paiement

  @Column({ type: 'timestamp', nullable: true, name: 'confirmedat' })
  confirmedAt: Date | null; // Date de confirmation

  @Column({ type: 'text', nullable: true, name: 'adminnotes' })
  adminNotes: string | null; // Notes de l'admin

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations (temporairement commentées pour debug)
  // @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'bookingId' })
  // booking: Booking;

  // @ManyToOne(() => User, { onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'userId' })
  // user: User; // Qui paie

  // @ManyToOne(() => User, { onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'providerId' })
  // paymentProvider: User; // Qui reçoit (éviter conflit avec 'provider')

  // @ManyToOne(() => User, { onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'confirmedBy' })
  // admin: User; // Admin qui confirme
}
