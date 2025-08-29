import { Injectable } from '@nestjs/common';
import { SearchFilters, SearchResult, SortBy, SortOrder } from '../dto/search.dto';

/**
 * Service dédié au calcul des scores de pertinence et au ranking
 * Principe de Responsabilité Unique (SRP)
 */
@Injectable()
export class SearchScoringService {
  /**
   * Calcule le score de pertinence d'un résultat
   * Basé sur PostgreSQL FTS + facteurs métier
   */
  calculateRelevanceScore(result: SearchResult, filters: SearchFilters): number {
    let score = 0;

    // Score de base PostgreSQL FTS (0-1)
    if (result.score) {
      score += result.score * 0.4; // 40% du score total
    }

    // Score basé sur la note (0-1)
    if (result.profile.rating) {
      score += (result.profile.rating / 5) * 0.25; // 25% du score total
    }

    // Score basé sur l'expérience (0-1)
    if (result.profile.experience) {
      const experienceScore = Math.min(result.profile.experience / 20, 1); // Max 20 ans
      score += experienceScore * 0.2; // 20% du score total
    }

    // Score basé sur le nombre de sessions (0-1)
    if (result.profile.totalSessions) {
      const sessionsScore = Math.min(result.profile.totalSessions / 500, 1); // Max 500 sessions
      score += sessionsScore * 0.1; // 10% du score total
    }

    // Score basé sur la distance (si géolocalisation)
    if (result.distance && filters.radius) {
      const distanceScore = Math.max(0, 1 - (result.distance / filters.radius));
      score += distanceScore * 0.05; // 5% du score total
    }

    return Math.round(score * 100) / 100; // Arrondi à 2 décimales
  }

  /**
   * Trie les résultats selon les critères spécifiés
   */
  rankResults(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    // Calculer les scores de pertinence
    const scoredResults = results.map(result => ({
      ...result,
      score: this.calculateRelevanceScore(result, filters)
    }));

    // Trier selon les critères
    const sortOrder = filters.sortOrder || SortOrder.DESC;
    
    switch (filters.sortBy) {
      case SortBy.RELEVANCE:
        return this.sortByRelevance(scoredResults, sortOrder);
      
      case SortBy.RATING:
        return this.sortByRating(scoredResults, sortOrder);
      
      case SortBy.PRICE:
        return this.sortByPrice(scoredResults, sortOrder);
      
      case SortBy.EXPERIENCE:
        return this.sortByExperience(scoredResults, sortOrder);
      
      case SortBy.AVAILABILITY:
        return this.sortByAvailability(scoredResults, sortOrder);
      
      default:
        return this.sortByRelevance(scoredResults, sortOrder);
    }
  }

  /**
   * Tri par pertinence (score FTS + métier)
   */
  private sortByRelevance(results: SearchResult[], order: SortOrder): SearchResult[] {
    return results.sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return order === SortOrder.DESC ? scoreB - scoreA : scoreA - scoreB;
    });
  }

  /**
   * Tri par note
   */
  private sortByRating(results: SearchResult[], order: SortOrder): SearchResult[] {
    return results.sort((a, b) => {
      const ratingA = a.profile.rating || 0;
      const ratingB = b.profile.rating || 0;
      return order === SortOrder.DESC ? ratingB - ratingA : ratingA - ratingB;
    });
  }

  /**
   * Tri par prix
   */
  private sortByPrice(results: SearchResult[], order: SortOrder): SearchResult[] {
    return results.sort((a, b) => {
      const priceA = a.profile.hourlyRate || 0;
      const priceB = b.profile.hourlyRate || 0;
      return order === SortOrder.DESC ? priceB - priceA : priceA - priceB;
    });
  }

  /**
   * Tri par expérience
   */
  private sortByExperience(results: SearchResult[], order: SortOrder): SearchResult[] {
    return results.sort((a, b) => {
      const expA = a.profile.experience || 0;
      const expB = b.profile.experience || 0;
      return order === SortOrder.DESC ? expB - expA : expA - expB;
    });
  }

  /**
   * Tri par disponibilité (nombre de créneaux disponibles)
   */
  private sortByAvailability(results: SearchResult[], order: SortOrder): SearchResult[] {
    return results.sort((a, b) => {
      const slotsA = a.availableSlots?.length || 0;
      const slotsB = b.availableSlots?.length || 0;
      return order === SortOrder.DESC ? slotsB - slotsA : slotsA - slotsB;
    });
  }

  /**
   * Applique des boosters de score pour des critères spécifiques
   */
  applyScoreBoosters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    return results.map(result => {
      let boostedScore = result.score || 0;

      // Booster pour les sujets exacts
      if (filters.subjects && result.profile.skills) {
        const userSkills = result.profile.skills.split(',').map((s: string) => s.trim());
        const exactMatches = filters.subjects.filter((subject: string) => 
          userSkills.some((skill: string) => skill.toLowerCase().includes(subject.toLowerCase()))
        );
        boostedScore += exactMatches.length * 0.1;
      }

      // Booster pour les langues exactes
      if (filters.languages && result.profile.languages) {
        const exactMatches = filters.languages.filter(language => 
          result.profile.languages?.includes(language)
        );
        boostedScore += exactMatches.length * 0.05;
      }

      // Booster pour la disponibilité immédiate
      if (filters.availability && result.availableSlots) {
        const hasImmediateAvailability = result.availableSlots.some(slot => {
          const slotDate = new Date(slot);
          const requestedDate = new Date(filters.availability!);
          const diffHours = Math.abs(slotDate.getTime() - requestedDate.getTime()) / (1000 * 60 * 60);
          return diffHours <= 24; // Dans les 24h
        });
        if (hasImmediateAvailability) {
          boostedScore += 0.15;
        }
      }

      return {
        ...result,
        score: Math.min(boostedScore, 1) // Cap à 1.0
      };
    });
  }
}
