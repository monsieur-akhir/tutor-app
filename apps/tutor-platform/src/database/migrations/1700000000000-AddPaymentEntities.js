const { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } = require('typeorm');

class AddPaymentEntities1700000000000 {
  async up(queryRunner) {
    // Créer la table payments
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'bookingId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'providerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['deposit', 'payout', 'refund'],
            isNullable: false,
          },
          {
            name: 'method',
            type: 'enum',
            enum: ['cash', 'bank_transfer', 'mobile_money', 'check'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'CFA'",
            isNullable: false,
          },
          {
            name: 'reference',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'adminNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'confirmedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'confirmedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'dueDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Créer la table payment_transactions
    await queryRunner.createTable(
      new Table({
        name: 'payment_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'paymentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'payment_created',
              'payment_confirmed',
              'payment_rejected',
              'payment_cancelled',
              'payout_processed',
              'refund_processed',
            ],
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'performedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Créer la table evaluations
    await queryRunner.createTable(
      new Table({
        name: 'evaluations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'bookingId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'studentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'providerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['quiz', 'feedback', 'milestone'],
            default: "'feedback'",
            isNullable: false,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 2,
            scale: 1,
            isNullable: true,
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'quizAnswers',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Ajouter les index
    await queryRunner.createIndex('payments', {
      name: 'IDX_payments_booking_status',
      columnNames: ['bookingId', 'status'],
    });

    await queryRunner.createIndex('payments', {
      name: 'IDX_payments_user_status',
      columnNames: ['userId', 'status'],
    });

    await queryRunner.createIndex('payments', {
      name: 'IDX_payments_status_created',
      columnNames: ['status', 'createdAt'],
    });

    await queryRunner.createIndex('payment_transactions', {
      name: 'IDX_payment_transactions_payment_created',
      columnNames: ['paymentId', 'createdAt'],
    });

    await queryRunner.createIndex('payment_transactions', {
      name: 'IDX_payment_transactions_type_created',
      columnNames: ['type', 'createdAt'],
    });

    await queryRunner.createIndex('evaluations', {
      name: 'IDX_evaluations_booking',
      columnNames: ['bookingId'],
    });

    await queryRunner.createIndex('evaluations', {
      name: 'IDX_evaluations_student_provider',
      columnNames: ['studentId', 'providerId'],
    });

    await queryRunner.createIndex('evaluations', {
      name: 'IDX_evaluations_type_created',
      columnNames: ['type', 'createdAt'],
    });

    // Ajouter les clés étrangères
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['bookingId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bookings',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['providerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['confirmedBy'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'payment_transactions',
      new TableForeignKey({
        columnNames: ['paymentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payments',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payment_transactions',
      new TableForeignKey({
        columnNames: ['performedBy'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'evaluations',
      new TableForeignKey({
        columnNames: ['bookingId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bookings',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'evaluations',
      new TableForeignKey({
        columnNames: ['studentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'evaluations',
      new TableForeignKey({
        columnNames: ['providerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  async down(queryRunner) {
    // Supprimer les clés étrangères
    const paymentsTable = await queryRunner.getTable('payments');
    const paymentTransactionsTable = await queryRunner.getTable('payment_transactions');
    const evaluationsTable = await queryRunner.getTable('evaluations');

    if (paymentsTable) {
      const foreignKeys = paymentsTable.foreignKeys;
      await queryRunner.dropForeignKeys('payments', foreignKeys);
    }

    if (paymentTransactionsTable) {
      const foreignKeys = paymentTransactionsTable.foreignKeys;
      await queryRunner.dropForeignKeys('payment_transactions', foreignKeys);
    }

    if (evaluationsTable) {
      const foreignKeys = evaluationsTable.foreignKeys;
      await queryRunner.dropForeignKeys('evaluations', foreignKeys);
    }

    // Supprimer les tables
    await queryRunner.dropTable('payment_transactions');
    await queryRunner.dropTable('evaluations');
    await queryRunner.dropTable('payments');
  }
}

module.exports = { AddPaymentEntities1700000000000 };

