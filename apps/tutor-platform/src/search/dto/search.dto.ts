import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, Min, Max, IsArray, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SearchMode {
  EXACT = 'exact',
  FUZZY = 'fuzzy',
  SEMANTIC = 'semantic'
}

export enum SortBy {
  RELEVANCE = 'relevance',
  RATING = 'rating',
  PRICE = 'price',
  EXPERIENCE = 'experience',
  AVAILABILITY = 'availability'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Filtres de recherche avancés avec PostgreSQL FTS
 */
export class SearchFilters {
  @ApiPropertyOptional({
    description: 'Terme de recherche principal (recherche full-text)',
    example: 'mathématiques avancées'
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Rôle du provider (tutor, coach, mentor)',
    example: 'tutor'
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Sujets ou compétences recherchés',
    example: ['mathématiques', 'physique']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  subjects?: string[];

  @ApiPropertyOptional({
    description: 'Localisation géographique',
    example: 'Paris, France'
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Note minimale requise',
    minimum: 0,
    maximum: 5,
    example: 4.0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Prix maximum par heure',
    minimum: 0,
    example: 50
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Langues parlées',
    example: ['français', 'anglais']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Mode de recherche',
    enum: SearchMode,
    default: SearchMode.FUZZY
  })
  @IsOptional()
  @IsEnum(SearchMode)
  mode?: SearchMode = SearchMode.FUZZY;

  @ApiPropertyOptional({
    description: 'Tri des résultats',
    enum: SortBy,
    default: SortBy.RELEVANCE
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.RELEVANCE;

  @ApiPropertyOptional({
    description: 'Ordre de tri',
    enum: SortOrder,
    default: SortOrder.DESC
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Page de résultats',
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre de résultats par page',
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Rayon de recherche en km (pour la géolocalisation)',
    minimum: 1,
    maximum: 1000,
    example: 25
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  radius?: number;

  @ApiPropertyOptional({
    description: 'Disponibilité requise (format ISO)',
    example: '2025-08-28T14:00:00Z'
  })
  @IsOptional()
  @IsString()
  availability?: string;
}

/**
 * Profil utilisateur pour la recherche
 */
export class UserProfileSearch {
  @ApiPropertyOptional({
    description: 'Biographie du provider',
    example: 'Professeur de mathématiques expérimenté'
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Compétences et sujets enseignés',
    example: 'Mathématiques, Physique, Algèbre'
  })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({
    description: 'Sujets enseignés (dérivé des compétences)',
    example: ['mathématiques', 'physique']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @ApiPropertyOptional({
    description: 'Langues parlées',
    example: ['français', 'anglais']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Tarif horaire',
    example: 45
  })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiPropertyOptional({
    description: 'Note moyenne',
    example: 4.8
  })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({
    description: 'Nombre total de sessions',
    example: 150
  })
  @IsOptional()
  @IsNumber()
  totalSessions?: number;

  @ApiPropertyOptional({
    description: 'Localisation',
    example: 'Paris, France'
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Années d\'expérience',
    example: 8
  })
  @IsOptional()
  @IsNumber()
  experience?: number;
}

/**
 * Résultat de recherche avec score de pertinence
 */
export class SearchResult {
  @ApiProperty({
    description: 'ID unique de l\'utilisateur',
    example: 'a99248f1-07db-4887-826f-c923d73e2b13'
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Prénom de l\'utilisateur',
    example: 'Jean'
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Nom de famille de l\'utilisateur',
    example: 'Dupont'
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email de l\'utilisateur',
    example: 'jean.dupont@example.com'
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Rôle de l\'utilisateur',
    example: 'tutor'
  })
  @IsString()
  role: string;

  @ApiProperty({
    description: 'Profil utilisateur détaillé',
    type: UserProfileSearch
  })
  profile: UserProfileSearch;

  @ApiPropertyOptional({
    description: 'Score de pertinence calculé par PostgreSQL FTS',
    example: 0.95
  })
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional({
    description: 'Distance en km (si recherche géolocalisée)',
    example: 2.5
  })
  @IsOptional()
  @IsNumber()
  distance?: number;

  @ApiPropertyOptional({
    description: 'Disponibilités proches',
    example: ['2025-08-28T14:00:00Z', '2025-08-28T16:00:00Z']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableSlots?: string[];
}

/**
 * Métadonnées de pagination
 */
export class PaginationInfo {
  @ApiProperty({
    description: 'Page actuelle',
    example: 1
  })
  @IsNumber()
  page: number;

  @ApiProperty({
    description: 'Nombre de résultats par page',
    example: 20
  })
  @IsNumber()
  limit: number;

  @ApiProperty({
    description: 'Nombre total de résultats',
    example: 150
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'Nombre total de pages',
    example: 8
  })
  @IsNumber()
  totalPages: number;
}

/**
 * Réponse de recherche paginée
 */
export class SearchResponse {
  @ApiProperty({
    description: 'Résultats de la recherche',
    type: [SearchResult]
  })
  results: SearchResult[];

  @ApiProperty({
    description: 'Métadonnées de pagination',
    type: PaginationInfo
  })
  pagination: PaginationInfo;

  @ApiProperty({
    description: 'Temps de traitement de la recherche en ms',
    example: 45
  })
  @IsNumber()
  processingTime: number;

  @ApiProperty({
    description: 'Filtres appliqués à la recherche',
    type: SearchFilters
  })
  appliedFilters: SearchFilters;
}
