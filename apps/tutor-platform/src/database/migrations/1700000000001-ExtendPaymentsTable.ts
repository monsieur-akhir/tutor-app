import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ExtendPaymentsTable1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter les colonnes nécessaires au workflow métier
    await queryRunner.addColumns('payments', [
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: true,
        comment: 'ID de l\'étudiant qui paie',
      }),
      new TableColumn({
        name: 'providerId',
        type: 'uuid',
        isNullable: true,
        comment: 'ID du tuteur/coach/mentor qui reçoit',
      }),
      new TableColumn({
        name: 'confirmedBy',
        type: 'uuid',
        isNullable: true,
        comment: 'ID de l\'admin qui confirme le paiement',
      }),
      new TableColumn({
        name: 'confirmedAt',
        type: 'timestamp',
        isNullable: true,
        comment: 'Date de confirmation du paiement',
      }),
      new TableColumn({
        name: 'adminNotes',
        type: 'text',
        isNullable: true,
        comment: 'Notes de l\'admin pour la validation',
      }),
      new TableColumn({
        name: 'paymentType',
        type: 'varchar',
        length: '50',
        default: "'deposit'",
        comment: 'Type de paiement: deposit, payout, refund',
      }),
      new TableColumn({
        name: 'paymentMethod',
        type: 'varchar',
        length: '50',
        default: "'mobile_money'",
        comment: 'Méthode de paiement: mobile_money, bank_transfer, cash',
      }),
    ]);

    // Ajouter les index pour les performances
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_userId" ON "payments" ("userId");
      CREATE INDEX IF NOT EXISTS "IDX_payments_providerId" ON "payments" ("providerId");
      CREATE INDEX IF NOT EXISTS "IDX_payments_confirmedBy" ON "payments" ("confirmedBy");
      CREATE INDEX IF NOT EXISTS "IDX_payments_paymentType" ON "payments" ("paymentType");
    `);

    // Ajouter les contraintes de clés étrangères
    await queryRunner.query(`
      ALTER TABLE "payments" 
      ADD CONSTRAINT "FK_payments_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;
      
      ALTER TABLE "payments" 
      ADD CONSTRAINT "FK_payments_providerId" 
      FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE SET NULL;
      
      ALTER TABLE "payments" 
      ADD CONSTRAINT "FK_payments_confirmedBy" 
      FOREIGN KEY ("confirmedBy") REFERENCES "users"("id") ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les contraintes de clés étrangères
    await queryRunner.query(`
      ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_userId";
      ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_providerId";
      ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_confirmedBy";
    `);

    // Supprimer les index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_payments_userId";
      DROP INDEX IF EXISTS "IDX_payments_providerId";
      DROP INDEX IF EXISTS "IDX_payments_confirmedBy";
      DROP INDEX IF EXISTS "IDX_payments_paymentType";
    `);

    // Supprimer les colonnes ajoutées
    await queryRunner.dropColumns('payments', [
      'userId',
      'providerId',
      'confirmedBy',
      'confirmedAt',
      'adminNotes',
      'paymentType',
      'paymentMethod',
    ]);
  }
}
