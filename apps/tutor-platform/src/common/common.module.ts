import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { UserNotification } from './entities/user-notification.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Evaluation } from './entities/evaluation.entity';
import { Availability, AvailabilitySchedule } from './entities/availability.entity';
import { RedisService } from './services/redis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      UserSession,
      UserNotification,
      Booking,
      Payment,
      Evaluation,
      Availability,
      AvailabilitySchedule,
    ]),
  ],
  providers: [RedisService],
  exports: [
    TypeOrmModule,
    RedisService,
  ],
})
export class CommonModule {}
