import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [UsersModule, CoursesModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
