import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from '../common/entities/booking.entity';
import { Payment } from '../common/entities/payment.entity';
import { User } from '../common/entities/user.entity';
import { UserProfile } from '../common/entities/user-profile.entity';
import { Availability } from '../common/entities/availability.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Payment, User, UserProfile, Availability]),
    CommonModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
