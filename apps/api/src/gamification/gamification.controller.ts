import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GamificationService } from './gamification.service';

@ApiTags('gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
    constructor(private gamificationService: GamificationService) { }

    @Get('leaderboard')
    @ApiOperation({ summary: 'Get global leaderboard' })
    async getLeaderboard() {
        return this.gamificationService.getLeaderboard();
    }

    @Get('my-rank')
    @ApiOperation({ summary: 'Get current user rank and stats' })
    async getMyRank(@Request() req: any) {
        return this.gamificationService.getMyRank(req.user.userId);
    }
}
