import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AnalyticsController {
    constructor(private prisma: PrismaService) { }

    @Get('overview')
    @ApiOperation({ summary: 'Get system overview stats' })
    async getOverview() {
        const [totalUsers, totalCourses, totalEnrollments, totalCertificates] =
            await Promise.all([
                this.prisma.user.count(),
                this.prisma.course.count(),
                this.prisma.enrollment.count(),
                this.prisma.certificate.count(),
            ]);

        const activeStudents = await this.prisma.user.count({
            where: { role: 'STUDENT' },
        });

        const publishedCourses = await this.prisma.course.count({
            where: { status: 'PUBLISHED' },
        });

        return {
            totalUsers,
            totalCourses,
            totalEnrollments,
            totalCertificates,
            activeStudents,
            publishedCourses,
        };
    }

    @Get('course-completions')
    @ApiOperation({ summary: 'Get completion rates by course' })
    async getCourseCompletions() {
        const courses = await this.prisma.course.findMany({
            where: { status: 'PUBLISHED' },
            select: {
                id: true,
                title: true,
                _count: {
                    select: { enrollments: true },
                },
            },
        });

        const completionData = await Promise.all(
            courses.map(async (course) => {
                const completedCount = await this.prisma.enrollment.count({
                    where: {
                        courseId: course.id,
                        progress: 100,
                    },
                });

                const totalEnrollments = course._count.enrollments;
                const completionRate =
                    totalEnrollments > 0
                        ? Math.round((completedCount / totalEnrollments) * 100)
                        : 0;

                return {
                    courseId: course.id,
                    courseTitle: course.title,
                    totalEnrollments,
                    completedCount,
                    completionRate,
                };
            }),
        );

        return completionData.sort(
            (a, b) => b.totalEnrollments - a.totalEnrollments,
        );
    }

    @Get('engagement')
    @ApiOperation({ summary: 'Get user engagement over time' })
    async getEngagement() {
        // Get enrollments grouped by date (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const enrollments = await this.prisma.enrollment.findMany({
            where: {
                enrolledAt: { gte: thirtyDaysAgo },
            },
            select: {
                enrolledAt: true,
            },
        });

        // Group by date
        const dailyData: Record<string, number> = {};
        enrollments.forEach((e) => {
            const date = e.enrolledAt.toISOString().split('T')[0];
            dailyData[date] = (dailyData[date] || 0) + 1;
        });

        // Convert to array sorted by date
        const result = Object.entries(dailyData)
            .map(([date, count]) => ({ date, enrollments: count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return result;
    }

    @Get('top-courses')
    @ApiOperation({ summary: 'Get top performing courses' })
    async getTopCourses() {
        const courses = await this.prisma.course.findMany({
            where: { status: 'PUBLISHED' },
            include: {
                _count: {
                    select: { enrollments: true },
                },
                category: true,
            },
            orderBy: {
                enrollments: { _count: 'desc' },
            },
            take: 10,
        });

        return courses.map((c) => ({
            id: c.id,
            title: c.title,
            category: c.category?.name || 'Uncategorized',
            enrollments: c._count.enrollments,
        }));
    }

    @Get('division-stats')
    @ApiOperation({ summary: 'Get stats by division' })
    async getDivisionStats() {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const divisions = await this.prisma.division.findMany({
            include: {
                _count: {
                    select: { users: true, courses: true },
                },
            },
        });

        return divisions.map(
            (d: {
                id: string;
                name: string;
                _count: { users: number; courses: number };
            }) => ({
                id: d.id,
                name: d.name,
                userCount: d._count.users,
                courseCount: d._count.courses,
            }),
        );
    }
    @Get('top-learners')
    @ApiOperation({
        summary: 'Get top 10 learners (employees) by course completion and badges',
    })
    async getTopLearners() {
        // Fetch users who are students, admins, or instructors (anyone can be a learner)
        const learners = await this.prisma.user.findMany({
            where: {
                role: { in: ['STUDENT', 'ADMIN', 'INSTRUCTOR'] },
            },
            select: {
                id: true,
                name: true,
                email: true,
                _count: {
                    select: {
                        enrollments: { where: { progress: 100 } },
                        badges: true,
                        // Count completed resources
                        readingProgress: { where: { progress: 100 } } as any,
                    },
                },
                badges: {
                    include: {
                        badge: true,
                    },
                },
            } as any,
            take: 50, // Fetch more initially to sort by calculated points in memory if needed, or query improvement
        });

        // Calculate total points (1 course = 50 pts, 1 resource = 10 pts, badge points = badge.points)
        type LearnerResult = {
            id: string;
            name: string | null;
            email: string;
            _count: { enrollments: number; badges: number; readingProgress: number };
            badges: { badge: { points: number } }[];
        };

        const detailedLearners = (learners as unknown as LearnerResult[]).map(
            (user) => {
                const coursePoints = user._count.enrollments * 50;
                const libraryPoints = user._count.readingProgress * 10;
                const badgePoints = user.badges.reduce(
                    (sum, ub) => sum + (ub.badge.points || 0),
                    0,
                );
                return {
                    id: user.id,
                    name: user.name || user.email.split('@')[0],
                    email: user.email,
                    completedCourses: user._count.enrollments,
                    resourcesRead: user._count.readingProgress,
                    badgesEarned: user._count.badges,
                    totalPoints: coursePoints + badgePoints + libraryPoints,
                    pointsLabel: `${coursePoints + badgePoints + libraryPoints} pts`,
                };
            },
        );

        // Sort by total points desc
        return detailedLearners
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, 10);
    }

    @Get('quiz-analytics')
    @ApiOperation({ summary: 'Get quiz performance stats' })
    async getQuizAnalytics() {
        const quizzes = await this.prisma.quiz.findMany({
            include: {
                course: { select: { title: true } },
                _count: { select: { attempts: true } },
                attempts: { select: { score: true, passed: true } },
            },
        });

        return quizzes
            .map((quiz) => {
                const totalAttempts = quiz._count.attempts;
                if (totalAttempts === 0) return null;

                const avgScore =
                    quiz.attempts.reduce((sum, a) => sum + (a.score || 0), 0) /
                    totalAttempts;
                const passedCount = quiz.attempts.filter((a) => a.passed).length;
                const passRate = Math.round((passedCount / totalAttempts) * 100);

                const courseTitle = quiz.course ? quiz.course.title : 'Unknown Course';

                return {
                    id: quiz.id,
                    title: quiz.title,
                    courseTitle,
                    avgScore: Math.round(avgScore),
                    passRate,
                    totalAttempts,
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => b.totalAttempts - a.totalAttempts);
    }

    @Get('division-compliance')
    @ApiOperation({
        summary: 'Get mandatory course completion rate per division',
    })
    async getDivisionCompliance() {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const divisions = await this.prisma.division.findMany({
            include: {
                users: { select: { id: true } },
                courses: { where: { isMandatory: true }, include: { course: true } },
            },
        });

        type DivisionWithRelations = {
            id: string;
            name: string;
            users: { id: string }[];
            courses: { courseId: string }[];
        };

        const stats = await Promise.all(
            (divisions as unknown as DivisionWithRelations[]).map(async (div) => {
                const userIds = div.users.map((u) => u.id);
                const mandatoryCourseIds = div.courses.map((c) => c.courseId);

                if (userIds.length === 0 || mandatoryCourseIds.length === 0) {
                    return {
                        id: div.id,
                        name: div.name,
                        complianceRate: 100, // No requirements = 100% compliant
                        pendingTasks: 0,
                    };
                }

                // Count how many mandatory enrollments are completed for this division's users
                const completions = await this.prisma.enrollment.count({
                    where: {
                        userId: { in: userIds },
                        courseId: { in: mandatoryCourseIds },
                        progress: 100,
                    },
                });

                const totalRequired = userIds.length * mandatoryCourseIds.length;
                const complianceRate = Math.round((completions / totalRequired) * 100);

                return {
                    id: div.id,
                    name: div.name,
                    complianceRate,
                    pendingTasks: totalRequired - completions,
                };
            }),
        );

        return stats;
    }

    @Get('dropout-analysis')
    @ApiOperation({
        summary: 'Find students enrolled > 30 days with < 10% progress',
    })
    async getDropoutAnalysis() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stuckEnrollments = await this.prisma.enrollment.findMany({
            where: {
                enrolledAt: { lt: thirtyDaysAgo },
                progress: { lt: 10 },
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                course: { select: { title: true } },
            },
            take: 20,
        });

        return stuckEnrollments.map((e) => ({
            userId: e.user.id,
            userName: e.user.name,
            userEmail: e.user.email,
            courseTitle: e.course.title,
            progress: e.progress,
            daysStuck: Math.floor(
                (new Date().getTime() - new Date(e.enrolledAt).getTime()) /
                (1000 * 3600 * 24),
            ),
        }));
    }

    @Get('time-to-complete')
    @ApiOperation({ summary: 'Average days to complete courses' })
    async getTimeToComplete() {
        // Get all certificates to calculate actual completion times
        const certs = await this.prisma.certificate.findMany({
            select: {
                issuedAt: true,
                courseId: true,
                userId: true,
                course: { select: { title: true } },
            },
        });

        // We need enrollment dates to compare
        const courseStats: Record<
            string,
            { totalDays: number; count: number; title: string }
        > = {};

        for (const cert of certs) {
            const enrollment = await this.prisma.enrollment.findUnique({
                where: {
                    userId_courseId: { userId: cert.userId, courseId: cert.courseId },
                },
            });

            if (enrollment) {
                const days =
                    (new Date(cert.issuedAt).getTime() -
                        new Date(enrollment.enrolledAt).getTime()) /
                    (1000 * 3600 * 24);

                if (!courseStats[cert.courseId]) {
                    courseStats[cert.courseId] = {
                        totalDays: 0,
                        count: 0,
                        title: cert.course.title,
                    };
                }
                courseStats[cert.courseId].totalDays += days;
                courseStats[cert.courseId].count += 1;
            }
        }

        return Object.values(courseStats)
            .map((stat) => ({
                courseTitle: stat.title,
                avgDays: Math.round(stat.totalDays / stat.count),
            }))
            .sort((a, b) => b.avgDays - a.avgDays);
    }

    @Get('library-stats')
    @ApiOperation({ summary: 'Get detailed library usage stats' })
    async getLibraryStats() {
        // 1. Total Stats
        const totalResources = await (this.prisma as any).resource.count();
        const totalViews = await (this.prisma as any).resource.aggregate({
            _sum: { views: true },
        });
        const totalDownloads = await (this.prisma as any).resource.aggregate({
            _sum: { downloads: true },
        });

        // 2. Most Viewed
        const mostViewed = await (this.prisma as any).resource.findMany({
            orderBy: { views: 'desc' },
            take: 5,
            select: { id: true, title: true, views: true, type: true },
        });

        // 3. Most Downloaded
        const mostDownloaded = await (this.prisma as any).resource.findMany({
            orderBy: { downloads: 'desc' },
            take: 5,
            select: { id: true, title: true, downloads: true, type: true },
        });

        return {
            totalResources,
            totalViews: totalViews._sum.views || 0,
            totalDownloads: totalDownloads._sum.downloads || 0,
            mostViewed,
            mostDownloaded,
        };
    }

    @Get('library-user-activity')
    @ApiOperation({ summary: 'Get per-user library activity log (views, downloads, reads)' })
    async getLibraryUserActivity() {
        // Get recent activity with user and resource details
        const activities = await (this.prisma as any).libraryActivity.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: { select: { id: true, name: true, email: true, division: { select: { name: true } } } },
                resource: { select: { id: true, title: true, type: true } },
            },
        });

        // Aggregate stats per user
        const userStats = await (this.prisma as any).libraryActivity.groupBy({
            by: ['userId'],
            _count: { id: true },
        });

        // Get user details for aggregated stats
        const userIds = userStats.map((s: any) => s.userId);
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, division: { select: { name: true } } },
        });

        const userStatsWithDetails = userStats.map((stat: any) => {
            const user = users.find((u: any) => u.id === stat.userId);
            return {
                userId: stat.userId,
                userName: user?.name || user?.email?.split('@')[0] || 'Unknown',
                userEmail: user?.email,
                division: user?.division?.name || 'N/A',
                totalActivities: stat._count.id,
            };
        }).sort((a: any, b: any) => b.totalActivities - a.totalActivities);

        // Activity breakdown by type
        const activityByType = await (this.prisma as any).libraryActivity.groupBy({
            by: ['type'],
            _count: { id: true },
        });

        return {
            recentActivities: activities.map((a: any) => ({
                id: a.id,
                userName: a.user?.name || a.user?.email?.split('@')[0],
                userEmail: a.user?.email,
                division: a.user?.division?.name || 'N/A',
                resourceTitle: a.resource?.title,
                resourceType: a.resource?.type,
                activityType: a.type,
                createdAt: a.createdAt,
            })),
            topActiveUsers: userStatsWithDetails.slice(0, 20),
            activityByType: activityByType.map((t: any) => ({
                type: t.type,
                count: t._count.id,
            })),
        };
    }
}

