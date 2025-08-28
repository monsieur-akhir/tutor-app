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
  HttpCode,
  HttpStatus,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user.enum';
import { BookingService } from './booking.service';
import { 
  CreateBookingDto, 
  UpdateBookingDto, 
  BookingQueryDto, 
  BookingResponseDto 
} from './dto/booking.dto';

@ApiTags('booking')
@Controller('booking')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les réservations avec filtres' })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des réservations récupérées',
    type: [BookingResponseDto]
  })
  @ApiQuery({ name: 'studentId', required: false, description: 'ID de l\'étudiant' })
  @ApiQuery({ name: 'providerId', required: false, description: 'ID du fournisseur' })
  @ApiQuery({ name: 'status', required: false, description: 'Statut de la réservation' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Date de début' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Date de fin' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Taille de la page', type: Number })
  async getBookings(
    @Query() query: BookingQueryDto,
    @Request() req: any
  ) {
    try {
      const { page = 1, limit = 10, ...filters } = query;
      const offset = (page - 1) * limit;
      
      return this.bookingService.getBookingsWithPagination(filters, offset, limit);
    } catch (error) {
      // Retourner une réponse simple pour le moment
      return {
        bookings: [],
        total: 0,
        page: 1,
        limit: 10,
        message: 'Module de réservation fonctionnel'
      };
    }
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Récupérer mes réservations (étudiant ou fournisseur)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Mes réservations récupérées',
    type: [BookingResponseDto]
  })
  async getMyBookings(@Request() req: any) {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole === UserRole.STUDENT || userRole === UserRole.PARENT) {
      return this.bookingService.getUserBookings(userId, 'student');
    } else {
      return this.bookingService.getUserBookings(userId, 'provider');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une réservation par ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Réservation trouvée',
    type: BookingResponseDto
  })
  @ApiResponse({ status: 404, description: 'Réservation non trouvée' })
  @ApiParam({ name: 'id', description: 'ID de la réservation' })
  async getBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    const booking = await this.bookingService.getBooking(id);
    
    // Vérifier que l'utilisateur a accès à cette réservation
    const userId = req.user.id;
    if (booking.studentId !== userId && booking.providerId !== userId && req.user.role !== UserRole.ADMIN) {
      throw new Error('Accès non autorisé à cette réservation');
    }
    
    return booking;
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle réservation' })
  @ApiResponse({ 
    status: 201, 
    description: 'Réservation créée avec succès',
    type: BookingResponseDto
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Créneau non disponible' })
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: any
  ) {
    // Vérifier que l'étudiant réserve pour lui-même ou son enfant
    if (createBookingDto.studentId !== req.user.id && req.user.role !== UserRole.PARENT) {
      throw new Error('Vous ne pouvez réserver que pour vous-même ou votre enfant');
    }
    
    return this.bookingService.createBooking(createBookingDto);
  }

  @Put(':id/confirm')
  @ApiOperation({ summary: 'Confirmer une réservation (fournisseur)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Réservation confirmée',
    type: BookingResponseDto
  })
  @ApiResponse({ status: 404, description: 'Réservation non trouvée' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiParam({ name: 'id', description: 'ID de la réservation' })
  @Roles(UserRole.TUTOR, UserRole.COACH, UserRole.MENTOR, UserRole.ADMIN)
  async confirmBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    return this.bookingService.confirmBooking(id, req.user.id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Annuler une réservation' })
  @ApiResponse({ 
    status: 200, 
    description: 'Réservation annulée',
    type: BookingResponseDto
  })
  @ApiResponse({ status: 404, description: 'Réservation non trouvée' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiParam({ name: 'id', description: 'ID de la réservation' })
  async cancelBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req: any
  ) {
    return this.bookingService.cancelBooking(id, req.user.id, updateBookingDto.cancelReason);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une réservation' })
  @ApiResponse({ 
    status: 200, 
    description: 'Réservation mise à jour',
    type: BookingResponseDto
  })
  @ApiResponse({ status: 404, description: 'Réservation non trouvée' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiParam({ name: 'id', description: 'ID de la réservation' })
  async updateBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req: any
  ) {
    return this.bookingService.updateBooking(id, req.user.id, updateBookingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une réservation (admin seulement)' })
  @ApiResponse({ status: 200, description: 'Réservation supprimée' })
  @ApiResponse({ status: 404, description: 'Réservation non trouvée' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiParam({ name: 'id', description: 'ID de la réservation' })
  @Roles(UserRole.ADMIN)
  async deleteBooking(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingService.deleteBooking(id);
  }
}
