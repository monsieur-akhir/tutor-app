import { SearchFilters, SearchResult } from '../dto/search.dto';

/**
 * Interface de base pour tous les services de recherche
 * Principe de Ségrégation des Interfaces (ISP)
 */
export interface IBaseSearchService {
  search(filters: SearchFilters): Promise<SearchResult[]>;
}

/**
 * Interface spécifique pour la recherche de tuteurs
 */
export interface ITutorSearchService extends IBaseSearchService {
  searchTutors(filters: SearchFilters): Promise<SearchResult[]>;
}

/**
 * Interface spécifique pour la recherche de coaches
 */
export interface ICoachSearchService extends IBaseSearchService {
  searchCoaches(filters: SearchFilters): Promise<SearchResult[]>;
}

/**
 * Interface spécifique pour la recherche de mentors
 */
export interface IMentorSearchService extends IBaseSearchService {
  searchMentors(filters: SearchFilters): Promise<SearchResult[]>;
}

/**
 * Interface pour les suggestions de recherche
 */
export interface ISearchSuggestionsService {
  getSearchSuggestions(query: string): Promise<string[]>;
  getPopularSubjects(): Promise<string[]>;
  getRecentSearches(userId: string): Promise<string[]>;
}

/**
 * Interface pour l'indexation FTS
 */
export interface IFTSIndexingService {
  createSearchIndexes(): Promise<void>;
  updateSearchIndexes(): Promise<void>;
  optimizeSearchIndexes(): Promise<void>;
}

/**
 * Interface pour le scoring et ranking
 */
export interface ISearchScoringService {
  calculateRelevanceScore(result: SearchResult, filters: SearchFilters): number;
  rankResults(results: SearchResult[], filters: SearchFilters): SearchResult[];
}
