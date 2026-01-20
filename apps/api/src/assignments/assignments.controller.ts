import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('assignments')
@Controller('assignments')
export class AssignmentsController {
  constructor(private prisma: PrismaService) {}

  // Create assignment
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a new assignment' })
  async create(
    @Body()
    body: {
      title: string;
      description?: string;
      dueDate?: string;
      lessonId: string;
      maxScore?: number;
    },
  ) {
    return this.prisma.assignment.create({
      data: {
        title: body.title,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        lessonId: body.lessonId,
      },
      include: {
        lesson: {
          select: { id: true, title: true },
        },
      },
    });
  }

  // Get assignment by ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assignment details' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        lesson: {
          select: { id: true, title: true, moduleId: true },
          include: {
            module: {
              select: { courseId: true },
            },
          },
        },
        submissions: {
          where: { userId: req.user.userId },
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
    });

    return assignment;
  }

  // Get assignments by lesson
  @Get('lesson/:lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assignments for a lesson' })
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.prisma.assignment.findMany({
      where: { lessonId },
      include: {
        _count: { select: { submissions: true } },
      },
    });
  }

  // Update assignment
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Update assignment' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      dueDate?: string;
    },
  ) {
    return this.prisma.assignment.update({
      where: { id },
      data: {
        title: body.title,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
    });
  }

  // Delete assignment
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete assignment' })
  async delete(@Param('id') id: string) {
    return this.prisma.assignment.delete({ where: { id } });
  }

  // Submit assignment
  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit assignment work' })
  async submit(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { content?: string; fileUrl?: string },
  ) {
    const userId = req.user.userId;

    // Check for existing submission
    const existing = await this.prisma.submission.findFirst({
      where: { assignmentId: id, userId },
    });

    if (existing) {
      // Update existing submission
      return this.prisma.submission.update({
        where: { id: existing.id },
        data: {
          content: body.content,
          fileUrl: body.fileUrl,
          submittedAt: new Date(),
          score: null, // Reset score on resubmission
          feedback: null,
        },
      });
    }

    return this.prisma.submission.create({
      data: {
        assignmentId: id,
        userId,
        content: body.content,
        fileUrl: body.fileUrl,
      },
    });
  }

  // Get all submissions for an assignment (admin/instructor)
  @Get(':id/submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Get all submissions for assignment' })
  async getSubmissions(@Param('id') id: string) {
    return this.prisma.submission.findMany({
      where: { assignmentId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // Get user's submission
  @Get(':id/my-submission')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my submission for this assignment' })
  async getMySubmission(@Param('id') id: string, @Request() req: any) {
    return this.prisma.submission.findFirst({
      where: {
        assignmentId: id,
        userId: req.user.userId,
      },
    });
  }

  // Grade submission
  @Patch('submissions/:submissionId/grade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Grade a submission' })
  async grade(
    @Param('submissionId') submissionId: string,
    @Body() body: { score: number; feedback?: string },
  ) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: body.score,
        feedback: body.feedback,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
