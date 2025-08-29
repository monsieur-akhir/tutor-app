import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../common/entities/user.entity';
import { UserProfile } from '../../common/entities/user-profile.entity';
import { SearchFilters, SearchResult, SearchResponse, SearchMode } from '../dto/search.dto';
import { SearchScoringService } from './search-scoring.service';
import { SearchSuggestionsService } from './search-suggestions.service';

/**
 * Service principal de recherche avec PostgreSQL FTS
 * Principe de Responsabilité Unique (SRP)
 */
@Injectable()
export class SearchEngineService {
  private readonly logger = new Logger(SearchEngineService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    private readonly searchScoringService: SearchScoringService,
    private readonly searchSuggestionsService: SearchSuggestionsService,
  ) {}

  /**
   * Recherche avancée avec PostgreSQL FTS
   */
  async search(filters: SearchFilters): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🔍 [SEARCH] Début de la recherche avec filtres: ${JSON.stringify(filters)}`);

      // Construire la requête de base
      this.logger.log(`🔍 [SEARCH] Construction de la requête de base...`);
      let query = this.buildBaseQuery(filters);
      this.logger.log(`🔍 [SEARCH] Requête de base construite: ${query.getQuery()}`);

      // Appliquer la recherche FTS si une requête est fournie
      if (filters.query) {
        this.logger.log(`🔍 [SEARCH] Application de la recherche FTS pour: "${filters.query}"`);
        query = this.applyFTSQuery(query, filters);
        this.logger.log(`🔍 [SEARCH] Requête FTS appliquée: ${query.getQuery()}`);
      }

      // Appliquer les filtres métier
      this.logger.log(`🔍 [SEARCH] Application des filtres métier...`);
      query = this.applyBusinessFilters(query, filters);
      this.logger.log(`🔍 [SEARCH] Filtres métier appliqués: ${query.getQuery()}`);

      // Compter le total des résultats de manière sûre
      this.logger.log(`🔍 [SEARCH] Comptage du total des résultats...`);
      
      let total;
      try {
        total = await this.getTotalCount(filters);
        this.logger.log(`🔍 [SEARCH] Total des résultats: ${total}`);
      } catch (countError) {
        this.logger.error(`❌ [SEARCH] Erreur lors du comptage:`, countError);
        throw countError;
      }

      // Appliquer la pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      this.logger.log(`🔍 [SEARCH] Application de la pagination: page=${page}, limit=${limit}`);
      query.skip((page - 1) * limit).take(limit);

      // Exécuter la requête
      this.logger.log(`🔍 [SEARCH] Exécution de la requête finale...`);
      this.logger.log(`🔍 [SEARCH] Requête finale: ${query.getQuery()}`);
      this.logger.log(`🔍 [SEARCH] Paramètres: ${JSON.stringify(query.getParameters())}`);
      
      let results;
      try {
        results = await query.getMany();
        this.logger.log(`🔍 [SEARCH] Requête exécutée avec succès, ${results.length} résultats bruts`);
      } catch (queryError) {
        this.logger.error(`❌ [SEARCH] Erreur lors de l'exécution de la requête:`, queryError);
        this.logger.error(`❌ [SEARCH] Requête qui a échoué: ${query.getQuery()}`);
        this.logger.error(`❌ [SEARCH] Paramètres: ${JSON.stringify(query.getParameters())}`);
        throw queryError;
      }

      // Transformer les résultats
      this.logger.log(`🔍 [SEARCH] Transformation des résultats...`);
      const transformedResults = await this.transformResults(results, filters);
      this.logger.log(`🔍 [SEARCH] ${transformedResults.length} résultats transformés`);

      // Calculer le temps de traitement
      const processingTime = Date.now() - startTime;

      this.logger.log(`✅ [SEARCH] Recherche terminée avec succès en ${processingTime}ms, ${transformedResults.length} résultats`);

      return {
        results: transformedResults,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        processingTime,
        appliedFilters: filters
      };
    } catch (error) {
      this.logger.error(`❌ [SEARCH] Erreur fatale lors de la recherche:`, error);
      this.logger.error(`❌ [SEARCH] Stack trace:`, error.stack);
      throw error;
    }
  }

  /**
   * Construit la requête de base avec les jointures nécessaires
   */
  private buildBaseQuery(filters: SearchFilters) {
    this.logger.log(`🔍 [BUILD_QUERY] Construction de la requête de base...`);
    
    let query = this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.profile', 'p')
      .where('u.status = :status', { status: 'active' });

    this.logger.log(`🔍 [BUILD_QUERY] Requête initiale: ${query.getQuery()}`);

    // Filtrer par rôle si spécifié
    if (filters.role) {
      this.logger.log(`🔍 [BUILD_QUERY] Ajout du filtre de rôle: ${filters.role}`);
      query = query.andWhere('u.role = :role', { role: filters.role });
      this.logger.log(`🔍 [BUILD_QUERY] Requête après filtre de rôle: ${query.getQuery()}`);
    }

    this.logger.log(`🔍 [BUILD_QUERY] Requête de base finale: ${query.getQuery()}`);
    this.logger.log(`🔍 [BUILD_QUERY] Paramètres: ${JSON.stringify(query.getParameters())}`);
    
    return query;
  }

  /**
   * Construit une requête de base pour le comptage (sans scoring)
   */
  private buildCountBase(filters: SearchFilters) {
    this.logger.log(`🔍 [COUNT_BASE] Construction de la requête de comptage...`);
    
    let qb = this.userRepository
      .createQueryBuilder('u')
      .leftJoin('u.profile', 'p')
      .where('u.status = :status', { status: 'active' });

    // Filtrer par rôle si spécifié
    if (filters.role) {
      qb = qb.andWhere('u.role = :role', { role: filters.role });
    }

    // FTS "count" (SANS scoring)
    if (filters.query) {
      const searchQuery = filters.query;
      const fuzzyQuery = `%${searchQuery}%`;
      qb = qb.andWhere(`
        (p.search_vector @@ plainto_tsquery('french', :searchQuery)
         OR u.search_vector @@ plainto_tsquery('french', :searchQuery)
         OR p.bio ILIKE :fuzzyQuery
         OR p.skills ILIKE :fuzzyQuery
         OR p.languages::text ILIKE :fuzzyQuery)
      `, { searchQuery, fuzzyQuery });
    }

    // Filtres métier "count" (SANS scoring)
    if (filters.subjects?.length) {
      qb = qb.andWhere('p.skills ILIKE ANY(:subjects)', { 
        subjects: filters.subjects.map(s => `%${s}%`) 
      });
    }
    if (filters.languages?.length) {
      qb = qb.andWhere('p.languages && :languages', { languages: filters.languages });
    }
    if (filters.minRating) {
      qb = qb.andWhere('p.rating >= :minRating', { minRating: filters.minRating });
    }
    if (filters.maxPrice) {
      qb = qb.andWhere('p.hourlyRate <= :maxPrice', { maxPrice: filters.maxPrice });
    }
    if (filters.location) {
      qb = qb.andWhere('p.location ILIKE :loc', { loc: `%${filters.location}%` });
    }
    if (filters.availability) {
      qb = qb.andWhere('p.isAvailable = :isAvailable', { isAvailable: true });
    }

    this.logger.log(`🔍 [COUNT_BASE] Requête de comptage finale: ${qb.getQuery()}`);
    
    return qb;
  }

  /**
   * Utilitaire: nettoie la QB pour un COUNT sûr
   */
  private makeCountSafe(qb: any) {
    return qb.clone()
      .select([])                 // on enlève toute sélection précédente
      .orderBy()                  // on supprime tout ORDER BY
      .limit(undefined)           // pas de pagination
      .offset(undefined)
      .select('COUNT(DISTINCT u.id)', 'cnt');
  }

  /**
   * Obtient le total des résultats de manière sûre
   */
  private async getTotalCount(filters: SearchFilters): Promise<number> {
    const base = this.buildCountBase(filters);
    const countQb = this.makeCountSafe(base);
    const row = await countQb.getRawOne();
    return Number(row?.cnt ?? 0);
  }

  /**
   * Applique la recherche PostgreSQL FTS
   */
  private applyFTSQuery(query: any, filters: SearchFilters) {
    const { query: searchQuery, mode } = filters;

    this.logger.log(`🔍 [FTS_QUERY] Application de la recherche FTS: mode=${mode}, query="${searchQuery}"`);

    if (!searchQuery) {
      this.logger.log(`🔍 [FTS_QUERY] Aucune requête de recherche, retour de la requête de base`);
      return query;
    }

    let resultQuery;
    switch (mode) {
      case SearchMode.EXACT:
        this.logger.log(`🔍 [FTS_QUERY] Mode EXACT sélectionné`);
        resultQuery = this.applyExactSearch(query, searchQuery);
        break;
      
      case SearchMode.FUZZY:
        this.logger.log(`🔍 [FTS_QUERY] Mode FUZZY sélectionné`);
        resultQuery = this.applyFuzzySearch(query, searchQuery);
        break;
      
      case SearchMode.SEMANTIC:
        this.logger.log(`🔍 [FTS_QUERY] Mode SEMANTIC sélectionné`);
        resultQuery = this.applySemanticSearch(query, searchQuery);
        break;
      
      default:
        this.logger.log(`🔍 [FTS_QUERY] Mode par défaut FUZZY sélectionné`);
        resultQuery = this.applyFuzzySearch(query, searchQuery);
    }

    this.logger.log(`🔍 [FTS_QUERY] Requête FTS finale: ${resultQuery.getQuery()}`);
    this.logger.log(`🔍 [FTS_QUERY] Paramètres FTS: ${JSON.stringify(resultQuery.getParameters())}`);
    
    return resultQuery;
  }



  /**
   * Recherche exacte avec PostgreSQL FTS
   */
  private applyExactSearch(query: any, searchQuery: string) {
    return query
      .andWhere(`
        (p.search_vector @@ plainto_tsquery('french', :searchQuery) OR
         u.search_vector @@ plainto_tsquery('french', :searchQuery))
      `, { searchQuery })
      .addSelect(`
        ts_rank_cd(p.search_vector, plainto_tsquery('french', :searchQuery)) +
        ts_rank_cd(u.search_vector, plainto_tsquery('french', :searchQuery))
      `, 'score')
      .orderBy('score', 'DESC');
  }

  /**
   * Recherche exacte avec PostgreSQL FTS pour le comptage (sans scoring)
   */
  private applyExactSearchForCount(query: any, searchQuery: string) {
    return query
      .andWhere(`
        (profile.search_vector @@ plainto_tsquery('french', :searchQuery) OR
         user.search_vector @@ plainto_tsquery('french', :searchQuery))
      `, { searchQuery });
  }

  /**
   * Recherche floue avec PostgreSQL FTS
   */
  private applyFuzzySearch(query: any, searchQuery: string) {
    this.logger.log(`🔍 [FUZZY_SEARCH] Application de la recherche floue pour: "${searchQuery}"`);
    
    // Recherche FTS + recherche floue avec trigram
    const resultQuery = query
      .andWhere(`
        (p.search_vector @@ plainto_tsquery('french', :searchQuery) OR
         u.search_vector @@ plainto_tsquery('french', :searchQuery) OR
         p.bio ILIKE :fuzzyQuery OR
         p.skills ILIKE ANY(string_to_array(:searchQuery, ' ')) OR
         p.languages ILIKE ANY(string_to_array(:searchQuery, ' ')))
      `, { 
        searchQuery,
        fuzzyQuery: `%${searchQuery}%`
      })
      .addSelect(`
        COALESCE(ts_rank_cd(p.search_vector, plainto_tsquery('french', :searchQuery)), 0) +
        COALESCE(ts_rank_cd(u.search_vector, plainto_tsquery('french', :searchQuery)), 0) +
        CASE WHEN p.bio ILIKE :fuzzyQuery THEN 0.1 ELSE 0 END +
        CASE WHEN p.skills ILIKE ANY(string_to_array(:searchQuery, ' ')) THEN 0.2 ELSE 0 END +
        CASE WHEN p.languages ILIKE ANY(string_to_array(:searchQuery, ' ')) THEN 0.1 ELSE 0 END
      `, 'score')
      .orderBy('score', 'DESC');

    this.logger.log(`🔍 [FUZZY_SEARCH] Requête floue construite: ${resultQuery.getQuery()}`);
    this.logger.log(`🔍 [FUZZY_SEARCH] Paramètres: ${JSON.stringify(resultQuery.getParameters())}`);
    
    return resultQuery;
  }

  /**
   * Recherche floue avec PostgreSQL FTS pour le comptage (sans scoring)
   */
  private applyFuzzySearchForCount(query: any, searchQuery: string) {
    this.logger.log(`🔍 [FUZZY_COUNT_SEARCH] Application de la recherche floue pour comptage: "${searchQuery}"`);
    
    // Recherche FTS + recherche floue simplifiée (sans scoring)
    const resultQuery = query
      .andWhere(`
        (profile.search_vector @@ plainto_tsquery('french', :searchQuery) OR
         user.search_vector @@ plainto_tsquery('french', :searchQuery) OR
         profile.bio ILIKE :fuzzyQuery OR
         profile.skills ILIKE :fuzzyQuery OR
         profile.languages ILIKE :fuzzyQuery)
      `, { 
        searchQuery,
        fuzzyQuery: `%${searchQuery}%`
      });

    this.logger.log(`🔍 [FUZZY_COUNT_SEARCH] Requête floue de comptage construite: ${resultQuery.getQuery()}`);
    
    return resultQuery;
  }

  /**
   * Recherche sémantique avec PostgreSQL FTS
   */
  private applySemanticSearch(query: any, searchQuery: string) {
    // Recherche FTS + similarité sémantique
    return query
      .andWhere(`
        (p.search_vector @@ plainto_tsquery('french', :searchQuery) OR
         u.search_vector @@ plainto_tsquery('french', :searchQuery) OR
         similarity(p.bio, :searchQuery) > 0.3 OR
         similarity(p.skills, :searchQuery) > 0.3)
      `, { searchQuery })
      .addSelect(`
        COALESCE(ts_rank_cd(p.search_vector, plainto_tsquery('french', :searchQuery)), 0) +
        COALESCE(ts_rank_cd(u.search_vector, plainto_tsquery('french', :searchQuery)), 0) +
        COALESCE(similarity(p.bio, :searchQuery), 0) * 0.5 +
        COALESCE(similarity(p.skills, :searchQuery), 0) * 0.3
      `, 'score')
      .orderBy('score', 'DESC');
  }

  /**
   * Recherche sémantique avec PostgreSQL FTS pour le comptage (sans scoring)
   */
  private applySemanticSearchForCount(query: any, searchQuery: string) {
    // Recherche FTS + similarité sémantique (sans scoring)
    return query
      .andWhere(`
        (profile.search_vector @@ plainto_tsquery('french', :searchQuery) OR
         user.search_vector @@ plainto_tsquery('french', :searchQuery) OR
         profile.bio ILIKE :fuzzyQuery OR
         profile.skills ILIKE :fuzzyQuery)
      `, { 
        searchQuery,
        fuzzyQuery: `%${searchQuery}%`
      });
  }

  /**
   * Applique les filtres métier
   */
  private applyBusinessFilters(query: any, filters: SearchFilters) {
    this.logger.log(`🔍 [BUSINESS_FILTERS] Application des filtres métier: ${JSON.stringify(filters)}`);
    
    // Filtre par sujets
    if (filters.subjects && filters.subjects.length > 0) {
      this.logger.log(`🔍 [BUSINESS_FILTERS] Ajout du filtre par sujets: ${filters.subjects}`);
      query = query.andWhere('p.skills ILIKE ANY(:subjects)', { 
        subjects: filters.subjects.map(s => `%${s}%`) 
      });
      this.logger.log(`🔍 [BUSINESS_FILTERS] Requête après filtre sujets: ${query.getQuery()}`);
    }

    // Filtre par langues
    if (filters.languages && filters.languages.length > 0) {
      this.logger.log(`🔍 [BUSINESS_FILTERS] Ajout du filtre par langues: ${filters.languages}`);
      query = query.andWhere('p.languages && :languages', { languages: filters.languages });
      this.logger.log(`🔍 [BUSINESS_FILTERS] Requête après filtre langues: ${query.getQuery()}`);
    }

    // Filtre par note minimale
    if (filters.minRating) {
      this.logger.log(`🔍 [BUSINESS_FILTERS] Ajout du filtre par note minimale: ${filters.minRating}`);
      query = query.andWhere('p.rating >= :minRating', { minRating: filters.minRating });
      this.logger.log(`🔍 [BUSINESS_FILTERS] Requête après filtre note: ${query.getQuery()}`);
    }

    // Filtre par prix maximum
    if (filters.maxPrice) {
      this.logger.log(`🔍 [BUSINESS_FILTERS] Ajout du filtre par prix maximum: ${filters.maxPrice}`);
      query = query.andWhere('p.hourlyRate <= :maxPrice', { maxPrice: filters.maxPrice });
      this.logger.log(`🔍 [BUSINESS_FILTERS] Requête après filtre prix: ${query.getQuery()}`);
    }

    // Filtre par localisation (géolocalisation simplifiée)
    if (filters.location) {
      this.logger.log(`🔍 [BUSINESS_FILTERS] Ajout du filtre par localisation: ${filters.location}`);
      query = query.andWhere('p.location ILIKE :location', { location: `%${filters.location}%` });
      this.logger.log(`🔍 [BUSINESS_FILTERS] Requête après filtre localisation: ${query.getQuery()}`);
    }

    // Filtre par disponibilité
    if (filters.availability) {
      this.logger.log(`🔍 [BUSINESS_FILTERS] Ajout du filtre par disponibilité: ${filters.availability}`);
      // TODO: Implémenter la logique de disponibilité avec le module Availability
      query = query.andWhere('p.isAvailable = :isAvailable', { isAvailable: true });
      this.logger.log(`🔍 [BUSINESS_FILTERS] Requête après filtre disponibilité: ${query.getQuery()}`);
    }

    this.logger.log(`🔍 [BUSINESS_FILTERS] Requête finale après tous les filtres: ${query.getQuery()}`);
    this.logger.log(`🔍 [BUSINESS_FILTERS] Paramètres finaux: ${JSON.stringify(query.getParameters())}`);
    
    return query;
  }

  /**
   * Applique les filtres métier pour le comptage (sans scoring)
   */
  private applyBusinessFiltersForCount(query: any, filters: SearchFilters) {
    this.logger.log(`🔍 [BUSINESS_FILTERS_COUNT] Application des filtres métier pour comptage: ${JSON.stringify(filters)}`);
    
    // Filtre par sujets
    if (filters.subjects && filters.subjects.length > 0) {
      query = query.andWhere('profile.skills ILIKE ANY(:subjects)', { 
        subjects: filters.subjects.map(s => `%${s}%`) 
      });
    }

    // Filtre par langues
    if (filters.languages && filters.languages.length > 0) {
      query = query.andWhere('profile.languages && :languages', { languages: filters.languages });
    }

    // Filtre par note minimale
    if (filters.minRating) {
      query = query.andWhere('profile.rating >= :minRating', { minRating: filters.minRating });
    }

    // Filtre par prix maximum
    if (filters.maxPrice) {
      query = query.andWhere('profile.hourlyRate <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    // Filtre par localisation (géolocalisation simplifiée)
    if (filters.location) {
      query = query.andWhere('profile.location ILIKE :location', { location: `%${filters.location}%` });
    }

    // Filtre par disponibilité
    if (filters.availability) {
      // TODO: Implémenter la logique de disponibilité avec le module Availability
      query = query.andWhere('profile.isAvailable = :isAvailable', { isAvailable: true });
    }

    this.logger.log(`🔍 [BUSINESS_FILTERS_COUNT] Requête de comptage finale: ${query.getQuery()}`);
    
    return query;
  }

  /**
   * Transforme les résultats de la base de données
   */
  private async transformResults(results: any[], filters: SearchFilters): Promise<SearchResult[]> {
    const transformedResults = results.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profile: {
        bio: user.profile?.bio,
        subjects: user.profile?.skills ? user.profile.skills.split(',').map((s: string) => s.trim()) : [],
        languages: user.profile?.languages,
        hourlyRate: user.profile?.hourlyRate,
        rating: user.profile?.rating,
        totalSessions: user.profile?.totalSessions,
        location: user.profile?.location,
        experience: user.profile?.experience,
      },
      score: user.score || 0,
      distance: this.calculateDistance(filters.location, user.profile?.location),
      availableSlots: [], // TODO: Récupérer depuis le module Availability
    }));

    // Appliquer le scoring et le ranking
    const scoredResults = this.searchScoringService.applyScoreBoosters(transformedResults, filters);
    return this.searchScoringService.rankResults(scoredResults, filters);
  }

  /**
   * Calcule la distance entre deux localisations (simplifié)
   */
  private calculateDistance(userLocation?: string, providerLocation?: string): number | undefined {
    if (!userLocation || !providerLocation) return undefined;
    
    // TODO: Implémenter un vrai calcul de distance avec géolocalisation
    // Pour l'instant, retourner une distance aléatoire pour la démo
    return Math.random() * 50; // 0-50 km
  }

  /**
   * Recherche de tuteurs avec FTS
   */
  async searchTutors(filters: SearchFilters): Promise<SearchResponse> {
    const tutorFilters = { ...filters, role: 'tutor' };
    return this.search(tutorFilters);
  }

  /**
   * Recherche de coaches avec FTS
   */
  async searchCoaches(filters: SearchFilters): Promise<SearchResponse> {
    const coachFilters = { ...filters, role: 'coach' };
    return this.search(coachFilters);
  }

  /**
   * Recherche de mentors avec FTS
   */
  async searchMentors(filters: SearchFilters): Promise<SearchResponse> {
    const mentorFilters = { ...filters, role: 'mentor' };
    return this.search(mentorFilters);
  }

  /**
   * Recherche globale sur tous les rôles
   */
  async searchAll(filters: SearchFilters): Promise<SearchResponse> {
    return this.search(filters);
  }

  /**
   * Recherche avec géolocalisation avancée
   */
  async searchWithGeolocation(
    filters: SearchFilters,
    userLat: number,
    userLng: number,
    radiusKm: number = 25
  ): Promise<SearchResponse> {
    // TODO: Implémenter la recherche géolocalisée avec PostgreSQL PostGIS
    // Pour l'instant, utiliser la recherche standard
    return this.search(filters);
  }

  /**
   * Recherche avec disponibilité en temps réel
   */
  async searchWithAvailability(
    filters: SearchFilters,
    requestedDate: Date,
    durationMinutes: number = 60
  ): Promise<SearchResponse> {
    // TODO: Intégrer avec le module Availability pour vérifier la disponibilité
    const availabilityFilters = { ...filters, availability: requestedDate.toISOString() };
    return this.search(availabilityFilters);
  }
}
