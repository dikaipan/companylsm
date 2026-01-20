import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@ApiTags('discussions')
@Controller('discussions')
export class DiscussionsController {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Create a discussion post
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a discussion post' })
  async create(
    @Request() req: any,
    @Body()
    body: {
      content: string;
      courseId: string;
      parentId?: string;
    },
  ) {
    const userId = req.user.userId;

    return this.prisma.discussion.create({
      data: {
        content: body.content,
        courseId: body.courseId,
        userId,
        parentId: body.parentId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  // Get discussions for a course
  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get discussions for a course' })
  async findByCourse(@Param('courseId') courseId: string) {
    return this.prisma.discussion.findMany({
      where: {
        courseId,
        parentId: null, // Only top-level posts
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get a single discussion with replies
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get discussion with replies' })
  async findOne(@Param('id') id: string) {
    return this.prisma.discussion.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            replies: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // Reply to a discussion
  @Post(':id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a discussion' })
  async reply(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { content: string },
  ) {
    const userId = req.user.userId;

    // Get parent discussion to get courseId
    const parent = await this.prisma.discussion.findUnique({
      where: { id },
      select: { courseId: true, userId: true, content: true },
    });

    if (!parent) {
      return { error: 'Discussion not found' };
    }

    const reply = await this.prisma.discussion.create({
      data: {
        content: body.content,
        courseId: parent.courseId,
        userId,
        parentId: id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Notify parent author if it's not the same user
    if (parent.userId !== userId) {
      await this.notificationsService.create({
        userId: parent.userId,
        title: 'New Reply to your Discussion',
        message: `${req.user.name || 'Someone'} replied to your post: "${parent.content.substring(0, 30)}..."`,
        type: 'info',
        link: `/courses/${parent.courseId}?tab=discussions`,
      });
    }

    return reply;
  }

  // Delete discussion (only by owner or admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a discussion' })
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId;
    const userRole = req.user.role;

    const discussion = await this.prisma.discussion.findUnique({
      where: { id },
    });

    if (!discussion) {
      return { error: 'Discussion not found' };
    }

    // Check ownership or admin
    if (discussion.userId !== userId && userRole !== 'ADMIN') {
      return { error: 'Not authorized to delete this discussion' };
    }

    // Delete all replies first (cascading)
    await this.prisma.discussion.deleteMany({
      where: { parentId: id },
    });

    return this.prisma.discussion.delete({ where: { id } });
  }
}
