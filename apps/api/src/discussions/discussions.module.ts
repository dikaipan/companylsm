import { Module } from '@nestjs/common';
import { DiscussionsController } from './discussions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [DiscussionsController],
})
export class DiscussionsModule {}
