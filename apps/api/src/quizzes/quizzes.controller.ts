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

@ApiTags('quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private prisma: PrismaService) {}

  // Create a quiz
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a new quiz' })
  async create(
    @Body()
    body: {
      title: string;
      description?: string;
      passingScore?: number;
      timeLimit?: number;
      lessonId?: string;
      courseId?: string;
      questions?: {
        text: string;
        points?: number;
        options: { text: string; isCorrect: boolean }[];
      }[];
    },
  ) {
    return this.prisma.quiz.create({
      data: {
        title: body.title,
        description: body.description,
        passingScore: body.passingScore || 70,
        timeLimit: body.timeLimit,
        lessonId: body.lessonId,
        courseId: body.courseId,
        questions: body.questions
          ? {
              create: body.questions.map((q, index) => ({
                text: q.text,
                order: index,
                points: q.points || 1,
                options: {
                  create: q.options.map((o) => ({
                    text: o.text,
                    isCorrect: o.isCorrect,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  // Get quiz by ID (for students - hide correct answers)
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quiz details' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: {
              select: { id: true, text: true }, // Don't show isCorrect
            },
          },
          orderBy: { order: 'asc' },
        },
        lesson: { select: { id: true, title: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return quiz;
  }

  // Get quiz by ID (for admin - show correct answers)
  @Get(':id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Get quiz details with answers' })
  async findOneAdmin(@Param('id') id: string) {
    return this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  // Get quizzes for a course
  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quizzes for a course' })
  async findByCourse(@Param('courseId') courseId: string) {
    return this.prisma.quiz.findMany({
      where: { courseId },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    });
  }

  // Get quizzes for a lesson
  @Get('lesson/:lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quizzes for a lesson' })
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.prisma.quiz.findMany({
      where: { lessonId },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    });
  }

  // Start quiz attempt
  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a quiz attempt' })
  async startAttempt(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId;

    // Check for existing incomplete attempt
    const existingAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId: id,
        completedAt: null,
      },
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    return this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId: id,
      },
    });
  }

  // Submit quiz answers
  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit quiz answers' })
  async submitQuiz(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    body: {
      attemptId: string;
      answers: { questionId: string; optionId: string }[];
    },
  ) {
    const userId = req.user.userId;

    // Verify attempt belongs to user
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: { id: body.attemptId, userId, quizId: id },
    });

    if (!attempt) {
      return { error: 'Invalid attempt' };
    }

    if (attempt.completedAt) {
      return { error: 'Quiz already submitted' };
    }

    // Get quiz with correct answers
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!quiz) return { error: 'Quiz not found' };

    // Calculate score
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = body.answers.find((a) => a.questionId === question.id);
      const correctOption = question.options.find((o) => o.isCorrect);

      if (
        userAnswer &&
        correctOption &&
        userAnswer.optionId === correctOption.id
      ) {
        correctCount++;
        earnedPoints += question.points;
      }
    }

    const score =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passingScore;

    // Save answers
    await this.prisma.quizAnswer.createMany({
      data: body.answers.map((a) => ({
        attemptId: body.attemptId,
        questionId: a.questionId,
        optionId: a.optionId,
      })),
      skipDuplicates: true,
    });

    // Update attempt
    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { id: body.attemptId },
      data: {
        score,
        passed,
        completedAt: new Date(),
      },
    });

    return {
      attempt: updatedAttempt,
      result: {
        score,
        passed,
        correctCount,
        totalQuestions: quiz.questions.length,
        passingScore: quiz.passingScore,
      },
    };
  }

  // Get user's attempts for a quiz
  @Get(':id/attempts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my attempts for this quiz' })
  async getMyAttempts(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId;

    return this.prisma.quizAttempt.findMany({
      where: { userId, quizId: id },
      orderBy: { startedAt: 'desc' },
    });
  }

  // Update quiz
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Update quiz' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.prisma.quiz.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        passingScore: body.passingScore,
        timeLimit: body.timeLimit,
      },
    });
  }

  // Delete quiz
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete quiz' })
  async delete(@Param('id') id: string) {
    return this.prisma.quiz.delete({ where: { id } });
  }

  // Add question to quiz
  @Post(':id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Add question to quiz' })
  async addQuestion(
    @Param('id') id: string,
    @Body()
    body: {
      text: string;
      points?: number;
      options: { text: string; isCorrect: boolean }[];
    },
  ) {
    const count = await this.prisma.question.count({ where: { quizId: id } });

    return this.prisma.question.create({
      data: {
        text: body.text,
        order: count,
        points: body.points || 1,
        quizId: id,
        options: {
          create: body.options,
        },
      },
      include: { options: true },
    });
  }

  // Delete question
  @Delete('questions/:questionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete question' })
  async deleteQuestion(@Param('questionId') questionId: string) {
    return this.prisma.question.delete({ where: { id: questionId } });
  }
}
