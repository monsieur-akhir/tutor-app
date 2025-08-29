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
import { User } from './user.entity';
import { Booking } from './booking.entity';
import { SessionRecording } from './session-recording.entity';
import { SessionFeedback } from './session-feedback.entity';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  STARTING = 'starting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum SessionType {
  TUTORING = 'tutoring',
  COACHING = 'coaching',
  MENTORING = 'mentoring',
  GROUP = 'group',
  WORKSHOP = 'workshop',
}

@Entity('sessions')
@Index(['bookingId'], { unique: true })
@Index(['status', 'startTime'])
@Index(['providerId', 'startTime'])
@Index(['studentId', 'startTime'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'bookingid' })
  bookingId: string;

  @Column({ type: 'uuid', name: 'providerid' })
  providerId: string;

  @Column({ type: 'uuid', name: 'studentid' })
  studentId: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED,
  })
  status: SessionStatus;

  @Column({
    type: 'enum',
    enum: SessionType,
    default: SessionType.TUTORING,
  })
  type: SessionType;

  @Column({ type: 'timestamp with time zone', name: 'starttime' })
  startTime: Date;

  @Column({ type: 'timestamp with time zone', name: 'endtime' })
  endTime: Date;

  @Column({ type: 'integer', name: 'duration', comment: 'Duration in minutes' })
  duration: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'roomname' })
  roomName: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'roomurl' })
  roomUrl: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'description' })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, any> | null;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'notes' })
  notes: string | null;

  @Column({ type: 'boolean', default: false, name: 'isrecorded' })
  isRecorded: boolean;

  @Column({ type: 'boolean', default: false, name: 'isprivate' })
  isPrivate: boolean;

  @Column({ type: 'integer', default: 0, name: 'maxparticipants' })
  maxParticipants: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'timezone' })
  timezone: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'actualstarttime' })
  actualStartTime: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'actualendtime' })
  actualEndTime: Date | null;

  @Column({ type: 'integer', default: 0, name: 'actualduration', comment: 'Actual duration in minutes' })
  actualDuration: number;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'cancellationreason' })
  cancellationReason: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'cancelledby' })
  cancelledBy: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'cancelledat' })
  cancelledAt: Date | null;

  @CreateDateColumn({ name: 'createdat' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedat' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingid' })
  booking: Booking;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerid' })
  provider: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentid' })
  student: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cancelledby' })
  cancelledByUser: User;

  @OneToMany(() => SessionRecording, (recording) => recording.session)
  recordings: SessionRecording[];

  @OneToMany(() => SessionFeedback, (feedback) => feedback.session)
  feedbacks: SessionFeedback[];
}
