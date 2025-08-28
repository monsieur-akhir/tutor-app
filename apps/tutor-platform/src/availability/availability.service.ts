import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Availability, AvailabilitySchedule } from '../common/entities/availability.entity';
import { User } from '../common/entities/user.entity';
import { AvailabilityStatus } from '../common/enums/availability.enum';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    @InjectRepository(AvailabilitySchedule)
    private scheduleRepository: Repository<AvailabilitySchedule>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createAvailability(providerId: string, data: any): Promise<Availability> {
    const provider = await this.userRepository.findOne({ where: { id: providerId } });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const availability = this.availabilityRepository.create({
      ...data,
      providerId,
      status: AvailabilityStatus.AVAILABLE,
    });

    const saved = await this.availabilityRepository.save(availability);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getProviderAvailability(providerId: string, startDate?: Date, endDate?: Date): Promise<Availability[]> {
    const query = this.availabilityRepository.createQueryBuilder('availability')
      .where('availability.providerId = :providerId', { providerId })
      .andWhere('availability.status = :status', { status: AvailabilityStatus.AVAILABLE });

    if (startDate && endDate) {
      query.andWhere('availability.start BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return query.getMany();
  }

  async updateAvailability(id: string, data: any): Promise<Availability> {
    const availability = await this.availabilityRepository.findOne({ where: { id } });
    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    Object.assign(availability, data);
    return this.availabilityRepository.save(availability);
  }

  async deleteAvailability(id: string): Promise<void> {
    const result = await this.availabilityRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Availability not found');
    }
  }

  async createSchedule(providerId: string, data: any): Promise<AvailabilitySchedule> {
    const provider = await this.userRepository.findOne({ where: { id: providerId } });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const schedule = this.scheduleRepository.create({
      ...data,
      providerId,
    });

    const saved = await this.scheduleRepository.save(schedule);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getProviderSchedule(providerId: string): Promise<AvailabilitySchedule[]> {
    return this.scheduleRepository.find({
      where: { providerId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async checkAvailability(providerId: string, startTime: Date, endTime: Date): Promise<boolean> {
    const conflictingAvailability = await this.availabilityRepository.findOne({
      where: {
        providerId,
        status: AvailabilityStatus.AVAILABLE,
        start: Between(startTime, endTime),
      },
    });

    return !conflictingAvailability;
  }
}
