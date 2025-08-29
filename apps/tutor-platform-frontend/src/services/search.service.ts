import { api } from '../lib/api';

export interface SearchFilters {
  query?: string;
  role?: 'tutor' | 'coach' | 'mentor';
  subjects?: string[];
  languages?: string[];
  minRating?: number;
  maxPrice?: number;
  location?: string;
  availability?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'rating' | 'price' | 'experience' | 'availability';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profile: {
    bio?: string;
    skills?: string[];
    languages?: string[];
    hourlyRate?: number;
    rating?: number;
    totalSessions?: number;
    location?: string;
    experience?: number;
    isAvailable?: boolean;
  };
  score?: number;
  distance?: number;
  availableSlots?: string[];
}

export interface SearchResponse {
  data: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchSuggestions {
  subjects: string[];
  locations: string[];
  languages: string[];
  popularSearches: string[];
}

export class SearchService {
  // Recherche de tuteurs
  static async searchTutors(filters: SearchFilters): Promise<SearchResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    const response = await api.get<SearchResponse>(`/search/tutors?${params.toString()}`);
    return response.data;
  }

  // Recherche de coaches
  static async searchCoaches(filters: SearchFilters): Promise<SearchResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    const response = await api.get<SearchResponse>(`/search/coaches?${params.toString()}`);
    return response.data;
  }

  // Recherche de mentors
  static async searchMentors(filters: SearchFilters): Promise<SearchResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    const response = await api.get<SearchResponse>(`/search/mentors?${params.toString()}`);
    return response.data;
  }

  // Recherche globale
  static async searchAll(filters: SearchFilters): Promise<SearchResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    const response = await api.get<SearchResponse>(`/search/all?${params.toString()}`);
    return response.data;
  }

  // Recherche avec géolocalisation
  static async searchWithGeolocation(
    filters: SearchFilters,
    lat: number,
    lng: number,
    radius: number = 50
  ): Promise<SearchResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    params.append('lat', lat.toString());
    params.append('lng', lng.toString());
    params.append('radius', radius.toString());
    
    const response = await api.get<SearchResponse>(`/search/geolocation?${params.toString()}`);
    return response.data;
  }

  // Recherche avec disponibilité
  static async searchWithAvailability(
    filters: SearchFilters,
    date: string,
    duration: number
  ): Promise<SearchResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    params.append('date', date);
    params.append('duration', duration.toString());
    
    const response = await api.get<SearchResponse>(`/search/availability?${params.toString()}`);
    return response.data;
  }

  // Obtenir les suggestions de recherche
  static async getSearchSuggestions(query?: string): Promise<SearchSuggestions> {
    const params = query ? `?query=${encodeURIComponent(query)}` : '';
    const response = await api.get<SearchSuggestions>(`/search/suggestions${params}`);
    return response.data;
  }

  // Obtenir les suggestions avancées
  static async getAdvancedSuggestions(query: string): Promise<SearchSuggestions> {
    const response = await api.get<SearchSuggestions>(`/search/advanced-suggestions?query=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Obtenir les sujets populaires
  static async getPopularSubjects(): Promise<string[]> {
    const response = await api.get<{ subjects: string[] }>('/search/popular-subjects');
    return response.data.subjects;
  }

  // Obtenir les suggestions contextuelles
  static async getContextualSuggestions(location?: string, subjects?: string[]): Promise<SearchSuggestions> {
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (subjects) {
      subjects.forEach(subject => params.append('subjects', subject));
    }
    
    const response = await api.get<SearchSuggestions>(`/search/contextual-suggestions?${params.toString()}`);
    return response.data;
  }
}
