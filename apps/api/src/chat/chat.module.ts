import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { JwtModule } from '@nestjs/jwt'; // Needed for token verification in gateway

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'super-secret', // Should match AuthModule config or use global config
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService],
})
export class ChatModule { }
