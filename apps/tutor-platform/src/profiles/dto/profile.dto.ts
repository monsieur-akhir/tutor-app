import { IsString, IsOptional, IsArray, IsNumber, IsEnum, IsUrl, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user.enum';

export class CreateProfileDto {
  @ApiProperty({ example: 'Passionné de mathématiques avec 5 ans d\'expérience' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'Professeur de Mathématiques' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: ['Mathématiques', 'Physique', 'Calcul différentiel'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ example: ['Français', 'Anglais'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiProperty({ example: 25.50 })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiProperty({ example: 'EUR', default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: [{ degree: 'Master', institution: 'Sorbonne', year: 2020 }] })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  education?: any[];

  @ApiProperty({ example: [{ company: 'Lycée', position: 'Prof', duration: '3 ans' }] })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  experience?: any[];

  @ApiProperty({ example: ['Certification Google', 'Formation pédagogique'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];
}

export class UpdateProfileDto extends CreateProfileDto {
  @ApiProperty({ example: 'Passionné de mathématiques avec 5 ans d\'expérience' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'Professeur de Mathématiques' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: ['Mathématiques', 'Physique'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ example: ['Français', 'Anglais'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiProperty({ example: 30.00 })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiProperty({ example: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class ProfileQueryDto {
  @ApiProperty({ example: 'tutor', enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: 'Mathématiques', required: false })
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiProperty({ example: 'Français', required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ example: 20, required: false })
  @IsOptional()
  @IsNumber()
  minRate?: number;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  maxRate?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
