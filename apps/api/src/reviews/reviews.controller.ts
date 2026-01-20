import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '@prisma/client';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review' })
  create(
    @Request() req: any,
    @Body() body: { courseId: string; rating: number; comment?: string },
  ) {
    return this.reviewsService.create(req.user.id, body);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get reviews for a course' })
  async getByCourse(@Param('courseId') courseId: string) {
    const reviews = await this.reviewsService.findAllByCourse(courseId);
    // Calculate average
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average =
      reviews.length > 0 ? (total / reviews.length).toFixed(1) : 0;

    return {
      average: Number(average),
      count: reviews.length,
      reviews,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  remove(@Request() req: any, @Param('id') id: string) {
    const isAdmin = req.user.role === Role.ADMIN;
    return this.reviewsService.remove(id, req.user.id, isAdmin);
  }
}
