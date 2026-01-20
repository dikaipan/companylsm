import {
  Controller,
  Get,
  UseGuards,
  Delete,
  Param,
  Patch,
  Body,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users (Admin only)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('divisions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all divisions' })
  getDivisions() {
    return this.usersService.getAllDivisions();
  }

  @Patch(':id/role')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  updateRole(@Param('id') id: string, @Body() body: { role: Role }) {
    return this.usersService.updateRole(id, body.role);
  }

  @Patch(':id/division')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user division (Admin only)' })
  updateDivision(
    @Param('id') id: string,
    @Body() body: { divisionId: string | null },
  ) {
    return this.usersService.updateDivision(id, body.divisionId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('import')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk import users from CSV' })
  async importUsers(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Manual CSV Parsing (since csv-parser install failed)
    const csvContent = file.buffer.toString('utf8');
    const lines = csvContent.split(/\r?\n/);
    const usersToCreate = [];

    // Skip header if present (simple check: if line 1 contains "email")
    const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');
      // Expected format: Name, Email, Password(optional), Role(optional)
      // Or: Name;Email... handling ; or ,

      // Basic support for quoting is hard manually, assuming simple CSV for now:
      // John Doe,john@example.com,password123,STUDENT

      const name = values[0]?.trim();
      const email = values[1]?.trim();
      const password = values[2]?.trim() || 'Welcome123!';
      const roleStr = values[3]?.trim().toUpperCase();

      // Validate mandatory fields
      if (!email || !email.includes('@')) continue;

      let role: Role = Role.STUDENT;
      if (roleStr === 'ADMIN') role = Role.ADMIN;
      if (roleStr === 'INSTRUCTOR') role = Role.INSTRUCTOR;

      usersToCreate.push({
        name: name || email.split('@')[0],
        email,
        password,
        role,
      });
    }

    return this.usersService.bulkCreate(usersToCreate);
  }
}
