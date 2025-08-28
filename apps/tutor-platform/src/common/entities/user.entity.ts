import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole, UserStatus } from '../enums/user.enum';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['phone'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Column({ type: 'varchar', length: 10, default: 'fr' })
  locale: string;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isTwoFactorEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  twoFactorSecret: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  phoneVerifiedAt: Date;

  // @Column({ type: 'boolean', default: true })
  // isActive: boolean;

  // @Column({ type: 'boolean', default: true })
  // emailNotifications: boolean;

  // @Column({ type: 'boolean', default: true })
  // smsNotifications: boolean;

  // @Column({ type: 'varchar', length: 255, nullable: true })
  // pushToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations - Utiliser des références de chaînes pour éviter les dépendances circulaires
  @OneToOne('UserProfile', 'user', { cascade: true })
  @JoinColumn({ name: 'id' }) // ✅ L'id de l'utilisateur est la clé de liaison
  profile: any;

  @OneToMany('UserSession', 'user')
  sessions: any[];

  @OneToMany('UserNotification', 'user')
  notifications: any[];

  @OneToMany('Booking', 'student')
  bookingsAsStudent: any[];

  @OneToMany('Booking', 'provider')
  bookingsAsProvider: any[];

  @OneToMany('Availability', 'provider')
  availabilities: any[];

  // @OneToMany('AvailabilitySchedule', 'provider')
  // availabilitySchedules: any[];
}
