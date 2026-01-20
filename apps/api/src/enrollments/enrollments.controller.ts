import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

import { EmailService } from '../email/email.service';

@ApiTags('enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) { }

  @Post('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll in a course' })
  async enroll(@Param('courseId') courseId: string, @Request() req: any) {
    const userId = req.user.userId;

    // Check if already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (existing) {
      return { message: 'Already enrolled', enrollment: existing };
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        progress: 0,
      },
      include: {
        course: { select: { title: true } },
        user: { select: { email: true, name: true } },
      },
    });

    if (enrollment.user) {
      await this.emailService.sendCourseEnrollmentEmail(
        enrollment.user.email,
        enrollment.user.name,
        enrollment.course.title,
      );
    }

    return { message: 'Enrolled successfully', enrollment };
  }

  @Get('course/:courseId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check enrollment status for a course' })
  async checkStatus(@Param('courseId') courseId: string, @Request() req: any) {
    const userId = req.user.userId;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!enrollment) {
      return { enrolled: false, enrollment: null };
    }

    // Calculate actual progress from completed lessons
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: { lessons: { select: { id: true } } },
        },
      },
    });

    const totalLessons =
      course?.modules.reduce((sum, m) => sum + m.lessons.length, 0) || 0;

    if (totalLessons === 0) {
      return { enrolled: true, enrollment: { ...enrollment, progress: 0 } };
    }

    const lessonIds =
      course?.modules.flatMap((m) => m.lessons.map((l) => l.id)) || [];
    const completedCount = await this.prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: lessonIds },
        completed: true,
      },
    });

    const progress = Math.round((completedCount / totalLessons) * 100);

    return {
      enrolled: true,
      enrollment: { ...enrollment, progress },
    };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my enrollments with calculated progress' })
  async getMyEnrollments(@Request() req: any) {
    const userId = req.user.userId;

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            category: true,
            instructor: { select: { name: true } },
            modules: {
              include: { lessons: { select: { id: true } } },
            },
          },
        },
      },
    });

    // Calculate actual progress for each enrollment
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalLessons = enrollment.course.modules.reduce(
          (sum, m) => sum + m.lessons.length,
          0,
        );

        if (totalLessons === 0) {
          // Use stored progress if no lessons exist
          return { ...enrollment, progress: enrollment.progress ?? 0 };
        }

        const lessonIds = enrollment.course.modules.flatMap((m) =>
          m.lessons.map((l) => l.id),
        );

        const completedCount = await this.prisma.lessonProgress.count({
          where: {
            userId,
            lessonId: { in: lessonIds },
            completed: true,
          },
        });

        // Calculate progress, but use stored progress as fallback for seed data
        const calculatedProgress = Math.round(
          (completedCount / totalLessons) * 100,
        );
        const finalProgress =
          calculatedProgress > 0
            ? calculatedProgress
            : (enrollment.progress ?? 0);

        return {
          ...enrollment,
          progress: finalProgress,
        };
      }),
    );

    return enrichedEnrollments;
  }

  @Delete('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unenroll from a course' })
  async unenroll(@Param('courseId') courseId: string, @Request() req: any) {
    const userId = req.user.userId;

    await this.prisma.enrollment.delete({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    return { message: 'Unenrolled successfully' };
  }
}
