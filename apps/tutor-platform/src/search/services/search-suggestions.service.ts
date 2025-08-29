import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../../common/entities/user-profile.entity';
import { User } from '../../common/entities/user.entity';

/**
 * Service dédié aux suggestions de recherche
 * Principe de Responsabilité Unique (SRP)
 */
@Injectable()
export class SearchSuggestionsService {
  private readonly logger = new Logger(SearchSuggestionsService.name);

  constructor(
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Obtient des suggestions basées sur la requête utilisateur
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      if (!query || query.length < 2) {
        return await this.getPopularSubjects();
      }

      const suggestions = await this.profileRepository
        .createQueryBuilder('profile')
        .select('DISTINCT unnest(string_to_array(profile.skills, \',\'))', 'subject')
        .where('profile.skills IS NOT NULL')
        .andWhere('profile.skills ILIKE :query', { query: `%${query}%` })
        .limit(10)
        .getRawMany();

      // Si pas assez de suggestions, ajouter des sujets populaires
      if (suggestions.length < 5) {
        const popularSubjects = await this.getPopularSubjects();
        const existingSubjects = suggestions.map(s => s.subject);
        const additionalSubjects = popularSubjects.filter(subject => 
          !existingSubjects.includes(subject) && 
          subject.toLowerCase().includes(query.toLowerCase())
        );
        suggestions.push(...additionalSubjects.slice(0, 5 - suggestions.length).map(s => ({ subject: s })));
      }

      return suggestions.map(s => s.subject);
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des suggestions:', error);
      return await this.getPopularSubjects();
    }
  }

  /**
   * Obtient les sujets les plus populaires
   */
  async getPopularSubjects(): Promise<string[]> {
    try {
      const popularSubjects = await this.profileRepository
        .createQueryBuilder('profile')
        .select('unnest(string_to_array(profile.skills, \',\'))', 'subject')
        .addSelect('COUNT(*)', 'count')
        .where('profile.skills IS NOT NULL')
        .groupBy('subject')
        .orderBy('count', 'DESC')
        .limit(15)
        .getRawMany();

      return popularSubjects.map(s => s.subject);
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des sujets populaires:', error);
      // Retourner des suggestions par défaut
      return [
        'Mathématiques', 'Physique', 'Chimie', 'Informatique', 'Anglais',
        'Français', 'Histoire', 'Géographie', 'Biologie', 'Philosophie',
        'Économie', 'Droit', 'Médecine', 'Ingénierie', 'Arts'
      ];
    }
  }

  /**
   * Obtient les recherches récentes d'un utilisateur
   */
  async getRecentSearches(userId: string): Promise<string[]> {
    try {
      // Pour l'instant, retourner des suggestions basées sur l'historique des profils consultés
      // TODO: Implémenter un système de tracking des recherches
      const recentProfiles = await this.profileRepository
        .createQueryBuilder('profile')
        .select('unnest(string_to_array(profile.skills, \',\'))', 'subject')
        .where('profile.skills IS NOT NULL')
        .orderBy('profile.updatedAt', 'DESC')
        .limit(10)
        .getRawMany();

      return [...new Set(recentProfiles.map(p => p.subject))];
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des recherches récentes:', error);
      return [];
    }
  }

  /**
   * Obtient des suggestions de recherche intelligentes basées sur le contexte
   */
  async getContextualSuggestions(
    userRole?: string,
    userLocation?: string,
    userSubjects?: string[]
  ): Promise<string[]> {
    try {
      let suggestions: string[] = [];

      // Suggestions basées sur le rôle
      if (userRole) {
        const roleBasedSuggestions = await this.getRoleBasedSuggestions(userRole);
        suggestions.push(...roleBasedSuggestions);
      }

      // Suggestions basées sur la localisation
      if (userLocation) {
        const locationBasedSuggestions = await this.getLocationBasedSuggestions(userLocation);
        suggestions.push(...locationBasedSuggestions);
      }

      // Suggestions basées sur les sujets d'intérêt
      if (userSubjects && userSubjects.length > 0) {
        const subjectBasedSuggestions = await this.getSubjectBasedSuggestions(userSubjects);
        suggestions.push(...subjectBasedSuggestions);
      }

      // Dédupliquer et limiter
      return [...new Set(suggestions)].slice(0, 20);
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des suggestions contextuelles:', error);
      return await this.getPopularSubjects();
    }
  }

  /**
   * Suggestions basées sur le rôle de l'utilisateur
   */
  private async getRoleBasedSuggestions(userRole: string): Promise<string[]> {
    try {
      const roleSuggestions = await this.profileRepository
        .createQueryBuilder('profile')
        .innerJoin('profile.user', 'user')
        .select('unnest(string_to_array(profile.skills, \',\'))', 'subject')
        .addSelect('COUNT(*)', 'count')
        .where('user.role = :role', { role: userRole })
        .andWhere('profile.skills IS NOT NULL')
        .groupBy('subject')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      return roleSuggestions.map(s => s.subject);
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des suggestions basées sur le rôle:', error);
      return [];
    }
  }

  /**
   * Suggestions basées sur la localisation
   */
  private async getLocationBasedSuggestions(userLocation: string): Promise<string[]> {
    try {
      const locationSuggestions = await this.profileRepository
        .createQueryBuilder('profile')
        .select('unnest(string_to_array(profile.skills, \',\'))', 'subject')
        .addSelect('COUNT(*)', 'count')
        .where('profile.location ILIKE :location', { location: `%${userLocation}%` })
        .andWhere('profile.skills IS NOT NULL')
        .groupBy('subject')
        .orderBy('count', 'DESC')
        .limit(8)
        .getRawMany();

      return locationSuggestions.map(s => s.subject);
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des suggestions basées sur la localisation:', error);
      return [];
    }
  }

  /**
   * Suggestions basées sur les sujets d'intérêt
   */
  private async getSubjectBasedSuggestions(userSubjects: string[]): Promise<string[]> {
    try {
      const subjectSuggestions = await this.profileRepository
        .createQueryBuilder('profile')
        .select('unnest(string_to_array(profile.skills, \',\'))', 'subject')
        .addSelect('COUNT(*)', 'count')
        .where('profile.skills ILIKE ANY(:userSubjects)', { userSubjects: userSubjects.map(s => `%${s}%`) })
        .andWhere('profile.skills IS NOT NULL')
        .groupBy('subject')
        .orderBy('count', 'DESC')
        .limit(8)
        .getRawMany();

      return subjectSuggestions.map(s => s.subject);
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des suggestions basées sur les sujets:', error);
      return [];
    }
  }

  /**
   * Obtient des suggestions de recherche avancées avec PostgreSQL FTS
   */
  async getAdvancedSearchSuggestions(query: string): Promise<{
    subjects: string[];
    locations: string[];
    skills: string[];
    languages: string[];
  }> {
    try {
      const [subjects, locations, skills, languages] = await Promise.all([
        this.getSubjectSuggestions(query),
        this.getLocationSuggestions(query),
        this.getSkillSuggestions(query),
        this.getLanguageSuggestions(query)
      ]);

      return {
        subjects: subjects.slice(0, 5),
        locations: locations.slice(0, 5),
        skills: skills.slice(0, 5),
        languages: languages.slice(0, 5)
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des suggestions avancées:', error);
      return {
        subjects: [],
        locations: [],
        skills: [],
        languages: []
      };
    }
  }

  private async getSubjectSuggestions(query: string): Promise<string[]> {
    try {
      const suggestions = await this.profileRepository
        .createQueryBuilder('profile')
        .select('unnest(string_to_array(profile.skills, \',\'))', 'subject')
        .where('profile.skills IS NOT NULL')
        .andWhere('profile.skills ILIKE :query', { query: `%${query}%` })
        .limit(5)
        .getRawMany();

      return suggestions.map(s => s.subject);
    } catch (error) {
      return [];
    }
  }

  private async getLocationSuggestions(query: string): Promise<string[]> {
    try {
      const suggestions = await this.profileRepository
        .createQueryBuilder('profile')
        .select('DISTINCT profile.location', 'location')
        .where('profile.location IS NOT NULL')
        .andWhere('profile.location ILIKE :query', { query: `%${query}%` })
        .limit(5)
        .getRawMany();

      return suggestions.map(s => s.location);
    } catch (error) {
      return [];
    }
  }

  private async getSkillSuggestions(query: string): Promise<string[]> {
    try {
      const suggestions = await this.profileRepository
        .createQueryBuilder('profile')
        .select('profile.bio', 'bio')
        .where('profile.bio IS NOT NULL')
        .andWhere('profile.bio ILIKE :query', { query: `%${query}%` })
        .limit(5)
        .getRawMany();

      // Extraire des compétences du bio (simplifié)
      return suggestions.map(s => s.bio?.substring(0, 50) + '...' || '');
    } catch (error) {
      return [];
    }
  }

  private async getLanguageSuggestions(query: string): Promise<string[]> {
    try {
      const suggestions = await this.profileRepository
        .createQueryBuilder('profile')
        .select('unnest(profile.languages)', 'language')
        .where('profile.languages IS NOT NULL')
        .andWhere('unnest(profile.languages) ILIKE :query', { query: `%${query}%` })
        .limit(5)
        .getRawMany();

      return suggestions.map(s => s.language);
    } catch (error) {
      return [];
    }
  }
}
