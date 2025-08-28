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
// Use string references to avoid circular dependencies
import { AvailabilityStatus } from '../enums/availability.enum';

@Entity('availabilities')
@Index(['providerId', 'start', 'end'])
@Index(['providerId', 'status'])
@Index(['start', 'end'])
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  providerId: string;

  @Column({ type: 'timestamp' })
  start: Date;

  @Column({ type: 'timestamp' })
  end: Date;

  @Column({ type: 'enum', enum: AvailabilityStatus, default: AvailabilityStatus.AVAILABLE })
  status: AvailabilityStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 50, default: 'online' })
  mode: string; // 'online', 'in_person', 'hybrid'

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne('User', 'availabilities')
  @JoinColumn({ name: 'providerId' })
  provider: any;
}

@Entity('availability_schedules')
export class AvailabilitySchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  providerId: string;

  @Column({ type: 'int' })
  dayOfWeek: number; // 0-6 (Sunday-Saturday)

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  exceptions: any; // Dates where this schedule doesn't apply

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne('User', 'availabilitySchedules')
  @JoinColumn({ name: 'providerId' })
  provider: any;
}
