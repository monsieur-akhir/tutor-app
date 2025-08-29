import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFTSSearchColumns1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne search_vector aux profils utilisateurs
    await queryRunner.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS search_vector tsvector;
    `);

    // Ajouter la colonne search_vector aux utilisateurs
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS search_vector tsvector;
    `);

    // Créer la fonction de mise à jour automatique pour les profils
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_user_profile_search_vector()
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('french', COALESCE(NEW.bio, '')), 'A') ||
          setweight(to_tsvector('french', COALESCE(array_to_string(NEW.subjects, ' '), '')), 'B') ||
          setweight(to_tsvector('french', COALESCE(array_to_string(NEW.languages, ' '), '')), 'C') ||
          setweight(to_tsvector('french', COALESCE(NEW.location, '')), 'D');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Créer la fonction de mise à jour automatique pour les utilisateurs
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_users_search_vector()
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('french', COALESCE(NEW.firstName, '')), 'A') ||
          setweight(to_tsvector('french', COALESCE(NEW.lastName, '')), 'A') ||
          setweight(to_tsvector('french', COALESCE(NEW.email, '')), 'B');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Créer les triggers pour la mise à jour automatique
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_user_profile_search_vector_trigger ON user_profiles;
      CREATE TRIGGER update_user_profile_search_vector_trigger
        BEFORE INSERT OR UPDATE ON user_profiles
        FOR EACH ROW EXECUTE FUNCTION update_user_profile_search_vector();
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_users_search_vector_trigger ON users;
      CREATE TRIGGER update_users_search_vector_trigger
        BEFORE INSERT OR UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_users_search_vector();
    `);

    // Créer les index GIN pour les performances
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_fts 
      ON user_profiles USING gin(search_vector);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_fts 
      ON users USING gin(search_vector);
    `);

    // Créer des index FTS supplémentaires pour les sujets et langues
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_subjects_fts 
      ON user_profiles USING gin(to_tsvector('french', array_to_string(subjects, ' ')));
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_languages_fts 
      ON user_profiles USING gin(to_tsvector('french', array_to_string(languages, ' ')));
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_bio_fts 
      ON user_profiles USING gin(to_tsvector('french', bio));
    `);

    // Mettre à jour les données existantes
    await queryRunner.query(`
      UPDATE user_profiles SET search_vector = NULL;
      UPDATE user_profiles SET search_vector = search_vector;
    `);

    await queryRunner.query(`
      UPDATE users SET search_vector = NULL;
      UPDATE users SET search_vector = search_vector;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les triggers
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_user_profile_search_vector_trigger ON user_profiles;
      DROP TRIGGER IF EXISTS update_users_search_vector_trigger ON users;
    `);

    // Supprimer les fonctions
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_user_profile_search_vector();
      DROP FUNCTION IF EXISTS update_users_search_vector();
    `);

    // Supprimer les index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_user_profiles_fts;
      DROP INDEX IF EXISTS idx_users_fts;
      DROP INDEX IF EXISTS idx_subjects_fts;
      DROP INDEX IF EXISTS idx_languages_fts;
      DROP INDEX IF EXISTS idx_bio_fts;
    `);

    // Supprimer les colonnes
    await queryRunner.query(`
      ALTER TABLE user_profiles DROP COLUMN IF EXISTS search_vector;
      ALTER TABLE users DROP COLUMN IF EXISTS search_vector;
    `);
  }
}
