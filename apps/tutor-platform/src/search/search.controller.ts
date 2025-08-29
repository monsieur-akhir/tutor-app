import { Controller, Get, Query, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user.enum';
import { SearchEngineService } from './services/search-engine.service';
import { SearchSuggestionsService } from './services/search-suggestions.service';
import { FTSIndexingService } from './services/fts-indexing.service';
import { 
  SearchFilters, 
  SearchResponse, 
  SearchMode, 
  SortBy, 
  SortOrder 
} from './dto/search.dto';

/**
 * Contrôleur de recherche avec PostgreSQL FTS
 * Principe de Responsabilité Unique (SRP)
 */
@ApiTags('Recherche')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchEngineService: SearchEngineService,
    private readonly searchSuggestionsService: SearchSuggestionsService,
    private readonly ftsIndexingService: FTSIndexingService,
  ) {}

  /**
   * Endpoint de test temporaire sans authentification
   */
  @Get('test')
  @ApiOperation({
    summary: 'Test de recherche FTS',
    description: 'Endpoint de test temporaire pour vérifier la logique FTS'
  })
  async testSearch(): Promise<{ message: string; status: string }> {
    return { 
      message: 'SearchModule FTS fonctionne correctement', 
      status: 'success' 
    };
  }

  /**
   * Recherche de tuteurs avec FTS
   */
  @Get('tutors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Recherche de tuteurs',
    description: 'Recherche avancée de tuteurs avec PostgreSQL Full-Text Search'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des tuteurs trouvés',
    type: SearchResponse
  })
  @ApiQuery({ name: 'query', required: false, description: 'Terme de recherche' })
  @ApiQuery({ name: 'subjects', required: false, description: 'Sujets recherchés' })
  @ApiQuery({ name: 'location', required: false, description: 'Localisation' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Note minimale' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Prix maximum' })
  @ApiQuery({ name: 'mode', enum: SearchMode, required: false, description: 'Mode de recherche' })
  @ApiQuery({ name: 'sortBy', enum: SortBy, required: false, description: 'Critère de tri' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Résultats par page' })
  async searchTutors(@Query() filters: SearchFilters): Promise<SearchResponse> {
    return this.searchEngineService.searchTutors(filters);
  }

  /**
   * Recherche de coaches avec FTS
   */
  @Get('coaches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'Recherche de coaches',
    description: 'Recherche avancée de coaches avec PostgreSQL Full-Text Search'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Coaches trouvés',
    type: SearchResponse
  })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'subjects', required: false, type: String })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchCoaches(@Query() filters: SearchFilters): Promise<SearchResponse> {
    return this.searchEngineService.searchCoaches(filters);
  }

  /**
   * Recherche de mentors avec FTS
   */
  @Get('mentors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'Recherche de mentors',
    description: 'Recherche avancée de mentors avec PostgreSQL Full-Text Search'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Mentors trouvés',
    type: SearchResponse
  })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'subjects', required: false, type: String })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchMentors(@Query() filters: SearchFilters): Promise<SearchResponse> {
    return this.searchEngineService.searchMentors(filters);
  }

  /**
   * Recherche globale sur tous les rôles
   */
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Recherche globale',
    description: 'Recherche sur tous les types de providers avec FTS'
  })
  @ApiResponse({
    status: 200,
    description: 'Résultats de recherche globale',
    type: SearchResponse
  })
  async searchAll(@Query() filters: SearchFilters): Promise<SearchResponse> {
    return this.searchEngineService.searchAll(filters);
  }

  /**
   * Recherche avec géolocalisation
   */
  @Get('geolocation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Recherche avec géolocalisation',
    description: 'Recherche de providers proches d\'une localisation'
  })
  async searchWithGeolocation(
    @Query() filters: SearchFilters,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
    @Query('radius') radius?: number
  ): Promise<SearchResponse> {
    const userLat = lat ? parseFloat(lat.toString()) : 0;
    const userLng = lng ? parseFloat(lng.toString()) : 0;
    const radiusKm = radius ? parseFloat(radius.toString()) : 25;
    return this.searchEngineService.searchWithGeolocation(filters, userLat, userLng, radiusKm);
  }

  /**
   * Recherche avec disponibilité
   */
  @Get('availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Recherche avec disponibilité',
    description: 'Recherche de providers disponibles à des horaires spécifiques'
  })
  async searchWithAvailability(
    @Query() filters: SearchFilters,
    @Query('date') date?: string,
    @Query('duration') duration?: number
  ): Promise<SearchResponse> {
    const requestedDate = date ? new Date(date) : new Date();
    const durationMinutes = duration ? parseInt(duration.toString()) : 60;
    return this.searchEngineService.searchWithAvailability(filters, requestedDate, durationMinutes);
  }

  /**
   * Suggestions de recherche
   */
  @Get('suggestions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'Suggestions de recherche',
    description: 'Obtenir des suggestions de recherche intelligentes'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Suggestions de recherche',
    type: Array
  })
  @ApiQuery({ name: 'query', required: true, type: String })
  async getSuggestions(@Query('query') query: string) {
    return this.searchSuggestionsService.getSearchSuggestions(query);
  }

  /**
   * Suggestions avancées
   */
  @Get('suggestions/advanced')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Suggestions avancées',
    description: 'Suggestions contextuelles et basées sur le rôle'
  })
  async getAdvancedSuggestions(@Query('query') query: string) {
    return this.searchSuggestionsService.getAdvancedSearchSuggestions(query);
  }

  /**
   * Sujets populaires
   */
  @Get('suggestions/popular')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Sujets populaires',
    description: 'Liste des sujets les plus recherchés'
  })
  async getPopularSubjects() {
    return this.searchSuggestionsService.getPopularSubjects();
  }

  /**
   * Suggestions contextuelles
   */
  @Get('suggestions/contextual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Suggestions contextuelles',
    description: 'Suggestions basées sur le contexte utilisateur'
  })
  async getContextualSuggestions(
    @Req() req: any,
    @Query('location') location?: string,
    @Query('subjects') subjects?: string[]
  ) {
    const userRole = req.user?.role;
    return this.searchSuggestionsService.getContextualSuggestions(userRole, location, subjects);
  }

  /**
   * Création des index FTS (Admin uniquement)
   */
  @Post('admin/indexes/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Créer les index FTS',
    description: 'Créer ou recréer tous les index de recherche plein texte'
  })
  async createSearchIndexes() {
    return this.ftsIndexingService.createSearchIndexes();
  }

  /**
   * Mise à jour des index FTS (Admin uniquement)
   */
  @Post('admin/indexes/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Mettre à jour les index FTS',
    description: 'Mettre à jour les index de recherche plein texte'
  })
  async updateSearchIndexes() {
    return this.ftsIndexingService.updateSearchIndexes();
  }

  /**
   * Optimisation des index FTS (Admin uniquement)
   */
  @Post('admin/indexes/optimize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Optimiser les index FTS',
    description: 'Optimiser les performances des index de recherche'
  })
  async optimizeSearchIndexes() {
    return this.ftsIndexingService.optimizeSearchIndexes();
  }

  /**
   * Statut des index FTS (Admin uniquement)
   */
  @Get('admin/indexes/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Statut des index FTS',
    description: 'Vérifier l\'état et les performances des index'
  })
  async getIndexStatus() {
    return this.ftsIndexingService.getIndexStatus();
  }
}
