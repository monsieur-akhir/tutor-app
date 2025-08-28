import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { SearchModule } from './search/search.module';
import { AvailabilityModule } from './availability/availability.module';
import { BookingModule } from './booking/booking.module';
import { SessionsModule } from './sessions/sessions.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database
    DatabaseModule,
    
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60'),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
      },
    ]),
    
    // Queue management
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
      },
    }),
    
    // Health checks
    TerminusModule,
    
    // Feature modules
    AuthModule,
    ProfilesModule,
    SearchModule,
    AvailabilityModule,
    BookingModule,
    SessionsModule,
    EvaluationsModule,
    PaymentsModule,
    NotificationsModule,
    AdminModule,
    CommonModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
