import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../common/entities/booking.entity';
import { User } from '../common/entities/user.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async generateSessionToken(bookingId: string, userId: string): Promise<string> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['student', 'provider'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Vérifier que l'utilisateur est autorisé à rejoindre cette session
    if (booking.studentId !== userId && booking.providerId !== userId) {
      throw new NotFoundException('Not authorized to join this session');
    }

    // TODO: Intégrer avec LiveKit pour générer un vrai token
    const token = `session_${bookingId}_${userId}_${Date.now()}`;
    
    return token;
  }

  async createSession(bookingId: string): Promise<any> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['student', 'provider'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // TODO: Créer une session LiveKit
    const session = {
      id: `session_${bookingId}`,
      bookingId,
      roomName: `room_${bookingId}`,
      startTime: new Date(),
      status: 'active',
    };

    return session;
  }

  async joinSession(sessionId: string, userId: string): Promise<any> {
    // TODO: Vérifier les permissions et rejoindre la session LiveKit
    return {
      sessionId,
      userId,
      status: 'joined',
      timestamp: new Date(),
    };
  }

  async endSession(sessionId: string): Promise<void> {
    // TODO: Terminer la session LiveKit et mettre à jour le statut
    console.log(`Session ${sessionId} ended`);
  }
}
