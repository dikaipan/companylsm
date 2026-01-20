import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

import { BadgesService } from '../badges/badges.service';

@ApiTags('lessons')
@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly badgesService: BadgesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a lesson' })
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson details' })
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Update lesson' })
  update(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return this.lessonsService.update(id, updateLessonDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete lesson' })
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(id);
  }

  @Post(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark lesson as complete' })
  async markComplete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId;

    // Mark lesson complete
    await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId: id },
      },
      update: { completed: true },
      create: {
        userId,
        lessonId: id,
        completed: true,
      },
    });

    // Get the lesson to find its course
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: {
              include: {
                modules: {
                  include: { lessons: { select: { id: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return { completed: true };
    }

    const course = lesson.module.course;
    const totalLessons = course.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0,
    );

    if (totalLessons === 0) {
      return { completed: true, progress: 0 };
    }

    // Get all lesson IDs for this course
    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

    // Count completed lessons
    const completedCount = await this.prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: lessonIds },
        completed: true,
      },
    });

    const progress = Math.round((completedCount / totalLessons) * 100);

    // If 100% complete, auto-generate certificate
    if (progress >= 100) {
      // Check if certificate already exists
      const existingCert = await this.prisma.certificate.findFirst({
        where: { userId, courseId: course.id },
      });

      if (!existingCert) {
        // Generate certificate
        const cert = await this.prisma.certificate.create({
          data: {
            userId,
            courseId: course.id,
            url: `CERT-${course.id.substring(0, 8).toUpperCase()}-${Date.now()}`,
          },
        });

        // Send certificate email
        try {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
          });
          if (user) {
            await this.emailService.sendCertificateEmail(
              user.email,
              user.name,
              course.title,
              cert.url,
            );
          }
        } catch (error) {
          console.error('Failed to send certificate email:', error);
        }
      }

      // Update enrollment progress
      await this.prisma.enrollment.updateMany({
        where: { userId, courseId: course.id },
        data: { progress: 100 },
      });

      // Check and award badges
      await this.badgesService.checkAndAwardCourseBadges(userId);
    }

    return { completed: true, progress, certificateGenerated: progress >= 100 };
  }

  @Get('progress/course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson progress for a course' })
  async getCourseProgress(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    // Get all lessons for this course
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!course) return [];

    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

    return this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
    });
  }
}
