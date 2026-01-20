import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
  Body,
  Post,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CourseStatus, Role } from '@prisma/client';
import { CreateCourseDto } from './dto/create-course.dto';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all public courses' })
  findAll(@Query('search') search?: string) {
    return this.coursesService.findAll({
      where: {
        status: 'PUBLISHED',
        title: { contains: search },
      },
    });
  }

  @Get('for-me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get courses filtered by user division' })
  findForMe(@Request() req: any) {
    return this.coursesService.findForUser(req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a new course' })
  create(@Request() req: any, @Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto, req.user.userId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course statistics (Admin)' })
  getStats() {
    return this.coursesService.getStats();
  }

  @Get('my-courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get courses enrolled by current user' })
  findMyCourses(@Request() req: any) {
    return this.coursesService.findMyCourses(req.user.id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get ALL courses (Admin)' })
  adminFindAll(
    @Query('search') search?: string,
    @Query('status') status?: CourseStatus,
  ) {
    return this.coursesService.findAll({
      where: {
        title: { contains: search },
        status: status,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update course status (Admin)' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: CourseStatus },
  ) {
    return this.coursesService.updateStatus(id, body.status);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR) // Allow instructors to update their courses potentially
  @ApiOperation({ summary: 'Update course details' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.coursesService.update(id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course details' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }
}
