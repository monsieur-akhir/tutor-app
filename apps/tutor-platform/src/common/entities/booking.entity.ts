import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
// Use string references to avoid circular dependencies
import { BookingStatus, BookingMode } from '../enums/booking.enum';

@Entity('bookings')
@Index(['providerId', 'start', 'end'])
@Index(['studentId', 'status'])
@Index(['status', 'start'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'uuid' })
  providerId: string;

  @Column({ type: 'enum', enum: ['tutor', 'coach', 'mentor'] })
  providerType: string;

  @Column({ type: 'enum', enum: BookingMode, default: BookingMode.ONLINE })
  mode: BookingMode;

  @Column({ type: 'timestamp' })
  start: Date;

  @Column({ type: 'timestamp' })
  end: Date;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancelReason: string;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt: Date;

  @Column({ type: 'uuid', nullable: true })
  canceledBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne('User', 'bookingsAsStudent')
  @JoinColumn({ name: 'studentId' })
  student: any;

  @ManyToOne('User', 'bookingsAsProvider')
  @JoinColumn({ name: 'providerId' })
  provider: any;

  @OneToMany('Payment', 'booking')
  payments: any[];

  @OneToMany('Evaluation', 'booking')
  evaluations: any[];
}
