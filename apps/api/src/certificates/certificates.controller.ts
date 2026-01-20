import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiProduces,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CertificatesService } from './certificates.service';
import { Response } from 'express';

@ApiTags('certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(
    private prisma: PrismaService,
    private certificatesService: CertificatesService,
  ) {}

  @Post('generate/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate certificate for completed course' })
  async generate(@Param('courseId') courseId: string, @Request() req: any) {
    const userId = req.user.userId;

    // Check if user is enrolled and has completed the course
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!enrollment) {
      return { error: 'Not enrolled in this course' };
    }

    // Calculate actual progress
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
      return { error: 'Course has no lessons' };
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

    if (progress < 100) {
      return { error: 'Course not completed yet', progress };
    }

    // Check if certificate already exists
    const existingCert = await this.prisma.certificate.findFirst({
      where: { userId, courseId },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
          },
        },
        user: { select: { name: true, email: true } },
      },
    });

    if (existingCert) {
      return {
        message: 'Certificate already exists',
        certificate: existingCert,
      };
    }

    // Generate certificate
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const certificate = await this.prisma.certificate.create({
      data: {
        userId,
        courseId,
        url: certificateId, // Using as certificate number
      },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
          },
        },
        user: { select: { name: true, email: true } },
      },
    });

    return { message: 'Certificate generated', certificate };
  }

  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate for a course' })
  async getCertificate(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    const certificate = await this.prisma.certificate.findFirst({
      where: { userId, courseId },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
          },
        },
        user: { select: { name: true, email: true } },
      },
    });

    return certificate;
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all my certificates' })
  async getMyCertificates(@Request() req: any) {
    const userId = req.user.userId;

    return this.prisma.certificate.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            category: true,
            instructor: { select: { name: true } },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  @Get('download/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download certificate as PDF' })
  @ApiProduces('application/pdf')
  async downloadCertificate(
    @Param('id') id: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const userId = req.user.userId;

    // Get certificate with all details
    const certificate = await this.prisma.certificate.findFirst({
      where: { id, userId },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
          },
        },
        user: { select: { name: true, email: true } },
      },
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    // Generate PDF
    const pdfBuffer = await this.certificatesService.generatePDF({
      userName: certificate.user.name || certificate.user.email,
      courseTitle: certificate.course.title,
      instructorName:
        certificate.course.instructor?.name || 'Hitachi Learning Team',
      completionDate: certificate.issuedAt,
      certificateId: certificate.url, // We stored the cert ID here
    });

    // Set response headers
    const sanitizedTitle = certificate.course.title.replace(
      /[^a-zA-Z0-9]/g,
      '_',
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Certificate_${sanitizedTitle}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }
}
