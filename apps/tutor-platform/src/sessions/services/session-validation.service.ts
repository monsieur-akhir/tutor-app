import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../common/entities/session.entity';
import { Booking } from '../../common/entities/booking.entity';
import { User } from '../../common/entities/user.entity';
import { CreateSessionDto } from '../dto/session.dto';
import { ISessionValidationService } from '../interfaces/session.interface';
import { UserRole } from '../../common/enums/user.enum';

@Injectable()
export class SessionValidationService implements ISessionValidationService {
  private readonly logger = new Logger(SessionValidationService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async validateSessionCreation(createSessionDto: CreateSessionDto, userId: string): Promise<boolean> {
    this.logger.log(`🔍 [VALIDATION] Validation de la création de session pour l'utilisateur ${userId}`);

    try {
      // Vérification que l'utilisateur existe
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`❌ [VALIDATION] Utilisateur ${userId} non trouvé`);
        return false;
      }

      // Vérification que la réservation existe
      const booking = await this.bookingRepository.findOne({
        where: { id: createSessionDto.bookingId },
        relations: ['provider', 'student'],
      });

      if (!booking) {
        this.logger.warn(`❌ [VALIDATION] Réservation ${createSessionDto.bookingId} non trouvée`);
        return false;
      }

      // Vérification des permissions
      const canCreate = await this.checkCreationPermissions(userId, booking, user.role);
      if (!canCreate) {
        this.logger.warn(`❌ [VALIDATION] Permissions insuffisantes pour l'utilisateur ${userId}`);
        return false;
      }

      // Validation des dates
      const startTime = new Date(createSessionDto.startTime);
      const endTime = new Date(createSessionDto.endTime);
      const now = new Date();

      if (startTime <= now) {
        this.logger.warn(`❌ [VALIDATION] La date de début doit être dans le futur`);
        return false;
      }

      if (endTime <= startTime) {
        this.logger.warn(`❌ [VALIDATION] La date de fin doit être après la date de début`);
        return false;
      }

      // Validation de la durée
      const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      if (durationInMinutes < 15) {
        this.logger.warn(`❌ [VALIDATION] La durée minimale est de 15 minutes`);
        return false;
      }

      if (durationInMinutes > 480) { // 8 heures max
        this.logger.warn(`❌ [VALIDATION] La durée maximale est de 8 heures`);
        return false;
      }

      this.logger.log(`✅ [VALIDATION] Validation de création réussie pour l'utilisateur ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ [VALIDATION] Erreur lors de la validation: ${error.message}`);
      return false;
    }
  }

  async validateSessionAccess(sessionId: string, userId: string): Promise<boolean> {
    this.logger.log(`🔍 [VALIDATION] Validation de l'accès à la session ${sessionId} pour l'utilisateur ${userId}`);

    try {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
        relations: ['provider', 'student'],
      });

      if (!session) {
        this.logger.warn(`❌ [VALIDATION] Session ${sessionId} non trouvée`);
        return false;
      }

      // L'utilisateur peut accéder s'il est le fournisseur ou l'étudiant
      const canAccess = session.providerId === userId || session.studentId === userId;
      
      if (!canAccess) {
        this.logger.warn(`❌ [VALIDATION] L'utilisateur ${userId} n'a pas accès à la session ${sessionId}`);
        return false;
      }

      this.logger.log(`✅ [VALIDATION] Accès validé pour l'utilisateur ${userId} à la session ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ [VALIDATION] Erreur lors de la validation d'accès: ${error.message}`);
      return false;
    }
  }

  async validateSessionModification(sessionId: string, userId: string): Promise<boolean> {
    this.logger.log(`🔍 [VALIDATION] Validation de la modification de la session ${sessionId} par l'utilisateur ${userId}`);

    try {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
        relations: ['provider', 'student'],
      });

      if (!session) {
        this.logger.warn(`❌ [VALIDATION] Session ${sessionId} non trouvée`);
        return false;
      }

      // Vérification des permissions de modification
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`❌ [VALIDATION] Utilisateur ${userId} non trouvé`);
        return false;
      }

      // Les admins peuvent tout modifier
      if (user.role === UserRole.ADMIN) {
        this.logger.log(`✅ [VALIDATION] Admin ${userId} peut modifier la session ${sessionId}`);
        return true;
      }

      // Le fournisseur peut modifier sa session
      if (session.providerId === userId) {
        this.logger.log(`✅ [VALIDATION] Fournisseur ${userId} peut modifier sa session ${sessionId}`);
        return true;
      }

      // L'étudiant peut modifier certaines propriétés de sa session
      if (session.studentId === userId) {
        // L'étudiant peut modifier certaines propriétés mais pas tout
        this.logger.log(`✅ [VALIDATION] Étudiant ${userId} peut modifier sa session ${sessionId} (limité)`);
        return true;
      }

      this.logger.warn(`❌ [VALIDATION] L'utilisateur ${userId} n'a pas les permissions pour modifier la session ${sessionId}`);
      return false;
    } catch (error) {
      this.logger.error(`❌ [VALIDATION] Erreur lors de la validation de modification: ${error.message}`);
      return false;
    }
  }

  async checkTimeConflicts(
    providerId: string,
    startTime: Date,
    endTime: Date,
    excludeSessionId?: string,
  ): Promise<boolean> {
    this.logger.log(`🔍 [VALIDATION] Vérification des conflits de temps pour le fournisseur ${providerId}`);

    try {
      const queryBuilder = this.sessionRepository
        .createQueryBuilder('session')
        .where('session.providerId = :providerId', { providerId })
        .andWhere('session.status IN (:...statuses)', {
          statuses: ['scheduled', 'starting', 'active'],
        })
        .andWhere(
          '(session.startTime < :endTime AND session.endTime > :startTime)',
          { startTime, endTime }
        );

      if (excludeSessionId) {
        queryBuilder.andWhere('session.id != :excludeSessionId', { excludeSessionId });
      }

      const conflictingSessions = await queryBuilder.getMany();

      if (conflictingSessions.length > 0) {
        this.logger.warn(`❌ [VALIDATION] Conflit de temps détecté: ${conflictingSessions.length} sessions en conflit`);
        return true;
      }

      this.logger.log(`✅ [VALIDATION] Aucun conflit de temps détecté pour le fournisseur ${providerId}`);
      return false;
    } catch (error) {
      this.logger.error(`❌ [VALIDATION] Erreur lors de la vérification des conflits: ${error.message}`);
      return true; // En cas d'erreur, on considère qu'il y a un conflit par sécurité
    }
  }

  private async checkCreationPermissions(
    userId: string,
    booking: Booking,
    userRole: UserRole,
  ): Promise<boolean> {
    // Les admins peuvent créer n'importe quelle session
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Les fournisseurs peuvent créer des sessions pour leurs réservations
    if (booking.providerId === userId) {
      return true;
    }

    // Les étudiants peuvent créer des sessions pour leurs réservations (avec restrictions)
    if (booking.studentId === userId) {
      // L'étudiant peut créer une session mais avec des limitations
      return true;
    }

    return false;
  }
}
