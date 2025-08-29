import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Service dédié à la gestion des index PostgreSQL FTS
 * Principe de Responsabilité Unique (SRP)
 */
@Injectable()
export class FTSIndexingService {
  private readonly logger = new Logger(FTSIndexingService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crée tous les index de recherche full-text
   */
  async createSearchIndexes(): Promise<void> {
    try {
      this.logger.log('Création des index de recherche FTS...');

      // Index FTS pour les profils utilisateurs
      await this.createUserProfileFTSIndex();
      
      // Index FTS pour les sujets
      await this.createSubjectsFTSIndex();
      
      // Index FTS pour les langues
      await this.createLanguagesFTSIndex();
      
      // Index FTS pour les biographies
      await this.createBioFTSIndex();

      this.logger.log('Index de recherche FTS créés avec succès');
    } catch (error) {
      this.logger.error('Erreur lors de la création des index FTS:', error);
      throw error;
    }
  }

  /**
   * Met à jour les index FTS existants
   */
  async updateSearchIndexes(): Promise<void> {
    try {
      this.logger.log('Mise à jour des index de recherche FTS...');

      // Recréer les index avec les nouvelles données
      await this.dropSearchIndexes();
      await this.createSearchIndexes();

      this.logger.log('Index de recherche FTS mis à jour avec succès');
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour des index FTS:', error);
      throw error;
    }
  }

  /**
   * Optimise les index FTS pour de meilleures performances
   */
  async optimizeSearchIndexes(): Promise<void> {
    try {
      this.logger.log('Optimisation des index de recherche FTS...');

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      // VACUUM ANALYZE pour optimiser les statistiques
      await queryRunner.query('VACUUM ANALYZE user_profiles');
      await queryRunner.query('VACUUM ANALYZE users');
      
      // Réindexer les index GIN pour de meilleures performances
      await queryRunner.query('REINDEX INDEX CONCURRENTLY IF EXISTS idx_user_profiles_fts');
      await queryRunner.query('REINDEX INDEX CONCURRENTLY IF EXISTS idx_users_fts');

      await queryRunner.release();
      this.logger.log('Index de recherche FTS optimisés avec succès');
    } catch (error) {
      this.logger.error('Erreur lors de l\'optimisation des index FTS:', error);
      throw error;
    }
  }

  /**
   * Supprime tous les index FTS
   */
  async dropSearchIndexes(): Promise<void> {
    try {
      this.logger.log('Suppression des index de recherche FTS...');

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      // Supprimer les index FTS
      await queryRunner.query('DROP INDEX IF EXISTS idx_user_profiles_fts');
      await queryRunner.query('DROP INDEX IF EXISTS idx_users_fts');
      await queryRunner.query('DROP INDEX IF EXISTS idx_skills_fts');
      await queryRunner.query('DROP INDEX IF EXISTS idx_languages_fts');
      await queryRunner.query('DROP INDEX IF EXISTS idx_bio_fts');

      await queryRunner.release();
      this.logger.log('Index de recherche FTS supprimés avec succès');
    } catch (error) {
      this.logger.error('Erreur lors de la suppression des index FTS:', error);
      throw error;
    }
  }

  /**
   * Crée l'index FTS principal pour les profils utilisateurs
   */
  private async createUserProfileFTSIndex(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Créer une colonne tsvector pour la recherche full-text
      await queryRunner.query(`
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS search_vector tsvector
      `);

      // Créer l'index GIN pour les performances
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_user_profiles_fts 
        ON user_profiles USING gin(search_vector)
      `);

      // Créer la fonction de mise à jour automatique
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION update_user_profile_search_vector()
        RETURNS trigger AS $$
        BEGIN
          NEW.search_vector :=
            setweight(to_tsvector('french', COALESCE(NEW.bio, '')), 'A') ||
            setweight(to_tsvector('french', COALESCE(NEW.skills, '')), 'B') ||
            setweight(to_tsvector('french', COALESCE(NEW.languages, '')), 'C') ||
            setweight(to_tsvector('french', COALESCE(NEW.title, '')), 'D');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Créer le trigger pour la mise à jour automatique
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS update_user_profile_search_vector_trigger ON user_profiles;
        CREATE TRIGGER update_user_profile_search_vector_trigger
          BEFORE INSERT OR UPDATE ON user_profiles
          FOR EACH ROW EXECUTE FUNCTION update_user_profile_search_vector();
      `);

      // Mettre à jour les données existantes
      await queryRunner.query(`
        UPDATE user_profiles SET search_vector = NULL;
        UPDATE user_profiles SET search_vector = search_vector;
      `);

    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Crée l'index FTS pour les utilisateurs
   */
  private async createUsersFTSIndex(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Créer une colonne tsvector pour la recherche full-text
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS search_vector tsvector
      `);

      // Créer l'index GIN
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_users_fts 
        ON users USING gin(search_vector)
      `);

      // Créer la fonction de mise à jour automatique
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION update_users_search_vector()
        RETURNS trigger AS $$
        BEGIN
          NEW.search_vector :=
            setweight(to_tsvector('french', COALESCE(NEW."firstName", '')), 'A') ||
            setweight(to_tsvector('french', COALESCE(NEW."lastName", '')), 'A') ||
            setweight(to_tsvector('french', COALESCE(NEW.email, '')), 'B') ||
            setweight(to_tsvector('french', COALESCE(NEW.phone, '')), 'C');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Créer le trigger
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS update_users_search_vector_trigger ON users;
        CREATE TRIGGER update_users_search_vector_trigger
          BEFORE INSERT OR UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_users_search_vector();
      `);

      // Mettre à jour les données existantes
      await queryRunner.query(`
        UPDATE users SET search_vector = NULL;
        UPDATE users SET search_vector = search_vector;
      `);

    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Crée l'index FTS pour les compétences
   */
  private async createSubjectsFTSIndex(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_skills_fts 
        ON user_profiles USING gin(to_tsvector('french', skills))
      `);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Crée l'index FTS pour les langues
   */
  private async createLanguagesFTSIndex(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_languages_fts 
        ON user_profiles USING gin(to_tsvector('french', array_to_string(languages, ' ')))
      `);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Crée l'index FTS pour les biographies
   */
  private async createBioFTSIndex(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_bio_fts 
        ON user_profiles USING gin(to_tsvector('french', bio))
      `);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Vérifie l'état des index FTS
   */
  async getIndexStatus(): Promise<{
    indexes: Array<{ name: string; size: string; status: string }>;
    totalSize: string;
  }> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const result = await queryRunner.query(`
        SELECT 
          indexname as name,
          pg_size_pretty(pg_relation_size(indexname::regclass)) as size,
          'active' as status
        FROM pg_indexes 
        WHERE indexname LIKE '%fts%'
        ORDER BY pg_relation_size(indexname::regclass) DESC;
      `);

      const totalSize = await queryRunner.query(`
        SELECT pg_size_pretty(SUM(pg_relation_size(indexname::regclass))) as total_size
        FROM pg_indexes 
        WHERE indexname LIKE '%fts%';
      `);

      await queryRunner.release();

      return {
        indexes: result,
        totalSize: totalSize[0]?.total_size || '0 bytes'
      };
    } catch (error) {
      this.logger.error('Erreur lors de la vérification du statut des index:', error);
      throw error;
    }
  }
}
