import { Module } from '@nestjs/common';
import { BadgesController } from './badges.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BadgesService } from './badges.service';

@Module({
  imports: [PrismaModule],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
