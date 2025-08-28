import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';
import { UserProfile } from '../common/entities/user-profile.entity';
import { CreateProfileDto, UpdateProfileDto, ProfileQueryDto } from './dto/profile.dto';
import { UserRole, UserStatus } from '../common/enums/user.enum';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  async createProfile(userId: string, createProfileDto: CreateProfileDto): Promise<UserProfile> {
    // Check if user exists and is active
    const user = await this.userRepository.findOne({ 
      where: { id: userId, status: UserStatus.ACTIVE } 
    });
    
    if (!user) {
      throw new NotFoundException('User not found or inactive');
    }

    // Check if profile already exists
    const existingProfile = await this.profileRepository.findOne({ where: { id: userId } });
    if (existingProfile) {
      throw new BadRequestException('Profile already exists for this user');
    }

    // Create profile
    const profile = this.profileRepository.create({
      id: userId, // Use userId as profile id (OneToOne relationship)
      ...createProfileDto,
      currency: createProfileDto.currency || 'EUR',
    });

    return await this.profileRepository.save(profile);
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const profile = await this.profileRepository.findOne({ 
      where: { id: userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserProfile> {
    const profile = await this.profileRepository.findOne({ where: { id: userId } });
    
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Update profile
    Object.assign(profile, updateProfileDto);
    return await this.profileRepository.save(profile);
  }

  async deleteProfile(userId: string): Promise<void> {
    const profile = await this.profileRepository.findOne({ where: { id: userId } });
    
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    await this.profileRepository.remove(profile);
  }

  async searchProfiles(queryDto: ProfileQueryDto): Promise<{
    profiles: UserProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, role, skill, language, minRate, maxRate } = queryDto;
    const skip = (page - 1) * limit;

    // Build query
    let query = this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('user.status = :status', { status: UserStatus.ACTIVE });

    // Apply filters
    if (role) {
      query = query.andWhere('user.role = :role', { role });
    }

    if (skill) {
      query = query.andWhere(':skill = ANY(profile.skills)', { skill });
    }

    if (language) {
      query = query.andWhere(':language = ANY(profile.languages)', { language });
    }

    if (minRate !== undefined) {
      query = query.andWhere('profile.hourlyRate >= :minRate', { minRate });
    }

    if (maxRate !== undefined) {
      query = query.andWhere('profile.hourlyRate <= :maxRate', { maxRate });
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const profiles = await query
      .orderBy('profile.rating', 'DESC')
      .addOrderBy('profile.totalSessions', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      profiles,
      total,
      page,
      limit,
    };
  }

  async getProfilesByRole(role: UserRole, page = 1, limit = 10): Promise<{
    profiles: UserProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const query = this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('user.role = :role', { role })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE });

    const total = await query.getCount();

    const profiles = await query
      .orderBy('profile.rating', 'DESC')
      .addOrderBy('profile.totalSessions', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      profiles,
      total,
      page,
      limit,
    };
  }

  async updateRating(userId: string, newRating: number): Promise<void> {
    const profile = await this.profileRepository.findOne({ where: { id: userId } });
    
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Calculate new average rating
    const currentRating = profile.rating || 0;
    const totalSessions = profile.totalSessions || 0;
    
    if (totalSessions === 0) {
      profile.rating = newRating;
    } else {
      const totalRating = (currentRating * totalSessions) + newRating;
      profile.rating = totalRating / (totalSessions + 1);
    }

    profile.totalSessions += 1;
    await this.profileRepository.save(profile);
  }

  async getTopProfiles(role: UserRole, limit = 5): Promise<UserProfile[]> {
    return await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('user.role = :role', { role })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere('profile.rating IS NOT NULL')
      .orderBy('profile.rating', 'DESC')
      .addOrderBy('profile.totalSessions', 'DESC')
      .take(limit)
      .getMany();
  }
}
