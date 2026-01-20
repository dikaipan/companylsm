import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LibraryService {
    constructor(private prisma: PrismaService) { }

    async findAllResources(options: {
        type?: string;
        categoryId?: string;
        search?: string;
        featured?: boolean;
        userId?: string;
        userDivisionId?: string;
        userRole?: string;
    }) {
        const { type, categoryId, search, featured, userId, userDivisionId, userRole } = options;

        const where: any = {};

        if (type) where.type = type;
        if (categoryId) where.categoryId = categoryId;
        if (featured !== undefined) where.featured = featured;

        // Build AND conditions
        const andConditions: any[] = [];

        // Search condition
        if (search) {
            andConditions.push({
                OR: [
                    { title: { contains: search } },
                    { description: { contains: search } },
                    { author: { contains: search } },
                    { tags: { contains: search } },
                ]
            });
        }

        // Access control condition
        // If user is ADMIN, they can see everything (bypass access control)
        if (userRole !== 'ADMIN') {
            const accessConditions: any[] = [{ accessType: 'PUBLIC' }];
            if (userDivisionId) accessConditions.push({ accessType: 'DIVISION', divisionId: userDivisionId });
            if (userRole) accessConditions.push({ accessType: 'ROLE', requiredRole: userRole });

            andConditions.push({ OR: accessConditions });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        return (this.prisma as any).resource.findMany({
            where,
            include: {
                category: true,
                _count: { select: { bookmarks: true } },
            },
            orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        });
    }

    async findOneResource(id: string) {
        return (this.prisma as any).resource.findUnique({
            where: { id },
            include: {
                category: true,
                _count: { select: { bookmarks: true } },
            },
        });
    }

    async recordView(id: string, userId?: string) {
        // Increment views
        await (this.prisma as any).resource.update({
            where: { id },
            data: { views: { increment: 1 } },
        });

        // Log activity if userId provided
        if (userId) {
            // Check if viewed recently to prevent spam (optional, but good practice)
            // For now just log it
            await (this.prisma as any).libraryActivity.create({
                data: {
                    userId,
                    resourceId: id,
                    type: 'VIEW',
                },
            });
        }

        return { success: true };
    }

    async createResource(data: {
        title: string;
        description?: string;
        type: string;
        fileUrl?: string;
        externalUrl?: string;
        thumbnail?: string;
        author?: string;
        tags?: string;
        categoryId?: string;
        accessType?: string;
        divisionId?: string;
        requiredRole?: string;
        pageCount?: number;
        duration?: string;
        featured?: boolean;
    }) {
        return (this.prisma as any).resource.create({
            data,
            include: { category: true },
        });
    }

    async updateResource(id: string, data: any) {
        return (this.prisma as any).resource.update({
            where: { id },
            data,
            include: { category: true },
        });
    }

    async deleteResource(id: string) {
        return (this.prisma as any).resource.delete({ where: { id } });
    }

    async incrementDownload(id: string, userId?: string) {
        // Log activity if userId provided
        if (userId) {
            await (this.prisma as any).libraryActivity.create({
                data: {
                    userId,
                    resourceId: id,
                    type: 'DOWNLOAD',
                },
            });
        }

        return (this.prisma as any).resource.update({
            where: { id },
            data: { downloads: { increment: 1 } },
        });
    }

    // Categories
    async findAllCategories() {
        return (this.prisma as any).resourceCategory.findMany({
            include: { _count: { select: { resources: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async createCategory(data: { name: string; description?: string; icon?: string }) {
        return (this.prisma as any).resourceCategory.create({ data });
    }

    async updateCategory(id: string, data: any) {
        return (this.prisma as any).resourceCategory.update({ where: { id }, data });
    }

    async deleteCategory(id: string) {
        return (this.prisma as any).resourceCategory.delete({ where: { id } });
    }

    // Bookmarks
    async getUserBookmarks(userId: string) {
        return (this.prisma as any).resourceBookmark.findMany({
            where: { userId },
            include: { resource: { include: { category: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async toggleBookmark(userId: string, resourceId: string) {
        const existing = await (this.prisma as any).resourceBookmark.findUnique({
            where: { userId_resourceId: { userId, resourceId } },
        });

        if (existing) {
            await (this.prisma as any).resourceBookmark.delete({
                where: { id: existing.id },
            });
            return { bookmarked: false };
        }

        await (this.prisma as any).resourceBookmark.create({
            data: { userId, resourceId },
        });

        // Log bookmark activity
        await (this.prisma as any).libraryActivity.create({
            data: {
                userId,
                resourceId,
                type: 'BOOKMARK',
            },
        });

        return { bookmarked: true };
    }

    async isBookmarked(userId: string, resourceId: string) {
        const bookmark = await (this.prisma as any).resourceBookmark.findUnique({
            where: { userId_resourceId: { userId, resourceId } },
        });
        return { bookmarked: !!bookmark };
    }

    // Reading Progress
    async getProgress(userId: string, resourceId: string) {
        return (this.prisma as any).readingProgress.findUnique({
            where: { userId_resourceId: { userId, resourceId } },
        });
    }

    async updateProgress(
        userId: string,
        resourceId: string,
        data: { progress?: number; lastPage?: number; lastPosition?: number },
    ) {
        return (this.prisma as any).readingProgress.upsert({
            where: { userId_resourceId: { userId, resourceId } },
            update: data,
            create: { userId, resourceId, ...data },
        });
    }
}
