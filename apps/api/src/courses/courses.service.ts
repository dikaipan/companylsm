import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Course, CourseStatus, Prisma, Role } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CourseWhereUniqueInput;
    where?: Prisma.CourseWhereInput;
    orderBy?: Prisma.CourseOrderByWithRelationInput;
  }): Promise<Course[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.course.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        category: true,
        instructor: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async findOne(id: string): Promise<Course | null> {
    return (this.prisma as any).course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: true,
          },
          orderBy: { order: 'asc' },
        },
        instructor: {
          select: { name: true },
        },
        divisions: {
          include: {
            division: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  }

  async count(where?: Prisma.CourseWhereInput): Promise<number> {
    return this.prisma.course.count({ where });
  }

  async findMyCourses(userId: string): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: {
        enrollments: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        enrollments: {
          where: { userId },
          select: { progress: true },
        },
      },
    });
  }

  // Admin usage
  async getStats() {
    const total = await this.prisma.course.count();
    const published = await this.prisma.course.count({
      where: { status: CourseStatus.PUBLISHED },
    });
    const draft = await this.prisma.course.count({
      where: { status: CourseStatus.DRAFT },
    });

    return { total, published, draft };
  }
  async updateStatus(id: string, status: CourseStatus): Promise<Course> {
    return this.prisma.course.update({
      where: { id },
      data: { status },
    });
  }

  async update(id: string, data: any): Promise<Course> {
    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  async create(data: any, instructorId: string): Promise<Course> {
    const { price, ...rest } = data;
    return this.prisma.course.create({
      data: {
        ...rest,
        price: price !== undefined ? price : 0,
        instructorId,
      },
    });
  }

  // Get courses for a specific user, filtered by their division
  async findForUser(userId: string) {
    // Get user with their division
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { divisionId: true, role: true } as any,
    });

    // Admin sees all courses
    if ((user as any)?.role === Role.ADMIN) {
      return (this.prisma as any).course.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          category: true,
          instructor: { select: { name: true } },
          divisions: {
            include: { division: { select: { id: true, name: true } } },
          },
        },
      });
    }

    // Get courses that are either:
    // 1. Assigned to user's division (division-specific)
    // 2. Not assigned to any division (available to all)
    const courses = await (this.prisma as any).course.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          // Has no division assignments (available to all)
          { divisions: { none: {} } },
          // Assigned to user's division
          ...((user as any)?.divisionId
            ? [
                {
                  divisions: { some: { divisionId: (user as any).divisionId } },
                },
              ]
            : []),
          // Already enrolled (even if from another division)
          { enrollments: { some: { userId } } },
        ],
      },
      include: {
        category: true,
        instructor: { select: { name: true } },
        divisions: {
          include: { division: { select: { id: true, name: true } } },
        },
      },
    });

    // Add isMandatory flag for each course based on user's division
    return courses.map((course: any) => {
      const userDivisionAssignment = course.divisions.find(
        (d: any) => d.divisionId === (user as any)?.divisionId,
      );
      return {
        ...course,
        isMandatory: userDivisionAssignment?.isMandatory ?? false,
        forAllDivisions: course.divisions.length === 0,
      };
    });
  }
}
