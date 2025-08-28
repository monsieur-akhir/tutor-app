import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string;

  @Column({ type: 'text', array: true, default: [] })
  skills: string[];

  @Column({ type: 'text', array: true, default: [] })
  languages: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  education: any[];

  @Column({ type: 'jsonb', nullable: true })
  experience: any[];

  @Column({ type: 'jsonb', nullable: true })
  certifications: any[];

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalSessions: number;

  @Column({ type: 'int', default: 0 })
  totalStudents: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne('User', 'profile')
  @JoinColumn({ name: 'id' }) // ✅ L'id du profil est le même que l'id de l'utilisateur
  user: any;
}

