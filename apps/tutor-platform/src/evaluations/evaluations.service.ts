import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation } from '../common/entities/evaluation.entity';
import { Booking } from '../common/entities/booking.entity';
import { User } from '../common/entities/user.entity';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation)
    private evaluationRepository: Repository<Evaluation>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createEvaluation(data: any): Promise<Evaluation> {
    const { bookingId, studentId, providerId, type, rating, comment, quizAnswers } = data;

    // Vérifier que la réservation existe
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Vérifier que l'utilisateur est autorisé à créer cette évaluation
    if (studentId !== booking.studentId && providerId !== booking.providerId) {
      throw new NotFoundException('Not authorized to create this evaluation');
    }

    const evaluation = this.evaluationRepository.create({
      bookingId,
      studentId,
      providerId,
      type,
      rating,
      comment,
      quizAnswers,
    });

    return this.evaluationRepository.save(evaluation);
  }

  async getEvaluations(bookingId?: string, userId?: string): Promise<Evaluation[]> {
    const query = this.evaluationRepository.createQueryBuilder('evaluation');

    if (bookingId) {
      query.where('evaluation.bookingId = :bookingId', { bookingId });
    }

    if (userId) {
      query.andWhere('(evaluation.studentId = :userId OR evaluation.providerId = :userId)', { userId });
    }

    return query.getMany();
  }

  async getEvaluation(id: string): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: ['booking'],
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    return evaluation;
  }

  async updateEvaluation(id: string, data: any): Promise<Evaluation> {
    const evaluation = await this.getEvaluation(id);
    
    Object.assign(evaluation, data);
    return this.evaluationRepository.save(evaluation);
  }

  async getAverageRating(providerId: string): Promise<number> {
    const result = await this.evaluationRepository
      .createQueryBuilder('evaluation')
      .select('AVG(evaluation.rating)', 'average')
      .where('evaluation.providerId = :providerId', { providerId })
      .andWhere('evaluation.rating IS NOT NULL')
      .getRawOne();

    return result?.average || 0;
  }
}
