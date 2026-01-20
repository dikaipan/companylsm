import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        divisionId: true,
        createdAt: true,
        updatedAt: true,
      } as any,
    }) as any;
  }

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  async updateRole(id: string, role: Role): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async updateDivision(id: string, divisionId: string | null): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { divisionId } as any,
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getAllDivisions() {
    return (this.prisma as any).division.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async bulkCreate(
    users: Prisma.UserCreateInput[],
  ): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        // Check if user exists
        const existing = await this.prisma.user.findUnique({
          where: { email: user.email },
        });
        if (existing) {
          errors.push(`User ${user.email} already exists`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await this.prisma.user.create({
          data: {
            ...user,
            password: hashedPassword,
          },
        });
        created++;
      } catch (error) {
        errors.push(`Failed to create ${user.email}: ${error.message}`);
      }
    }

    return { created, errors };
  }
}
