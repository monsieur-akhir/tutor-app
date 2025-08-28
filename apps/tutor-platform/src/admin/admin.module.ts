import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../common/entities/user.entity';
import { Booking } from '../common/entities/booking.entity';
import { Payment } from '../common/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Booking, Payment]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
