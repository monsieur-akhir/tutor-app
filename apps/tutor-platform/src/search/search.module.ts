import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { User } from '../common/entities/user.entity';
import { UserProfile } from '../common/entities/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
