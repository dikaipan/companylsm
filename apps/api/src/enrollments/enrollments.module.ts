import { Module } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentsController],
})
export class EnrollmentsModule {}
