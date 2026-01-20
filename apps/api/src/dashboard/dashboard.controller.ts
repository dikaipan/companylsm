import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { CoursesService } from '../courses/courses.service';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(
    private usersService: UsersService,
    private coursesService: CoursesService,
  ) {}

  @Get('admin-stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get aggregated stats for Admin Dashboard' })
  async getAdminStats() {
    const totalUsers = await this.usersService.count();
    const courseStats = await this.coursesService.getStats();

    // Calculate a dummy completion rate for now
    // In real app: count completed enrollments / total enrollments
    const completionRate = 15;

    return {
      totalUsers,
      activeCourses: courseStats.published,
      draftCourses: courseStats.draft,
      completionRate,
    };
  }
}
