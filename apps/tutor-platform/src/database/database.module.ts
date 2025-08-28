import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import des entités
import { User } from '../common/entities/user.entity';
import { UserProfile } from '../common/entities/user-profile.entity';
import { UserSession } from '../common/entities/user-session.entity';
import { UserNotification } from '../common/entities/user-notification.entity';
import { Booking } from '../common/entities/booking.entity';
import { Payment } from '../common/entities/payment.entity';
import { Evaluation } from '../common/entities/evaluation.entity';
import { Availability } from '../common/entities/availability.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [
          User,
          UserProfile,
          UserSession,
          UserNotification,
          Booking,
          Payment,
          Evaluation,
          Availability,
        ],
        migrations: [__dirname + '/../migrations/*{.ts,.js}'],
        synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
        logging: configService.get('DB_LOGGING') === 'true',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
