import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "public"."user_role_enum" AS ENUM('student', 'tutor', 'coach', 'mentor', 'admin')
    `);
    
    await queryRunner.query(`
      CREATE TYPE "public"."user_status_enum" AS ENUM('pending', 'active', 'suspended', 'banned')
    `);
    
    await queryRunner.query(`
      CREATE TYPE "public"."booking_status_enum" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'canceled', 'refunded', 'no_show')
    `);
    
    await queryRunner.query(`
      CREATE TYPE "public"."booking_mode_enum" AS ENUM('online', 'in_person', 'hybrid')
    `);
    
    await queryRunner.query(`
      CREATE TYPE "public"."availability_status_enum" AS ENUM('available', 'booked', 'unavailable', 'break')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "firstName" character varying(100) NOT NULL,
        "lastName" character varying(100) NOT NULL,
        "email" character varying(255) NOT NULL,
        "phone" character varying(20),
        "avatar" character varying(255),
        "role" "public"."user_role_enum" NOT NULL DEFAULT 'student',
        "status" "public"."user_status_enum" NOT NULL DEFAULT 'pending',
        "locale" character varying(10) NOT NULL DEFAULT 'fr',
        "isEmailVerified" boolean NOT NULL DEFAULT false,
        "isPhoneVerified" boolean NOT NULL DEFAULT false,
        "isTwoFactorEnabled" boolean NOT NULL DEFAULT false,
        "twoFactorSecret" character varying(255),
        "password" character varying(255) NOT NULL,
        "lastLoginAt" TIMESTAMP,
        "emailVerifiedAt" TIMESTAMP,
        "phoneVerifiedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "UQ_2d443082eccd5198f95f8853786" UNIQUE ("phone"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    // Create user_profiles table
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "bio" text,
        "title" character varying(100),
        "skills" text NOT NULL DEFAULT '{}',
        "languages" text NOT NULL DEFAULT '{}',
        "hourlyRate" numeric(5,2),
        "currency" character varying(3) NOT NULL DEFAULT 'USD',
        "education" jsonb,
        "experience" jsonb,
        "certifications" jsonb,
        "rating" numeric(3,2),
        "totalSessions" integer NOT NULL DEFAULT '0',
        "totalStudents" integer NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4dd2640c0e8c3f1b0c0c0c0c0c0" PRIMARY KEY ("id")
      )
    `);

    // Create user_sessions table
    await queryRunner.query(`
      CREATE TABLE "user_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "token" character varying(255) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "ipAddress" character varying(45),
        "userAgent" text,
        "isRevoked" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4dd2640c0e8c3f1b0c0c0c0c0c1" PRIMARY KEY ("id")
      )
    `);

    // Create user_notifications table
    await queryRunner.query(`
      CREATE TABLE "user_notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "type" character varying(50) NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4dd2640c0e8c3f1b0c0c0c0c0c2" PRIMARY KEY ("id")
      )
    `);

    // Create availabilities table
    await queryRunner.query(`
      CREATE TABLE "availabilities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "providerId" uuid NOT NULL,
        "start" TIMESTAMP NOT NULL,
        "end" TIMESTAMP NOT NULL,
        "status" "public"."availability_status_enum" NOT NULL DEFAULT 'available',
        "price" numeric(10,2),
        "currency" character varying(3) NOT NULL DEFAULT 'USD',
        "mode" character varying(50) NOT NULL DEFAULT 'online',
        "notes" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4dd2640c0e8c3f1b0c0c0c0c0c3" PRIMARY KEY ("id")
      )
    `);

    // Create availability_schedules table
    await queryRunner.query(`
      CREATE TABLE "availability_schedules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "providerId" uuid NOT NULL,
        "dayOfWeek" integer NOT NULL,
        "startTime" character varying(8) NOT NULL,
        "endTime" character varying(8) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "exceptions" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4dd2640c0e8c3f1b0c0c0c0c0c4" PRIMARY KEY ("id")
      )
    `);

    // Create bookings table
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentId" uuid NOT NULL,
        "providerId" uuid NOT NULL,
        "providerType" character varying(50) NOT NULL,
        "mode" "public"."booking_mode_enum" NOT NULL DEFAULT 'online',
        "start" TIMESTAMP NOT NULL,
        "end" TIMESTAMP NOT NULL,
        "status" "public"."booking_status_enum" NOT NULL DEFAULT 'pending',
        "price" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'USD',
        "notes" text,
        "cancelReason" character varying(255),
        "canceledAt" TIMESTAMP,
        "canceledBy" uuid,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4dd2640c0e8c3f1b0c0c0c0c0c5" PRIMARY KEY ("id")
      )
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "bookingId" uuid NOT NULL,
        "provider" character varying(50) NOT NULL,
        "providerRef" character varying(255) NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'pending',
        "amount" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'USD',
        "metadata" jsonb,
        "processedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_4dd2640c0e8c3f1b0c0c0c0c0c6" UNIQUE ("provider", "providerRef"),
        CONSTRAINT "PK_4dd2640c0e8c3f1b0c0c0c0c0c6" PRIMARY KEY ("id")
      )
    `);

    // Create evaluations table
    await queryRunner.query(`
      CREATE TABLE "evaluations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "bookingId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        "providerId" uuid NOT NULL,
        "type" character varying(50) NOT NULL DEFAULT 'feedback',
        "rating" numeric(2,1),
        "comment" text,
        "quizAnswers" jsonb,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4dd2640c0e8c3f1b0c0c0c0c0c7" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0c8" 
      FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0c9" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_notifications" ADD CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0ca" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "availabilities" ADD CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0cb" 
      FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "availability_schedules" ADD CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0cc" 
      FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings" ADD CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0cd" 
      FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings" ADD CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0ce" 
      FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "payments" ADD CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0cf" 
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "evaluations" ADD CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0d0" 
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "evaluations" ADD CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0d1" 
      FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "evaluations" ADD CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0d2" 
      FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d3" ON "availabilities" ("providerId", "start", "end")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d4" ON "availabilities" ("providerId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d5" ON "availabilities" ("start", "end")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d6" ON "bookings" ("providerId", "start", "end")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d7" ON "bookings" ("studentId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d8" ON "bookings" ("status", "start")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d9" ON "payments" ("bookingId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0da" ON "evaluations" ("bookingId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0db" ON "evaluations" ("studentId", "providerId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0db"`);
    await queryRunner.query(`DROP INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0da"`);
    await queryRunner.query(`DROP INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d9"`);
    await queryRunner.query(`DROP INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d8"`);
    await queryRunner.query(`DROP INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d7"`);
    await queryRunner.query(`DROP INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d6"`);
    await queryRunner.query(`DROP INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d5"`);
    await queryRunner.query(`DROP INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d4"`);
    await queryRunner.query(`DROP INDEX "IDX_4dd2640c0e8c3f1b0c0c0c0c0d3"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "evaluations" DROP CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0d2"`);
    await queryRunner.query(`ALTER TABLE "evaluations" DROP CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0d1"`);
    await queryRunner.query(`ALTER TABLE "evaluations" DROP CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0d0"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0cf"`);
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0ce"`);
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0cd"`);
    await queryRunner.query(`ALTER TABLE "availability_schedules" DROP CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0cc"`);
    await queryRunner.query(`ALTER TABLE "availabilities" DROP CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0cb"`);
    await queryRunner.query(`ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0ca"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0c9"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_4dd2640c0e8c3f1b0c0c0c0c0c8"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "evaluations"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TABLE "availability_schedules"`);
    await queryRunner.query(`DROP TABLE "availabilities"`);
    await queryRunner.query(`DROP TABLE "user_notifications"`);
    await queryRunner.query(`DROP TABLE "user_sessions"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."availability_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."booking_mode_enum"`);
    await queryRunner.query(`DROP TYPE "public"."booking_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}

