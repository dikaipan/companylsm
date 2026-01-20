import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { EmailService } from '../email/email.service';

@Injectable()
export class BadgesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) { }

  async awardBadge(userId: string, badgeName: string) {
    // 1. Find the badge by name
    const badge = await this.prisma.badge.findUnique({
      where: { name: badgeName },
    });

    if (!badge) {
      console.log(`Badge "${badgeName}" not found. Skipping award.`);
      return;
    }

    // 2. Check if user already has it
    const existing = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });

    if (existing) {
      return; // Already earned
    }

    // 3. Award the badge
    await this.prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
      },
    });
    console.log(`🏆 Awarded badge "${badgeName}" to user ${userId}`);

    // 4. Send email notification
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user) {
      await this.emailService.sendBadgeEarnedEmail(
        user.email,
        user.name,
        badge.name,
        badge.icon,
      );
    }
  }

  async checkAndAwardCourseBadges(userId: string) {
    // Count completed courses
    const completedCount = await this.prisma.enrollment.count({
      where: {
        userId,
        progress: 100,
      },
    });

    // Rules:
    // 1 Course -> "First Step"
    // 5 Courses -> "Dedicated Learner"

    if (completedCount >= 1) {
      // Ensure badge exists in DB logic or seed, but try to award it
      await this.awardBadge(userId, 'First Step');
    }

    if (completedCount >= 5) {
      await this.awardBadge(userId, 'Dedicated Learner');
    }
  }
}
