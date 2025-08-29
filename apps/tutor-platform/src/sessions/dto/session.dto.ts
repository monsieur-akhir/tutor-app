import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SessionStatus, SessionType } from '../../common/entities/session.entity';

export class CreateSessionDto {
  @ApiProperty({
    description: 'ID de la réservation associée',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  bookingId: string;

  @ApiProperty({
    description: 'Type de session',
    enum: SessionType,
    example: SessionType.TUTORING,
  })
  @IsEnum(SessionType)
  type: SessionType;

  @ApiProperty({
    description: 'Date et heure de début de la session',
    example: '2025-08-29T10:00:00Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'Date et heure de fin de la session',
    example: '2025-08-29T11:00:00Z',
  })
  @IsDateString()
  endTime: string;

  @ApiProperty({
    description: 'Durée de la session en minutes',
    example: 60,
    minimum: 15,
  })
  @IsInt()
  @Min(15)
  duration: number;

  @ApiPropertyOptional({
    description: 'Nom de la salle de session',
    example: 'Salle de mathématiques - Niveau 2',
  })
  @IsOptional()
  @IsString()
  roomName?: string;

  @ApiPropertyOptional({
    description: 'URL de la salle de session',
    example: 'https://meet.example.com/room-123',
  })
  @IsOptional()
  @IsUrl()
  roomUrl?: string;

  @ApiPropertyOptional({
    description: 'Description de la session',
    example: 'Cours de mathématiques avancées - Algèbre linéaire',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées supplémentaires',
    example: { subject: 'Mathématiques', level: 'Avancé' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Notes privées sur la session',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Si la session doit être enregistrée',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecorded?: boolean;

  @ApiPropertyOptional({
    description: 'Si la session est privée',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Nombre maximum de participants',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipants?: number;

  @ApiPropertyOptional({
    description: 'Fuseau horaire de la session',
    example: 'Europe/Paris',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional({
    description: 'Nouveau statut de la session',
    enum: SessionStatus,
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional({
    description: 'Nouvelle date et heure de début',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Nouvelle date et heure de fin',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Nouvelle durée en minutes',
    minimum: 15,
  })
  @IsOptional()
  @IsInt()
  @Min(15)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Nouveau nom de la salle',
  })
  @IsOptional()
  @IsString()
  roomName?: string;

  @ApiPropertyOptional({
    description: 'Nouvelle URL de la salle',
  })
  @IsOptional()
  @IsUrl()
  roomUrl?: string;

  @ApiPropertyOptional({
    description: 'Nouvelle description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Nouvelles métadonnées',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Nouvelles notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Si l\'enregistrement est activé',
  })
  @IsOptional()
  @IsBoolean()
  isRecorded?: boolean;

  @ApiPropertyOptional({
    description: 'Si la session est privée',
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Nouveau nombre max de participants',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipants?: number;

  @ApiPropertyOptional({
    description: 'Nouveau fuseau horaire',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class SessionQueryDto {
  @ApiPropertyOptional({
    description: 'Statut de la session',
    enum: SessionStatus,
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional({
    description: 'Type de session',
    enum: SessionType,
  })
  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType;

  @ApiPropertyOptional({
    description: 'ID du fournisseur (tuteur/coach/mentor)',
  })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'étudiant',
  })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({
    description: 'Date de début (format ISO)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Date de fin (format ISO)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Numéro de page',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class SessionResponseDto {
  @ApiProperty({
    description: 'ID unique de la session',
  })
  id: string;

  @ApiProperty({
    description: 'ID de la réservation',
  })
  bookingId: string;

  @ApiProperty({
    description: 'ID du fournisseur',
  })
  providerId: string;

  @ApiProperty({
    description: 'ID de l\'étudiant',
  })
  studentId: string;

  @ApiProperty({
    description: 'Statut de la session',
    enum: SessionStatus,
  })
  status: SessionStatus;

  @ApiProperty({
    description: 'Type de session',
    enum: SessionType,
  })
  type: SessionType;

  @ApiProperty({
    description: 'Date et heure de début',
  })
  startTime: Date;

  @ApiProperty({
    description: 'Date et heure de fin',
  })
  endTime: Date;

  @ApiProperty({
    description: 'Durée en minutes',
  })
  duration: number;

  @ApiPropertyOptional({
    description: 'Nom de la salle',
  })
  roomName?: string;

  @ApiPropertyOptional({
    description: 'URL de la salle',
  })
  roomUrl?: string;

  @ApiPropertyOptional({
    description: 'Description de la session',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées',
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Notes privées',
  })
  notes?: string;

  @ApiProperty({
    description: 'Si la session est enregistrée',
  })
  isRecorded: boolean;

  @ApiProperty({
    description: 'Si la session est privée',
  })
  isPrivate: boolean;

  @ApiProperty({
    description: 'Nombre max de participants',
  })
  maxParticipants: number;

  @ApiPropertyOptional({
    description: 'Fuseau horaire',
  })
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Heure de début réelle',
  })
  actualStartTime?: Date;

  @ApiPropertyOptional({
    description: 'Heure de fin réelle',
  })
  actualEndTime?: Date;

  @ApiProperty({
    description: 'Durée réelle en minutes',
  })
  actualDuration: number;

  @ApiProperty({
    description: 'Date de création',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de mise à jour',
  })
  updatedAt: Date;
}

export class SessionListResponseDto {
  @ApiProperty({
    description: 'Liste des sessions',
    type: [SessionResponseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionResponseDto)
  sessions: SessionResponseDto[];

  @ApiProperty({
    description: 'Informations de pagination',
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
