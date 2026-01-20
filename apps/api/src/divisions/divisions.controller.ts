import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('divisions')
@Controller('divisions')
export class DivisionsController {
  constructor(private prisma: PrismaService) { }

  // Get all divisions
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all divisions' })
  async findAll() {
    return (this.prisma as any).division.findMany({
      include: {
        _count: {
          select: { users: true, courses: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Get single division
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get division by ID' })
  async findOne(@Param('id') id: string) {
    return (this.prisma as any).division.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true } },
        courses: {
          include: {
            course: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });
  }

  // Create division (Admin only)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new division' })
  async create(@Body() body: { name: string; code?: string }) {
    return (this.prisma as any).division.create({
      data: {
        name: body.name,
        code: body.code,
      },
    });
  }

  // Update division (Admin only)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update division' })
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; code?: string },
  ) {
    return (this.prisma as any).division.update({
      where: { id },
      data: body,
    });
  }

  // Delete division (Admin only)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete division' })
  async delete(@Param('id') id: string) {
    await (this.prisma as any).division.delete({ where: { id } });
    return { message: 'Division deleted' };
  }

  // Assign user to division (Admin only)
  @Post(':id/users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign user to division' })
  async assignUser(
    @Param('id') divisionId: string,
    @Param('userId') userId: string,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { divisionId } as any,
      select: { id: true, name: true, email: true, divisionId: true } as any,
    });
  }

  // Remove user from division (Admin only)
  @Delete(':id/users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove user from division' })
  async removeUser(@Param('userId') userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { divisionId: null } as any,
      select: { id: true, name: true, email: true, divisionId: true } as any,
    });
  }

  // Assign course to division (Admin only)
  @Post(':id/courses/:courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign course to division' })
  async assignCourse(
    @Param('id') divisionId: string,
    @Param('courseId') courseId: string,
    @Body() body: { isMandatory?: boolean },
  ) {
    // First try to find existing record
    const existing = await (this.prisma as any).courseDivision.findUnique({
      where: {
        courseId_divisionId: { courseId, divisionId },
      },
    });

    if (existing) {
      // Update existing record
      return (this.prisma as any).courseDivision.update({
        where: {
          courseId_divisionId: { courseId, divisionId },
        },
        data: {
          isMandatory: body.isMandatory ?? false,
        },
      });
    } else {
      // Create new record
      return (this.prisma as any).courseDivision.create({
        data: {
          courseId,
          divisionId,
          isMandatory: body.isMandatory ?? false,
        },
      });
    }
  }

  // Remove course from division (Admin only)
  @Delete(':id/courses/:courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove course from division' })
  async removeCourse(
    @Param('id') divisionId: string,
    @Param('courseId') courseId: string,
  ) {
    await (this.prisma as any).courseDivision.delete({
      where: {
        courseId_divisionId: { courseId, divisionId },
      },
    });
    return { message: 'Course removed from division' };
  }
}
