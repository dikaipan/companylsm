import { Module } from '@nestjs/common';
import { DivisionsController } from './divisions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DivisionsController],
})
export class DivisionsModule {}
