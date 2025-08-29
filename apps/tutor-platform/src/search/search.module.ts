import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchEngineService } from './services/search-engine.service';
import { SearchScoringService } from './services/search-scoring.service';
import { SearchSuggestionsService } from './services/search-suggestions.service';
import { FTSIndexingService } from './services/fts-indexing.service';
import { User } from '../common/entities/user.entity';
import { UserProfile } from '../common/entities/user-profile.entity';

/**
 * Module de recherche avec PostgreSQL FTS
 * Principe d'Inversion des Dépendances (DIP)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile]),
  ],
  controllers: [SearchController],
  providers: [
    // Services principaux
    SearchEngineService,
    SearchScoringService,
    SearchSuggestionsService,
    FTSIndexingService,
    
    // Interfaces pour l'injection de dépendances
    {
      provide: 'ISearchService',
      useClass: SearchEngineService,
    },
    {
      provide: 'ISearchScoringService',
      useClass: SearchScoringService,
    },
    {
      provide: 'ISearchSuggestionsService',
      useClass: SearchSuggestionsService,
    },
    {
      provide: 'IFTSIndexingService',
      useClass: FTSIndexingService,
    },
  ],
  exports: [
    SearchEngineService,
    SearchScoringService,
    SearchSuggestionsService,
    FTSIndexingService,
  ],
})
export class SearchModule {}
