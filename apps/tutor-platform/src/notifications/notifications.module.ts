import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { User } from '../common/entities/user.entity';
import { UserNotification } from '../common/entities/user-notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserNotification, User]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
