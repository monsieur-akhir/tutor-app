import { IsUUID, IsDateString, IsEnum, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingMode, BookingStatus } from '../../common/enums/booking.enum';

export class CreateBookingDto {
  @ApiProperty({ description: 'ID de l\'étudiant qui réserve' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'ID du tuteur/coach/mentor' })
  @IsUUID()
  providerId: string;

  @ApiProperty({ description: 'Type de fournisseur', enum: ['tutor', 'coach', 'mentor'] })
  @IsString()
  providerType: 'tutor' | 'coach' | 'mentor';

  @ApiProperty({ description: 'Date et heure de début (ISO string)' })
  @IsDateString()
  start: string;

  @ApiProperty({ description: 'Date et heure de fin (ISO string)' })
  @IsDateString()
  end: string;

  @ApiProperty({ description: 'Mode de session', enum: BookingMode })
  @IsEnum(BookingMode)
  mode: BookingMode;

  @ApiPropertyOptional({ description: 'Notes additionnelles' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBookingDto {
  @ApiPropertyOptional({ description: 'Nouveau statut de la réservation' })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Notes additionnelles' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Raison de l\'annulation' })
  @IsOptional()
  @IsString()
  cancelReason?: string;
}

export class BookingQueryDto {
  @ApiPropertyOptional({ description: 'ID de l\'étudiant' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'ID du fournisseur' })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiPropertyOptional({ description: 'Statut de la réservation' })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Date de début (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Numéro de page', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Taille de la page', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class BookingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  providerId: string;

  @ApiProperty()
  providerType: string;

  @ApiProperty()
  mode: BookingMode;

  @ApiProperty()
  start: Date;

  @ApiProperty()
  end: Date;

  @ApiProperty()
  status: BookingStatus;

  @ApiProperty()
  price: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  cancelReason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
