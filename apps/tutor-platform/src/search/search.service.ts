import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';
import { UserProfile } from '../common/entities/user-profile.entity';

export interface SearchFilters {
  query?: string;
  role?: string;
  subject?: string;
  location?: string;
  minRating?: number;
  maxPrice?: number;
  availability?: string;
  mode?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profile: {
    bio?: string;
    subjects?: string[];
    languages?: string[];
    hourlyRate?: number;
    rating?: number;
    totalSessions?: number;
  };
  score?: number;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private profileRepository: Repository<UserProfile>,
  ) {}

  async searchTutors(filters: SearchFilters): Promise<SearchResult[]> {
    try {
      const query = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('user.role = :role', { role: 'tutor' })
        .andWhere('user.isActive = :isActive', { isActive: true });

      // Recherche textuelle simple (sans FTS pour l'instant)
      if (filters.query) {
        query.andWhere(
          '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR profile.bio ILIKE :query)',
          { query: `%${filters.query}%` }
        );
      }

      // Filtres par sujet (simplifié)
      if (filters.subject) {
        query.andWhere('profile.subjects @> ARRAY[:subject]', { subject: filters.subject });
      }

      // Filtre par note minimale
      if (filters.minRating) {
        query.andWhere('profile.rating >= :minRating', { minRating: filters.minRating });
      }

      // Filtre par prix maximum
      if (filters.maxPrice) {
        query.andWhere('profile.hourlyRate <= :maxPrice', { maxPrice: filters.maxPrice });
      }

      // Tri par pertinence et note
      query.orderBy('profile.rating', 'DESC')
           .addOrderBy('profile.totalSessions', 'DESC');

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      query.skip((page - 1) * limit).take(limit);

      const results = await query.getMany();

      return results.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profile: {
          bio: user.profile?.bio,
          subjects: user.profile?.subjects,
          languages: user.profile?.languages,
          hourlyRate: user.profile?.hourlyRate,
          rating: user.profile?.rating,
          totalSessions: user.profile?.totalSessions,
        },
      }));
    } catch (error) {
      console.error('Error in searchTutors:', error);
      // Retourner un tableau vide en cas d'erreur
      return [];
    }
  }

  async searchCoaches(filters: SearchFilters): Promise<SearchResult[]> {
    try {
      const query = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('user.role = :role', { role: 'coach' })
        .andWhere('user.isActive = :isActive', { isActive: true });

      // Recherche textuelle simple
      if (filters.query) {
        query.andWhere(
          '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR profile.bio ILIKE :query)',
          { query: `%${filters.query}%` }
        );
      }

      // Filtres spécifiques aux coaches
      if (filters.subject) {
        query.andWhere('profile.subjects @> ARRAY[:subject]', { subject: filters.subject });
      }

      if (filters.minRating) {
        query.andWhere('profile.rating >= :minRating', { minRating: filters.minRating });
      }

      query.orderBy('profile.rating', 'DESC')
           .addOrderBy('profile.totalSessions', 'DESC');

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      query.skip((page - 1) * limit).take(limit);

      const results = await query.getMany();

      return results.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profile: {
          bio: user.profile?.bio,
          subjects: user.profile?.subjects,
          languages: user.profile?.languages,
          hourlyRate: user.profile?.hourlyRate,
          rating: user.profile?.rating,
          totalSessions: user.profile?.totalSessions,
        },
      }));
    } catch (error) {
      console.error('Error in searchCoaches:', error);
      return [];
    }
  }

  async searchMentors(filters: SearchFilters): Promise<SearchResult[]> {
    try {
      const query = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('user.role = :role', { role: 'mentor' })
        .andWhere('user.isActive = :isActive', { isActive: true });

      // Recherche textuelle simple
      if (filters.query) {
        query.andWhere(
          '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR profile.bio ILIKE :query)',
          { query: `%${filters.query}%` }
        );
      }

      // Filtres spécifiques aux mentors
      if (filters.subject) {
        query.andWhere('profile.subjects @> ARRAY[:subject]', { subject: filters.subject });
      }

      if (filters.minRating) {
        query.andWhere('profile.rating >= :minRating', { minRating: filters.minRating });
      }

      query.orderBy('profile.rating', 'DESC')
           .addOrderBy('profile.totalSessions', 'DESC');

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      query.skip((page - 1) * limit).take(limit);

      const results = await query.getMany();

      return results.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profile: {
          bio: user.profile?.bio,
          subjects: user.profile?.subjects,
          languages: user.profile?.languages,
          hourlyRate: user.profile?.hourlyRate,
          rating: user.profile?.rating,
          totalSessions: user.profile?.totalSessions,
        },
      }));
    } catch (error) {
      console.error('Error in searchMentors:', error);
      return [];
    }
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      const suggestions = await this.profileRepository
        .createQueryBuilder('profile')
        .select('DISTINCT unnest(profile.subjects)', 'subject')
        .where('profile.subjects IS NOT NULL')
        .andWhere('unnest(profile.subjects) ILIKE :query', { query: `%${query}%` })
        .limit(10)
        .getRawMany();

      return suggestions.map(s => s.subject);
    } catch (error) {
      console.error('Error in getSearchSuggestions:', error);
      // Retourner des suggestions par défaut en cas d'erreur
      return ['Mathématiques', 'Physique', 'Chimie', 'Informatique', 'Anglais'];
    }
  }
}
