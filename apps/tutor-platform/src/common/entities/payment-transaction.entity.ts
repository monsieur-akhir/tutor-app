import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Payment } from './payment.entity';
import { User } from './user.entity';

export enum TransactionType {
  PAYMENT_CREATED = 'payment_created',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PAYMENT_REJECTED = 'payment_rejected',
  PAYMENT_CANCELLED = 'payment_cancelled',
  PAYOUT_PROCESSED = 'payout_processed',
  REFUND_PROCESSED = 'refund_processed',
}

@Entity('payment_transactions')
@Index(['paymentId', 'createdAt'])
@Index(['type', 'createdAt'])
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Données supplémentaires (ancien statut, nouveau statut, etc.)

  @Column({ type: 'uuid', nullable: true })
  performedBy: string; // Admin ou système qui a effectué l'action

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performedBy' })
  user: User;
}

