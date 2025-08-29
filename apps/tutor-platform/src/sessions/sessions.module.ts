import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionService } from './services/session.service';
import { SessionValidationService } from './services/session-validation.service';
import { SessionTokenService } from './services/session-token.service';
import { SessionRecordingService } from './services/session-recording.service';
import { SessionFeedbackService } from './services/session-feedback.service';
import { SessionNotificationService } from './services/session-notification.service';
import { SessionAnalyticsService } from './services/session-analytics.service';
import { Session } from '../common/entities/session.entity';
import { SessionRecording } from '../common/entities/session-recording.entity';
import { SessionFeedback } from '../common/entities/session-feedback.entity';
import { Booking } from '../common/entities/booking.entity';
import { User } from '../common/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      SessionRecording,
      SessionFeedback,
      Booking,
      User,
    ]),
    NotificationsModule,
  ],
  controllers: [SessionsController],
  providers: [
    SessionService,
    SessionValidationService,
    SessionTokenService,
    SessionRecordingService,
    SessionFeedbackService,
    SessionNotificationService,
    SessionAnalyticsService,
  ],
  exports: [
    SessionService,
    SessionValidationService,
    SessionTokenService,
    SessionRecordingService,
    SessionFeedbackService,
    SessionNotificationService,
    SessionAnalyticsService,
  ],
})
export class SessionsModule {}
