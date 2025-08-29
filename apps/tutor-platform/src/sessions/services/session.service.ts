import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Session, SessionStatus, SessionType } from '../../common/entities/session.entity';
import { Booking } from '../../common/entities/booking.entity';
import { User } from '../../common/entities/user.entity';
import { CreateSessionDto, UpdateSessionDto, SessionQueryDto } from '../dto/session.dto';
import { ISessionService } from '../interfaces/session.interface';
import { SessionValidationService } from './session-validation.service';
import { SessionNotificationService } from './session-notification.service';
import { SessionAnalyticsService } from './session-analytics.service';

@Injectable()
export class SessionService implements ISessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly validationService: SessionValidationService,
    private readonly notificationService: SessionNotificationService,
    private readonly analyticsService: SessionAnalyticsService,
  ) {}

  async createSession(createSessionDto: CreateSessionDto, userId: string): Promise<Session> {
    this.logger.log(`🔵 [CREATE_SESSION] Création d'une nouvelle session pour l'utilisateur ${userId}`);

    // Validation des données
    const isValid = await this.validationService.validateSessionCreation(createSessionDto, userId);
    if (!isValid) {
      throw new BadRequestException('Validation de la création de session échouée');
    }

    // Récupération de la réservation
    const booking = await this.bookingRepository.findOne({
      where: { id: createSessionDto.bookingId },
      relations: ['provider', 'student'],
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }

    // Vérification des conflits de temps
    const hasConflicts = await this.validationService.checkTimeConflicts(
      booking.providerId,
      new Date(createSessionDto.startTime),
      new Date(createSessionDto.endTime),
    );

    if (hasConflicts) {
      throw new BadRequestException('Conflit de temps détecté pour cette session');
    }

    // Création de la session
    const session = this.sessionRepository.create({
      ...createSessionDto,
      providerId: booking.providerId,
      studentId: booking.studentId,
      startTime: new Date(createSessionDto.startTime),
      endTime: new Date(createSessionDto.endTime),
      status: SessionStatus.SCHEDULED,
      maxParticipants: createSessionDto.maxParticipants || 1,
      timezone: createSessionDto.timezone || 'UTC',
    });

    const savedSession = await this.sessionRepository.save(session);
    this.logger.log(`✅ [CREATE_SESSION] Session créée avec succès: ${savedSession.id}`);

    // Notification
    await this.notificationService.notifySessionCreated(savedSession);

    return savedSession;
  }

  async getSessionById(id: string): Promise<Session> {
    this.logger.log(`🔍 [GET_SESSION] Récupération de la session ${id}`);

    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['booking', 'provider', 'student', 'recordings', 'feedbacks'],
    });

    if (!session) {
      throw new NotFoundException('Session non trouvée');
    }

    return session;
  }

  async getSessions(query: SessionQueryDto): Promise<{ sessions: Session[]; total: number }> {
    this.logger.log(`🔍 [GET_SESSIONS] Récupération des sessions avec filtres: ${JSON.stringify(query)}`);

    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.booking', 'booking')
      .leftJoinAndSelect('session.provider', 'provider')
      .leftJoinAndSelect('session.student', 'student');

    // Application des filtres
    if (query.status) {
      queryBuilder.andWhere('session.status = :status', { status: query.status });
    }

    if (query.type) {
      queryBuilder.andWhere('session.type = :type', { type: query.type });
    }

    if (query.providerId) {
      queryBuilder.andWhere('session.providerId = :providerId', { providerId: query.providerId });
    }

    if (query.studentId) {
      queryBuilder.andWhere('session.studentId = :studentId', { studentId: query.studentId });
    }

    if (query.startDate) {
      queryBuilder.andWhere('session.startTime >= :startDate', { startDate: new Date(query.startDate) });
    }

    if (query.endDate) {
      queryBuilder.andWhere('session.endTime <= :endDate', { endDate: new Date(query.endDate) });
    }

    // Comptage total
    const total = await queryBuilder.getCount();

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder
      .orderBy('session.startTime', 'DESC')
      .skip(offset)
      .take(limit);

    const sessions = await queryBuilder.getMany();

    this.logger.log(`✅ [GET_SESSIONS] ${sessions.length} sessions récupérées sur ${total} total`);

    return { sessions, total };
  }

  async updateSession(id: string, updateSessionDto: UpdateSessionDto, userId: string): Promise<Session> {
    this.logger.log(`🔄 [UPDATE_SESSION] Mise à jour de la session ${id} par l'utilisateur ${userId}`);

    const session = await this.getSessionById(id);

    // Validation des permissions
    const canModify = await this.validationService.validateSessionModification(id, userId);
    if (!canModify) {
      throw new ForbiddenException('Vous n\'avez pas les permissions pour modifier cette session');
    }

    // Vérification des conflits de temps si les horaires changent
    if (updateSessionDto.startTime || updateSessionDto.endTime) {
      const startTime = updateSessionDto.startTime ? new Date(updateSessionDto.startTime) : session.startTime;
      const endTime = updateSessionDto.endTime ? new Date(updateSessionDto.endTime) : session.endTime;

      const hasConflicts = await this.validationService.checkTimeConflicts(
        session.providerId,
        startTime,
        endTime,
        id,
      );

      if (hasConflicts) {
        throw new BadRequestException('Conflit de temps détecté pour cette session');
      }
    }

    // Mise à jour
    const updatedSession = await this.sessionRepository.save({
      ...session,
      ...updateSessionDto,
      startTime: updateSessionDto.startTime ? new Date(updateSessionDto.startTime) : session.startTime,
      endTime: updateSessionDto.endTime ? new Date(updateSessionDto.endTime) : session.endTime,
    });

    this.logger.log(`✅ [UPDATE_SESSION] Session ${id} mise à jour avec succès`);

    // Notification
    const changes: Partial<Session> = {
      ...updateSessionDto,
      startTime: updateSessionDto.startTime ? new Date(updateSessionDto.startTime) : undefined,
      endTime: updateSessionDto.endTime ? new Date(updateSessionDto.endTime) : undefined,
    };
    await this.notificationService.notifySessionUpdated(updatedSession, changes);

    return updatedSession;
  }

  async deleteSession(id: string, userId: string): Promise<void> {
    this.logger.log(`🗑️ [DELETE_SESSION] Suppression de la session ${id} par l'utilisateur ${userId}`);

    const session = await this.getSessionById(id);

    // Validation des permissions
    const canModify = await this.validationService.validateSessionModification(id, userId);
    if (!canModify) {
      throw new ForbiddenException('Vous n\'avez pas les permissions pour supprimer cette session');
    }

    // Vérification que la session n'est pas déjà commencée
    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException('Impossible de supprimer une session déjà commencée');
    }

    await this.sessionRepository.remove(session);
    this.logger.log(`✅ [DELETE_SESSION] Session ${id} supprimée avec succès`);
  }

  async startSession(id: string, userId: string): Promise<Session> {
    this.logger.log(`▶️ [START_SESSION] Démarrage de la session ${id} par l'utilisateur ${userId}`);

    const session = await this.getSessionById(id);

    // Validation des permissions
    const canAccess = await this.validationService.validateSessionAccess(id, userId);
    if (!canAccess) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette session');
    }

    // Vérification du statut
    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException('La session ne peut pas être démarrée dans son état actuel');
    }

    // Vérification de l'heure
    const now = new Date();
    const startTime = new Date(session.startTime);
    const timeDiff = Math.abs(now.getTime() - startTime.getTime()) / (1000 * 60); // Différence en minutes

    if (timeDiff > 15) {
      throw new BadRequestException('La session ne peut être démarrée que 15 minutes avant ou après l\'heure prévue');
    }

    // Mise à jour du statut
    session.status = SessionStatus.ACTIVE;
    session.actualStartTime = now;

    const updatedSession = await this.sessionRepository.save(session);
    this.logger.log(`✅ [START_SESSION] Session ${id} démarrée avec succès`);

    // Notification
    await this.notificationService.notifySessionStarting(updatedSession);

    return updatedSession;
  }

  async endSession(id: string, userId: string): Promise<Session> {
    this.logger.log(`⏹️ [END_SESSION] Fin de la session ${id} par l'utilisateur ${userId}`);

    const session = await this.getSessionById(id);

    // Validation des permissions
    const canAccess = await this.validationService.validateSessionAccess(id, userId);
    if (!canAccess) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette session');
    }

    // Vérification du statut
    if (session.status !== SessionStatus.ACTIVE && session.status !== SessionStatus.PAUSED) {
      throw new BadRequestException('La session doit être active ou en pause pour être terminée');
    }

    // Calcul de la durée réelle
    const now = new Date();
    const actualStartTime = session.actualStartTime || session.startTime;
    const actualDuration = Math.round((now.getTime() - actualStartTime.getTime()) / (1000 * 60));

    // Mise à jour du statut
    session.status = SessionStatus.ENDED;
    session.actualEndTime = now;
    session.actualDuration = actualDuration;

    const updatedSession = await this.sessionRepository.save(session);
    this.logger.log(`✅ [END_SESSION] Session ${id} terminée avec succès, durée réelle: ${actualDuration} minutes`);

    // Notification
    await this.notificationService.notifySessionEnded(updatedSession);

    return updatedSession;
  }

  async pauseSession(id: string, userId: string): Promise<Session> {
    this.logger.log(`⏸️ [PAUSE_SESSION] Mise en pause de la session ${id} par l'utilisateur ${userId}`);

    const session = await this.getSessionById(id);

    // Validation des permissions
    const canAccess = await this.validationService.validateSessionAccess(id, userId);
    if (!canAccess) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette session');
    }

    // Vérification du statut
    if (session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException('La session doit être active pour être mise en pause');
    }

    session.status = SessionStatus.PAUSED;
    const updatedSession = await this.sessionRepository.save(session);
    this.logger.log(`✅ [PAUSE_SESSION] Session ${id} mise en pause`);

    return updatedSession;
  }

  async resumeSession(id: string, userId: string): Promise<Session> {
    this.logger.log(`▶️ [RESUME_SESSION] Reprise de la session ${id} par l'utilisateur ${userId}`);

    const session = await this.getSessionById(id);

    // Validation des permissions
    const canAccess = await this.validationService.validateSessionAccess(id, userId);
    if (!canAccess) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette session');
    }

    // Vérification du statut
    if (session.status !== SessionStatus.PAUSED) {
      throw new BadRequestException('La session doit être en pause pour être reprise');
    }

    session.status = SessionStatus.ACTIVE;
    const updatedSession = await this.sessionRepository.save(session);
    this.logger.log(`✅ [RESUME_SESSION] Session ${id} reprise`);

    return updatedSession;
  }

  async cancelSession(id: string, userId: string, reason?: string): Promise<Session> {
    this.logger.log(`❌ [CANCEL_SESSION] Annulation de la session ${id} par l'utilisateur ${userId}`);

    const session = await this.getSessionById(id);

    // Validation des permissions
    const canModify = await this.validationService.validateSessionModification(id, userId);
    if (!canModify) {
      throw new ForbiddenException('Vous n\'avez pas les permissions pour annuler cette session');
    }

    // Vérification du statut
    if (session.status === SessionStatus.ENDED || session.status === SessionStatus.CANCELLED) {
      throw new BadRequestException('La session ne peut pas être annulée dans son état actuel');
    }

    session.status = SessionStatus.CANCELLED;
    session.cancellationReason = reason || 'Annulée par l\'utilisateur';
    session.cancelledBy = userId;
    session.cancelledAt = new Date();

    const updatedSession = await this.sessionRepository.save(session);
    this.logger.log(`✅ [CANCEL_SESSION] Session ${id} annulée avec succès`);

    // Notification
    await this.notificationService.notifySessionCancelled(updatedSession, reason || 'Annulée');

    return updatedSession;
  }

  async getSessionsByUser(userId: string, role: 'provider' | 'student'): Promise<Session[]> {
    this.logger.log(`🔍 [GET_SESSIONS_BY_USER] Récupération des sessions pour l'utilisateur ${userId} (rôle: ${role})`);

    const whereClause = role === 'provider' ? { providerId: userId } : { studentId: userId };

    const sessions = await this.sessionRepository.find({
      where: whereClause,
      relations: ['booking', 'provider', 'student'],
      order: { startTime: 'DESC' },
    });

    return sessions;
  }

  async getSessionsByBooking(bookingId: string): Promise<Session[]> {
    this.logger.log(`🔍 [GET_SESSIONS_BY_BOOKING] Récupération des sessions pour la réservation ${bookingId}`);

    const sessions = await this.sessionRepository.find({
      where: { bookingId },
      relations: ['provider', 'student'],
      order: { startTime: 'ASC' },
    });

    return sessions;
  }

  async getUpcomingSessions(userId: string, limit: number = 10): Promise<Session[]> {
    this.logger.log(`🔍 [GET_UPCOMING_SESSIONS] Récupération des prochaines sessions pour l'utilisateur ${userId}`);

    const now = new Date();

    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.booking', 'booking')
      .leftJoinAndSelect('session.provider', 'provider')
      .leftJoinAndSelect('session.student', 'student')
      .where('session.startTime > :now', { now })
      .andWhere('session.status = :status', { status: SessionStatus.SCHEDULED })
      .andWhere('(session.providerId = :userId OR session.studentId = :userId)', { userId })
      .orderBy('session.startTime', 'ASC')
      .limit(limit)
      .getMany();

    return sessions;
  }

  async getActiveSessions(): Promise<Session[]> {
    this.logger.log(`🔍 [GET_ACTIVE_SESSIONS] Récupération des sessions actives`);

    const sessions = await this.sessionRepository.find({
      where: { status: SessionStatus.ACTIVE },
      relations: ['booking', 'provider', 'student'],
      order: { startTime: 'ASC' },
    });

    return sessions;
  }
}
