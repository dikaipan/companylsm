import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { BadgesModule } from '../badges/badges.module';

@Module({
  imports: [PrismaModule, EmailModule, BadgesModule],
  controllers: [LessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}
