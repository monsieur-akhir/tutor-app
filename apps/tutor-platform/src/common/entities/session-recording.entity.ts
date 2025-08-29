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

export enum RecordingStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export enum RecordingQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HD = 'hd',
}

@Entity('session_recordings')
@Index(['sessionId', 'createdAt'])
@Index(['status', 'createdAt'])
export class SessionRecording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'sessionid' })
  sessionId: string;

  @Column({ type: 'uuid', name: 'createdby' })
  createdBy: string;

  @Column({
    type: 'enum',
    enum: RecordingStatus,
    default: RecordingStatus.PROCESSING,
  })
  status: RecordingStatus;

  @Column({
    type: 'enum',
    enum: RecordingQuality,
    default: RecordingQuality.MEDIUM,
  })
  quality: RecordingQuality;

  @Column({ type: 'varchar', length: 500, name: 'filepath' })
  filePath: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'fileurl' })
  fileUrl: string | null;

  @Column({ type: 'varchar', length: 100, name: 'filename' })
  fileName: string;

  @Column({ type: 'varchar', length: 50, name: 'filetype' })
  fileType: string;

  @Column({ type: 'bigint', name: 'filesize', comment: 'File size in bytes' })
  fileSize: number;

  @Column({ type: 'integer', name: 'duration', comment: 'Duration in seconds' })
  duration: number;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'description' })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, any> | null;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'thumbnailurl' })
  thumbnailUrl: string | null;

  @Column({ type: 'boolean', default: false, name: 'ispublic' })
  isPublic: boolean;

  @Column({ type: 'boolean', default: false, name: 'isdownloadable' })
  isDownloadable: boolean;

  @Column({ type: 'integer', default: 0, name: 'downloadcount' })
  downloadCount: number;

  @Column({ type: 'integer', default: 0, name: 'viewcount' })
  viewCount: number;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'processedat' })
  processedAt: Date | null;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'error' })
  error: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'deletedat' })
  deletedAt: Date | null;

  @Column({ type: 'uuid', nullable: true, name: 'deletedby' })
  deletedBy: string | null;

  @CreateDateColumn({ name: 'createdat' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedat' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionid' })
  session: Session;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdby' })
  creator: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deletedby' })
  deletedByUser: User;
}
