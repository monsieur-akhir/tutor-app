import { useState, useEffect } from 'react';
import { SearchService } from '../services/search.service';
import type { SearchFilters, SearchResult } from '../services/search.service';
import { Search, Filter, MapPin, Star, Clock, DollarSign, Users } from 'lucide-react';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    role: 'tutor',
    page: 1,
    limit: 20,
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const searchProviders = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      const searchFilters = { ...filters, query: searchQuery };
      
      switch (filters.role) {
        case 'tutor':
          response = await SearchService.searchTutors(searchFilters);
          break;
        case 'coach':
          response = await SearchService.searchCoaches(searchFilters);
          break;
        case 'mentor':
          response = await SearchService.searchMentors(searchFilters);
          break;
        default:
          response = await SearchService.searchAll(searchFilters);
      }
      
      setResults(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchProviders();
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      tutor: 'Tuteur',
      coach: 'Coach',
      mentor: 'Mentor'
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de recherche */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Trouvez votre {getRoleLabel(filters.role || 'tutor')}
          </h1>
          
          {/* Barre de recherche principale */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par matière, compétence, localisation..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Recherche...' : 'Rechercher'}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Type de fournisseur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de fournisseur
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="tutor">Tuteurs</option>
                  <option value="coach">Coaches</option>
                  <option value="mentor">Mentors</option>
                </select>
              </div>

              {/* Note minimum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note minimum
                </label>
                <select
                  value={filters.minRating || ''}
                  onChange={(e) => handleFilterChange('minRating', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Toutes les notes</option>
                  <option value="4">4+ étoiles</option>
                  <option value="4.5">4.5+ étoiles</option>
                  <option value="5">5 étoiles</option>
                </select>
              </div>

              {/* Prix maximum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix maximum/h
                </label>
                <input
                  type="number"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="€/h"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Localisation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localisation
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="Ville, région..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Résultats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
              <div key={result.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* En-tête du profil */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {result.firstName} {result.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{getRoleLabel(result.role)}</p>
                    </div>
                    {result.profile?.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-900">
                          {result.profile.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Compétences */}
                  {result.profile?.skills && result.profile.skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Compétences :</p>
                      <div className="flex flex-wrap gap-2">
                        {result.profile.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {result.profile.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{result.profile.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Informations du profil */}
                  <div className="space-y-2 mb-4">
                    {result.profile?.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {result.profile.location}
                      </div>
                    )}
                    {result.profile?.hourlyRate && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        {result.profile.hourlyRate}€/h
                      </div>
                    )}
                    {result.profile?.totalSessions && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        {result.profile.totalSessions} sessions
                      </div>
                    )}
                  </div>

                  {/* Score de pertinence */}
                  {result.score && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pertinence :</span>
                        <span className="text-sm font-medium text-blue-600">
                          {result.score.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(result.score * 20, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                      Voir le profil
                    </button>
                    <button className="flex-1 bg-white text-blue-600 py-2 px-4 rounded-md text-sm font-medium border border-blue-600 hover:bg-blue-50 transition-colors">
                      Réserver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery && !isLoading ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-gray-600">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        ) : !searchQuery ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Commencez votre recherche
            </h3>
            <p className="text-gray-600">
              Entrez des mots-clés pour trouver des {getRoleLabel(filters.role || 'tutor')}s
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
