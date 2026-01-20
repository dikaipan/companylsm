import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { LibraryService } from './library.service';

@ApiTags('library')
@Controller('library')
export class LibraryController {
    constructor(private libraryService: LibraryService) { }

    // ======== RESOURCES ========

    @Get('resources')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all resources' })
    @ApiQuery({ name: 'type', required: false })
    @ApiQuery({ name: 'categoryId', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'featured', required: false })
    async findAllResources(
        @Request() req: any,
        @Query('type') type?: string,
        @Query('categoryId') categoryId?: string,
        @Query('search') search?: string,
        @Query('featured') featured?: string,
    ) {
        return this.libraryService.findAllResources({
            type,
            categoryId,
            search,
            featured: featured === 'true' ? true : undefined,
            userId: req.user.userId,
            userDivisionId: req.user.divisionId,
            userRole: req.user.role,
        });
    }

    @Get('resources/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get resource by ID' })
    async findOneResource(@Param('id') id: string) {
        return this.libraryService.findOneResource(id);
    }

    @Post('resources/:id/view')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Record resource view (5 seconds delay)' })
    async recordView(@Param('id') id: string, @Request() req: any) {
        return this.libraryService.recordView(id, req.user.userId);
    }

    @Post('resources')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.INSTRUCTOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create resource (Admin/Instructor)' })
    async createResource(
        @Body()
        body: {
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
        },
    ) {
        return this.libraryService.createResource(body);
    }

    @Patch('resources/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.INSTRUCTOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update resource' })
    async updateResource(@Param('id') id: string, @Body() body: any) {
        return this.libraryService.updateResource(id, body);
    }

    @Delete('resources/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete resource' })
    async deleteResource(@Param('id') id: string) {
        return this.libraryService.deleteResource(id);
    }

    @Post('resources/:id/download')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Increment download count' })
    async incrementDownload(@Param('id') id: string, @Request() req: any) {
        return this.libraryService.incrementDownload(id, req.user.userId);
    }

    // ======== CATEGORIES ========

    @Get('categories')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all categories' })
    async findAllCategories() {
        return this.libraryService.findAllCategories();
    }

    @Post('categories')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create category' })
    async createCategory(
        @Body() body: { name: string; description?: string; icon?: string },
    ) {
        return this.libraryService.createCategory(body);
    }

    @Patch('categories/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update category' })
    async updateCategory(@Param('id') id: string, @Body() body: any) {
        return this.libraryService.updateCategory(id, body);
    }

    @Delete('categories/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete category' })
    async deleteCategory(@Param('id') id: string) {
        return this.libraryService.deleteCategory(id);
    }

    // ======== BOOKMARKS ========

    @Get('bookmarks')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my bookmarks' })
    async getMyBookmarks(@Request() req: any) {
        return this.libraryService.getUserBookmarks(req.user.userId);
    }

    @Post('resources/:id/bookmark')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle bookmark' })
    async toggleBookmark(@Param('id') id: string, @Request() req: any) {
        return this.libraryService.toggleBookmark(req.user.userId, id);
    }

    @Get('resources/:id/bookmark')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check if bookmarked' })
    async isBookmarked(@Param('id') id: string, @Request() req: any) {
        return this.libraryService.isBookmarked(req.user.userId, id);
    }

    // ======== PROGRESS ========

    @Get('resources/:id/progress')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get reading progress' })
    async getProgress(@Param('id') id: string, @Request() req: any) {
        return this.libraryService.getProgress(req.user.userId, id);
    }

    @Patch('resources/:id/progress')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update reading progress' })
    async updateProgress(
        @Param('id') id: string,
        @Request() req: any,
        @Body() body: { progress?: number; lastPage?: number; lastPosition?: number },
    ) {
        return this.libraryService.updateProgress(req.user.userId, id, body);
    }
}
