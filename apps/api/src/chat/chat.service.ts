import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async saveMessage(senderId: string, receiverId: string, message: string) {
        return (this.prisma as any).chatMessage.create({
            data: {
                senderId,
                receiverId,
                message,
            },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
            },
        });
    }

    async getMessages(userId1: string, userId2: string) {
        return (this.prisma as any).chatMessage.findMany({
            where: {
                OR: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 },
                ],
            },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
            },
        });
    }

    async getMyConversations(userId: string) {
        // Determine unique users interacted with
        const sent = await (this.prisma as any).chatMessage.findMany({
            where: { senderId: userId },
            select: { receiverId: true },
            distinct: ['receiverId'],
        });

        const received = await (this.prisma as any).chatMessage.findMany({
            where: { receiverId: userId },
            select: { senderId: true },
            distinct: ['senderId'],
        });

        const contactIds = new Set([
            ...sent.map((m: any) => m.receiverId).filter((id: any) => id !== null),
            ...received.map((m: any) => m.senderId)
        ]);

        const users = await (this.prisma as any).user.findMany({
            where: { id: { in: Array.from(contactIds) as string[] } },
            select: { id: true, name: true, avatar: true, role: true },
        });

        return users;
    }

    async getSupportAgent() {
        // Find a user with ADMIN role to act as support
        return (this.prisma as any).user.findFirst({
            where: { role: 'ADMIN' },
            select: { id: true, name: true, avatar: true }
        });
    }

    async getUnreadCount(userId: string) {
        return (this.prisma as any).chatMessage.count({
            where: {
                receiverId: userId,
                read: false,
            }
        });
    }

    async markAsRead(userId: string, senderId: string) {
        return (this.prisma as any).chatMessage.updateMany({
            where: {
                receiverId: userId,
                senderId: senderId,
                read: false,
            },
            data: {
                read: true,
            },
        });
    }
}
