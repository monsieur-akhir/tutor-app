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
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto, ProfileQueryDto } from './dto/profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../common/enums/user.enum';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user profile' })
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createProfile(
    @Request() req: any,
    @Body() createProfileDto: CreateProfileDto,
  ) {
    return this.profilesService.createProfile(req.user.id, createProfileDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(@Request() req: any) {
    return this.profilesService.getProfile(req.user.id);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(@Param('userId') userId: string) {
    return this.profilesService.getProfile(userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateMyProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(req.user.id, updateProfileDto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete current user profile' })
  @ApiResponse({ status: 204, description: 'Profile deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async deleteMyProfile(@Request() req: any) {
    return this.profilesService.deleteProfile(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Search profiles with filters' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  @ApiQuery({ name: 'skill', required: false })
  @ApiQuery({ name: 'language', required: false })
  @ApiQuery({ name: 'minRate', required: false, type: Number })
  @ApiQuery({ name: 'maxRate', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Profiles retrieved successfully' })
  async searchProfiles(@Query() queryDto: ProfileQueryDto) {
    return this.profilesService.searchProfiles(queryDto);
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Get profiles by role' })
  @ApiParam({ name: 'role', enum: UserRole })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Profiles retrieved successfully' })
  async getProfilesByRole(
    @Param('role') role: UserRole,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.profilesService.getProfilesByRole(role, page, limit);
  }

  @Get('top/:role')
  @ApiOperation({ summary: 'Get top profiles by role' })
  @ApiParam({ name: 'role', enum: UserRole })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Top profiles retrieved successfully' })
  async getTopProfiles(
    @Param('role') role: UserRole,
    @Query('limit') limit = 5,
  ) {
    return this.profilesService.getTopProfiles(role, limit);
  }

  @Post('rating/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile rating' })
  @ApiParam({ name: 'userId', description: 'User ID to rate' })
  @ApiResponse({ status: 200, description: 'Rating updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateRating(
    @Param('userId') userId: string,
    @Body() body: { rating: number },
  ) {
    return this.profilesService.updateRating(userId, body.rating);
  }
}
