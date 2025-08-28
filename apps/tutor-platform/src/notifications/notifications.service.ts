import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNotification } from '../common/entities/user-notification.entity';
import { User } from '../common/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(UserNotification)
    private notificationRepository: Repository<UserNotification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async sendNotification(userId: string, type: string, title: string, message: string, data?: any): Promise<UserNotification> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      metadata: data,
      isRead: false,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // TODO: Envoyer la notification via différents canaux (email, SMS, push)
    await this.sendViaChannels(user, type, title, message, data);

    return savedNotification;
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<UserNotification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (notification) {
      notification.isRead = true;
      await this.notificationRepository.save(notification);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({
      id: notificationId,
      userId,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  private async sendViaChannels(user: User, type: string, title: string, message: string, data?: any): Promise<void> {
    // TODO: Implémenter l'envoi via différents canaux
    
    // Email
    if (user.email) {
      await this.sendEmail(user.email, title, message);
    }

    // SMS
    if (user.phone) {
      await this.sendSMS(user.phone, message);
    }

    // Push notifications - temporairement désactivé
    // if (user.pushToken) {
    //   await this.sendPushNotification(user.pushToken, title, message, data);
    // }
  }

  private async sendEmail(email: string, subject: string, message: string): Promise<void> {
    // TODO: Intégrer avec Nodemailer
    console.log(`Sending email to ${email}: ${subject} - ${message}`);
  }

  private async sendSMS(phone: string, message: string): Promise<void> {
    // TODO: Intégrer avec Twilio
    console.log(`Sending SMS to ${phone}: ${message}`);
  }

  private async sendPushNotification(token: string, title: string, message: string, data?: any): Promise<void> {
    // TODO: Intégrer avec Firebase
    console.log(`Sending push notification to ${token}: ${title} - ${message}`);
  }

  // Méthodes pour les notifications système
  async sendBookingConfirmation(bookingId: string, userId: string): Promise<void> {
    await this.sendNotification(
      userId,
      'booking_confirmation',
      'Réservation confirmée',
      'Votre réservation a été confirmée avec succès.',
      { bookingId }
    );
  }

  async sendBookingReminder(bookingId: string, userId: string, startTime: Date): Promise<void> {
    await this.sendNotification(
      userId,
      'booking_reminder',
      'Rappel de réservation',
      `Votre session commence dans 1 heure (${startTime.toLocaleString()})`,
      { bookingId, startTime }
    );
  }

  async sendPaymentSuccess(bookingId: string, userId: string, amount: number): Promise<void> {
    await this.sendNotification(
      userId,
      'payment_success',
      'Paiement réussi',
      `Paiement de ${amount} USD traité avec succès.`,
      { bookingId, amount }
    );
  }
}
