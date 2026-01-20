import { Test, TestingModule } from '@nestjs/testing';
import { DiscussionsController } from './discussions.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('DiscussionsController', () => {
  let controller: DiscussionsController;
  let prisma: PrismaService;

  const mockPrisma = {
    discussion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockUser = {
    userId: 'user-1',
    email: 'test@test.com',
    role: 'STUDENT',
    name: 'Test User',
  };
  const mockAdmin = {
    userId: 'admin-1',
    email: 'admin@test.com',
    role: 'ADMIN',
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscussionsController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    controller = module.get<DiscussionsController>(DiscussionsController);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a discussion post', async () => {
      const createDto = { content: 'Hello world', courseId: 'course-1' };
      const expected = { id: 'disc-1', ...createDto, userId: mockUser.userId };

      mockPrisma.discussion.create.mockResolvedValue(expected);

      const result = await controller.create(
        { user: mockUser },
        createDto as any,
      );
      expect(result).toEqual(expected);
      expect(mockPrisma.discussion.create).toHaveBeenCalledWith({
        data: {
          content: createDto.content,
          courseId: createDto.courseId,
          userId: mockUser.userId,
          parentId: undefined,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    });
  });

  describe('findByCourse', () => {
    it('should return discussions for a course', async () => {
      const discussions = [
        {
          id: 'disc-1',
          content: 'Post 1',
          user: { name: 'User 1' },
          replies: [],
        },
        {
          id: 'disc-2',
          content: 'Post 2',
          user: { name: 'User 2' },
          replies: [],
        },
      ];

      mockPrisma.discussion.findMany.mockResolvedValue(discussions);

      const result = await controller.findByCourse('course-1');
      expect(result).toEqual(discussions);
      expect(mockPrisma.discussion.findMany).toHaveBeenCalledWith({
        where: { courseId: 'course-1', parentId: null },
        include: {
          user: { select: { id: true, name: true, email: true } },
          replies: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { replies: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single discussion', async () => {
      const discussion = {
        id: 'disc-1',
        content: 'Post',
        user: { name: 'User' },
      };
      mockPrisma.discussion.findUnique.mockResolvedValue(discussion);

      const result = await controller.findOne('disc-1');
      expect(result).toEqual(discussion);
    });

    it('should return error if not found', async () => {
      mockPrisma.discussion.findUnique.mockResolvedValue(null);

      const result = await controller.findOne('invalid-id');
      expect(result).toBeNull();
    });
  });

  describe('reply', () => {
    it('should create a reply to a discussion', async () => {
      const parent = {
        id: 'disc-1',
        courseId: 'course-1',
        content: 'Original Post',
        userId: 'other-user',
      };
      const replyDto = { content: 'This is a reply' };
      const expected = { id: 'disc-2', ...replyDto, parentId: 'disc-1' };

      mockPrisma.discussion.findUnique.mockResolvedValue(parent);
      mockPrisma.discussion.create.mockResolvedValue(expected);

      const result = await controller.reply(
        'disc-1',
        { user: mockUser },
        replyDto as any,
      );
      expect(result).toEqual(expected);
    });

    it('should return error if parent not found', async () => {
      mockPrisma.discussion.findUnique.mockResolvedValue(null);

      const result = await controller.reply(
        'invalid-id',
        { user: mockUser },
        { content: 'Reply' } as any,
      );
      expect(result).toEqual({ error: 'Discussion not found' });
    });
  });

  describe('delete', () => {
    it('should allow owner to delete their post', async () => {
      const discussion = { id: 'disc-1', userId: mockUser.userId };
      mockPrisma.discussion.findUnique.mockResolvedValue(discussion);
      mockPrisma.discussion.delete.mockResolvedValue(discussion);

      const result = await controller.delete('disc-1', { user: mockUser });
      expect(result).toEqual(discussion);
    });

    it('should allow admin to delete any post', async () => {
      const discussion = { id: 'disc-1', userId: 'other-user' };
      mockPrisma.discussion.findUnique.mockResolvedValue(discussion);
      mockPrisma.discussion.delete.mockResolvedValue(discussion);

      const result = await controller.delete('disc-1', { user: mockAdmin });
      expect(result).toEqual(discussion);
    });

    it('should not allow non-owner non-admin to delete', async () => {
      const discussion = { id: 'disc-1', userId: 'other-user' };
      mockPrisma.discussion.findUnique.mockResolvedValue(discussion);

      const result = await controller.delete('disc-1', { user: mockUser });
      expect(result).toEqual({ error: 'Not authorized to delete this discussion' });
    });
  });
});
