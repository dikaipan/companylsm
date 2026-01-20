import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
    constructor(private chatService: ChatService) { }

    @Get('messages/:userId')
    @ApiOperation({ summary: 'Get conversation history with a user' })
    async getMessages(@Request() req: any, @Param('userId') otherUserId: string) {
        return this.chatService.getMessages(req.user.userId, otherUserId);
    }

    @Get('contacts')
    @ApiOperation({ summary: 'Get list of people I have chatted with' })
    async getContacts(@Request() req: any) {
        return this.chatService.getMyConversations(req.user.userId);
    }

    @Get('support-agent')
    @ApiOperation({ summary: 'Get the default support agent (Admin)' })
    async getSupportAgent() {
        return this.chatService.getSupportAgent();
    }

    @Get('unread')
    @ApiOperation({ summary: 'Get total unread messages count' })
    async getUnreadCount(@Request() req: any) {
        const count = await this.chatService.getUnreadCount(req.user.userId);
        return { count };
    }

    @Get('read/:senderId')
    @ApiOperation({ summary: 'Mark messages from a sender as read' })
    async markAsRead(@Request() req: any, @Param('senderId') senderId: string) {
        return this.chatService.markAsRead(req.user.userId, senderId);
    }
}
