import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AssignmentsController],
})
export class AssignmentsModule {}
