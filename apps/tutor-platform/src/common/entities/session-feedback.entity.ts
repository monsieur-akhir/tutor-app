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
import { Session } from './session.entity';
import { User } from './user.entity';

export enum FeedbackType {
  STUDENT_TO_PROVIDER = 'student_to_provider',
  PROVIDER_TO_STUDENT = 'provider_to_student',
  SYSTEM = 'system',
}

@Entity('session_feedbacks')
@Index(['sessionId', 'feedbackType'])
@Index(['providerId', 'createdAt'])
@Index(['studentId', 'createdAt'])
@Index(['rating', 'createdAt'])
export class SessionFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'sessionid' })
  sessionId: string;

  @Column({ type: 'uuid', name: 'providerid' })
  providerId: string;

  @Column({ type: 'uuid', name: 'studentid' })
  studentId: string;

  @Column({ type: 'uuid', name: 'createdby' })
  createdBy: string;

  @Column({
    type: 'enum',
    enum: FeedbackType,
    default: FeedbackType.STUDENT_TO_PROVIDER,
  })
  feedbackType: FeedbackType;

  @Column({ type: 'integer', name: 'rating', comment: 'Rating from 1 to 5' })
  rating: number;

  @Column({ type: 'varchar', length: 2000, nullable: true, name: 'comment' })
  comment: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'ratingdetails' })
  ratingDetails: {
    communication?: number;
    knowledge?: number;
    punctuality?: number;
    teaching?: number;
    overall?: number;
  } | null;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'tags' })
  tags: string | null;

  @Column({ type: 'boolean', default: false, name: 'isanonymous' })
  isAnonymous: boolean;

  @Column({ type: 'boolean', default: false, name: 'ispublic' })
  isPublic: boolean;

  @Column({ type: 'boolean', default: false, name: 'ismoderated' })
  isModerated: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'moderatedby' })
  moderatedBy: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'moderatedat' })
  moderatedAt: Date | null;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'moderationnotes' })
  moderationNotes: string | null;

  @Column({ type: 'boolean', default: false, name: 'ishelpful' })
  isHelpful: boolean;

  @Column({ type: 'integer', default: 0, name: 'helpfulcount' })
  helpfulCount: number;

  @Column({ type: 'integer', default: 0, name: 'nothelpfulcount' })
  notHelpfulCount: number;

  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'createdat' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedat' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionid' })
  session: Session;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerid' })
  provider: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentid' })
  student: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdby' })
  creator: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'moderatedby' })
  moderator: User;
}
