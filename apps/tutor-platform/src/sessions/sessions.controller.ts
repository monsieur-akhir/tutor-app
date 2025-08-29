import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user.enum';
import { SessionService } from './services/session.service';
import { SessionTokenService } from './services/session-token.service';
import { SessionRecordingService } from './services/session-recording.service';
import { SessionFeedbackService } from './services/session-feedback.service';
import {
  CreateSessionDto,
  UpdateSessionDto,
  SessionQueryDto,
  SessionResponseDto,
  SessionListResponseDto,
} from './dto/session.dto';
import { Session, SessionStatus } from '../common/entities/session.entity';

@ApiTags('Sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly tokenService: SessionTokenService,
    private readonly recordingService: SessionRecordingService,
    private readonly feedbackService: SessionFeedbackService,
  ) {}

  @Post()
  @Roles(UserRole.TUTOR, UserRole.COACH, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Créer une nouvelle session',
    description: 'Crée une nouvelle session de tutorat, coaching ou mentoring',
  })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({
    status: 201,
    description: 'Session créée avec succès',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
    @Request() req: any,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionService.createSession(createSessionDto, req.user.id);
    return this.mapToResponseDto(session);
  }

  @Get()
  @ApiOperation({
    summary: 'Récupérer la liste des sessions',
    description: 'Récupère une liste paginée des sessions avec filtres optionnels',
  })
  @ApiQuery({ name: 'status', enum: SessionStatus, required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'providerId', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Liste des sessions récupérée avec succès',
    type: SessionListResponseDto,
  })
  async getSessions(@Query() query: SessionQueryDto): Promise<SessionListResponseDto> {
    const { sessions, total } = await this.sessionService.getSessions(query);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      sessions: sessions.map(session => this.mapToResponseDto(session)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  @Get('my-sessions')
  @ApiOperation({
    summary: 'Récupérer mes sessions',
    description: 'Récupère les sessions de l\'utilisateur connecté',
  })
  @ApiQuery({ name: 'role', enum: ['provider', 'student'], required: false })
  @ApiResponse({
    status: 200,
    description: 'Sessions récupérées avec succès',
    type: [SessionResponseDto],
  })
  async getMySessions(
    @Query('role') role: 'provider' | 'student' = 'provider',
    @Request() req: any,
  ): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionService.getSessionsByUser(req.user.id, role);
    return sessions.map(session => this.mapToResponseDto(session));
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Récupérer mes prochaines sessions',
    description: 'Récupère les prochaines sessions de l\'utilisateur connecté',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Prochaines sessions récupérées avec succès',
    type: [SessionResponseDto],
  })
  async getUpcomingSessions(
    @Query('limit') limit: number = 10,
    @Request() req: any,
  ): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionService.getUpcomingSessions(req.user.id, limit);
    return sessions.map(session => this.mapToResponseDto(session));
  }

  @Get('active')
  @ApiOperation({
    summary: 'Récupérer les sessions actives',
    description: 'Récupère toutes les sessions actuellement actives',
  })
  @ApiResponse({
    status: 200,
    description: 'Sessions actives récupérées avec succès',
    type: [SessionResponseDto],
  })
  async getActiveSessions(): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionService.getActiveSessions();
    return sessions.map(session => this.mapToResponseDto(session));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une session par ID',
    description: 'Récupère les détails d\'une session spécifique',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({
    status: 200,
    description: 'Session récupérée avec succès',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async getSessionById(@Param('id') id: string): Promise<SessionResponseDto> {
    const session = await this.sessionService.getSessionById(id);
    return this.mapToResponseDto(session);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Mettre à jour une session',
    description: 'Met à jour les informations d\'une session existante',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiBody({ type: UpdateSessionDto })
  @ApiResponse({
    status: 200,
    description: 'Session mise à jour avec succès',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async updateSession(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Request() req: any,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionService.updateSession(id, updateSessionDto, req.user.id);
    return this.mapToResponseDto(session);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une session',
    description: 'Supprime une session existante',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 204, description: 'Session supprimée avec succès' })
  @ApiResponse({ status: 400, description: 'Impossible de supprimer la session' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async deleteSession(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    await this.sessionService.deleteSession(id, req.user.id);
  }

  @Put(':id/start')
  @ApiOperation({
    summary: 'Démarrer une session',
    description: 'Démarre une session planifiée',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({
    status: 200,
    description: 'Session démarrée avec succès',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Impossible de démarrer la session' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async startSession(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionService.startSession(id, req.user.id);
    return this.mapToResponseDto(session);
  }

  @Put(':id/end')
  @ApiOperation({
    summary: 'Terminer une session',
    description: 'Termine une session active',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({
    status: 200,
    description: 'Session terminée avec succès',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Impossible de terminer la session' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async endSession(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionService.endSession(id, req.user.id);
    return this.mapToResponseDto(session);
  }

  @Put(':id/pause')
  @ApiOperation({
    summary: 'Mettre en pause une session',
    description: 'Met en pause une session active',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({
    status: 200,
    description: 'Session mise en pause avec succès',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Impossible de mettre en pause' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async pauseSession(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionService.pauseSession(id, req.user.id);
    return this.mapToResponseDto(session);
  }

  @Put(':id/resume')
  @ApiOperation({
    summary: 'Reprendre une session',
    description: 'Reprend une session en pause',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({
    status: 200,
    description: 'Session reprise avec succès',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Impossible de reprendre la session' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async resumeSession(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionService.resumeSession(id, req.user.id);
    return this.mapToResponseDto(session);
  }

  @Put(':id/cancel')
  @ApiOperation({
    summary: 'Annuler une session',
    description: 'Annule une session planifiée',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Raison de l\'annulation',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Session annulée avec succès',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Impossible d\'annuler la session' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async cancelSession(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionService.cancelSession(id, req.user.id, reason);
    return this.mapToResponseDto(session);
  }

  @Get(':id/token')
  @ApiOperation({
    summary: 'Générer un token de session',
    description: 'Génère un token d\'accès pour rejoindre une session',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({
    status: 200,
    description: 'Token généré avec succès',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        roomName: { type: 'string' },
        roomUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async generateSessionToken(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ token: string; roomName: string; roomUrl: string }> {
    const session = await this.sessionService.getSessionById(id);
    
    // Déterminer le rôle de l'utilisateur dans cette session
    const role = session.providerId === req.user.id ? 'provider' : 'student';
    
    const token = await this.tokenService.generateSessionToken(id, req.user.id, role);
    
    return {
      token,
      roomName: session.roomName || `Session-${id}`,
      roomUrl: session.roomUrl || '',
    };
  }

  @Post(':id/recordings/start')
  @ApiOperation({
    summary: 'Démarrer l\'enregistrement',
    description: 'Démarre l\'enregistrement d\'une session',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Enregistrement démarré avec succès' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async startRecording(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.recordingService.startRecording(id, req.user.id);
    return { message: 'Enregistrement démarré avec succès' };
  }

  @Post(':id/recordings/stop')
  @ApiOperation({
    summary: 'Arrêter l\'enregistrement',
    description: 'Arrête l\'enregistrement d\'une session',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Enregistrement arrêté avec succès' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async stopRecording(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.recordingService.stopRecording(id, req.user.id);
    return { message: 'Enregistrement arrêté avec succès' };
  }

  @Get(':id/recordings')
  @ApiOperation({
    summary: 'Récupérer les enregistrements',
    description: 'Récupère la liste des enregistrements d\'une session',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({
    status: 200,
    description: 'Enregistrements récupérés avec succès',
    type: 'array',
  })
  async getRecordings(@Param('id') id: string): Promise<any[]> {
    return await this.recordingService.getRecordings(id);
  }

  @Get(':id/feedback')
  @ApiOperation({
    summary: 'Récupérer les retours',
    description: 'Récupère la liste des retours d\'une session',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({
    status: 200,
    description: 'Retours récupérés avec succès',
    type: 'array',
  })
  async getSessionFeedback(@Param('id') id: string): Promise<any[]> {
    return await this.feedbackService.getSessionFeedback(id);
  }

  private mapToResponseDto(session: Session): SessionResponseDto {
    return {
      id: session.id,
      bookingId: session.bookingId,
      providerId: session.providerId,
      studentId: session.studentId,
      status: session.status,
      type: session.type,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      roomName: session.roomName || undefined,
      roomUrl: session.roomUrl || undefined,
      description: session.description || undefined,
      metadata: session.metadata || undefined,
      notes: session.notes || undefined,
      isRecorded: session.isRecorded,
      isPrivate: session.isPrivate,
      maxParticipants: session.maxParticipants,
      timezone: session.timezone || undefined,
      actualStartTime: session.actualStartTime || undefined,
      actualEndTime: session.actualEndTime || undefined,
      actualDuration: session.actualDuration,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
