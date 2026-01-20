import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamificationService {
    constructor(private prisma: PrismaService) { }

    async getLeaderboard() {
        // Fetch users (STUDENT, ADMIN, INSTRUCTOR)
        // In a real large app, this processing should be done via a materialized view or cached job
        const learners = await this.prisma.user.findMany({
            where: {
                role: { in: ['STUDENT', 'ADMIN', 'INSTRUCTOR'] },
            },
            select: {
                id: true,
                name: true,
                avatar: true, // Assuming avatar exists or we use placeholder
                _count: {
                    select: {
                        enrollments: { where: { progress: 100 } },
                        badges: true,
                    },
                },
                badges: {
                    include: {
                        badge: true,
                    },
                },
            } as any,
            // We can't easily sort by calculated field at DB level with this schema, 
            // so we fetch a reasonable amount and sort in memory.
            take: 100,
        });

        type LearnerResult = {
            id: string;
            name: string | null;
            avatar: string | null;
            _count: { enrollments: number; badges: number };
            badges: { badge: { points: number } }[];
        };

        const leaderboard = (learners as unknown as LearnerResult[]).map(user => {
            const coursePoints = user._count.enrollments * 50;
            const badgePoints = user.badges.reduce((sum, ub) => sum + (ub.badge.points || 0), 0);
            const totalPoints = coursePoints + badgePoints;

            return {
                id: user.id,
                name: user.name || 'Anonymous',
                avatar: user.avatar,
                completedCourses: user._count.enrollments,
                badgesCount: user._count.badges,
                points: totalPoints,
            };
        });

        // Sort by points desc
        return leaderboard
            .sort((a, b) => b.points - a.points)
            .slice(0, 50); // Return top 50
    }

    async getMyRank(userId: string) {
        const leaderboard = await this.getLeaderboard();
        const rank = leaderboard.findIndex(u => u.id === userId) + 1;
        const myStats = leaderboard.find(u => u.id === userId);

        return {
            rank: rank > 0 ? rank : null, // null if not in top 100
            stats: myStats || null
        };
    }
}
