import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(
        private chatService: ChatService,
        private jwtService: JwtService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            client.data.userId = payload.sub; // Save userId to socket
            client.join(payload.sub); // Join room named after userId
            console.log(`Client connected: ${payload.sub}`);
        } catch (e) {
            console.error('WebSocket connection error:', e.message);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.data.userId}`);
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { receiverId: string; message: string },
    ) {
        const senderId = client.data.userId;
        if (!senderId) return;

        // Save to DB
        const savedMessage = await this.chatService.saveMessage(
            senderId,
            payload.receiverId,
            payload.message,
        );

        // Emit to receiver
        this.server.to(payload.receiverId).emit('newMessage', savedMessage);

        // Emit back to sender (for confirmation/optimistic update sync)
        // client.emit('messageSent', savedMessage);

        return savedMessage;
    }

    @SubscribeMessage('typing')
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { receiverId: string }
    ) {
        this.server.to(payload.receiverId).emit('typing', { senderId: client.data.userId });
    }
}
