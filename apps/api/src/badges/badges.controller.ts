import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('badges')
@Controller('badges')
export class BadgesController {
  constructor(private prisma: PrismaService) {}

  // Get all available badges
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all badges' })
  async findAll() {
    return (this.prisma as any).badge.findMany({
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { points: 'desc' },
    });
  }

  // Get current user's badges
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my earned badges' })
  async getMyBadges(@Request() req: any) {
    const userId = req.user.userId;
    return (this.prisma as any).userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  // Create badge (Admin only)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new badge' })
  async create(
    @Body()
    body: {
      name: string;
      description?: string;
      icon?: string;
      criteria: string;
      points?: number;
    },
  ) {
    return (this.prisma as any).badge.create({
      data: {
        name: body.name,
        description: body.description,
        icon: body.icon || '🏆',
        criteria: body.criteria,
        points: body.points || 100,
      },
    });
  }

  // Update badge (Admin only)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update badge' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      icon?: string;
      criteria?: string;
      points?: number;
    },
  ) {
    return (this.prisma as any).badge.update({
      where: { id },
      data: body,
    });
  }

  // Delete badge (Admin only)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete badge' })
  async delete(@Param('id') id: string) {
    await (this.prisma as any).badge.delete({ where: { id } });
    return { message: 'Badge deleted' };
  }

  // Award badge to user (Admin only)
  @Post(':id/award/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Award badge to user' })
  async awardBadge(
    @Param('id') badgeId: string,
    @Param('userId') userId: string,
  ) {
    // Check if already has badge
    const existing = await (this.prisma as any).userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    });

    if (existing) {
      return { message: 'User already has this badge', alreadyAwarded: true };
    }

    return (this.prisma as any).userBadge.create({
      data: { userId, badgeId },
      include: { badge: true },
    });
  }

  // Leaderboard - top users by badges/points
  @Get('leaderboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get leaderboard' })
  async getLeaderboard() {
    const users = await (this.prisma as any).user.findMany({
      where: { role: 'STUDENT' },
      include: {
        badges: {
          include: { badge: true },
        },
        _count: {
          select: { certificates: true },
        },
      },
    });

    // Calculate total points and sort
    const leaderboard = users
      .map((user: any) => {
        const totalPoints = user.badges.reduce(
          (sum: number, ub: any) => sum + (ub.badge?.points || 0),
          0,
        );
        const badgeCount = user.badges.length;

        return {
          id: user.id,
          name: user.name || 'Anonymous',
          email: user.email,
          totalPoints,
          badgeCount,
          completedCourses: user._count.certificates,
        };
      })
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints);

    return leaderboard.slice(0, 20); // Top 20
  }
}
