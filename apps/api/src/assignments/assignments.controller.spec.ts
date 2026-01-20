import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsController } from './assignments.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('AssignmentsController', () => {
  let controller: AssignmentsController;
  let prisma: PrismaService;

  const mockPrisma = {
    assignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    submission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockUser = {
    userId: 'user-1',
    email: 'test@test.com',
    role: 'STUDENT',
  };
  const mockAdmin = {
    userId: 'admin-1',
    email: 'admin@test.com',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<AssignmentsController>(AssignmentsController);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an assignment', async () => {
      const createDto = { title: 'Test Assignment', lessonId: 'lesson-1' };
      const expected = { id: 'assignment-1', ...createDto };

      mockPrisma.assignment.create.mockResolvedValue(expected);

      const result = await controller.create(createDto as any);
      expect(result).toEqual(expected);
      expect(mockPrisma.assignment.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('findByLesson', () => {
    it('should return assignments for a lesson', async () => {
      const assignments = [
        { id: 'assignment-1', title: 'Assignment 1' },
        { id: 'assignment-2', title: 'Assignment 2' },
      ];

      mockPrisma.assignment.findMany.mockResolvedValue(assignments);

      const result = await controller.findByLesson('lesson-1');
      expect(result).toEqual(assignments);
      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith({
        where: { lessonId: 'lesson-1' },
        include: { _count: { select: { submissions: true } } },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single assignment', async () => {
      const assignment = {
        id: 'assignment-1',
        title: 'Test',
        lesson: { id: 'l1' },
      };
      mockPrisma.assignment.findUnique.mockResolvedValue(assignment);

      const result = await controller.findOne('assignment-1', {
        user: mockUser,
      });
      expect(result).toEqual(assignment);
    });

    it('should return null if assignment not found', async () => {
      mockPrisma.assignment.findUnique.mockResolvedValue(null);

      const result = await controller.findOne('invalid-id', { user: mockUser });
      expect(result).toBeNull();
    });
  });

  describe('submit', () => {
    it('should create a submission', async () => {
      const submitDto = { content: 'My answer' };
      const submission = { id: 'sub-1', ...submitDto, userId: mockUser.userId };

      mockPrisma.submission.findFirst.mockResolvedValue(null);
      mockPrisma.submission.create.mockResolvedValue(submission);

      const result = await controller.submit(
        'assignment-1',
        { user: mockUser },
        submitDto,
      );
      expect(result).toEqual(submission);
    });
  });

  describe('getSubmissions', () => {
    it('should return all submissions for an assignment', async () => {
      const submissions = [
        { id: 'sub-1', content: 'Answer 1', user: { name: 'User 1' } },
        { id: 'sub-2', content: 'Answer 2', user: { name: 'User 2' } },
      ];

      mockPrisma.submission.findMany.mockResolvedValue(submissions);

      const result = await controller.getSubmissions('assignment-1');
      expect(result).toEqual(submissions);
    });
  });

  describe('getMySubmission', () => {
    it('should return user submission', async () => {
      const submission = { id: 'sub-1', content: 'My answer' };
      mockPrisma.submission.findFirst.mockResolvedValue(submission);

      const result = await controller.getMySubmission('assignment-1', {
        user: mockUser,
      });
      expect(result).toEqual(submission);
    });

    it('should return null if no submission', async () => {
      mockPrisma.submission.findFirst.mockResolvedValue(null);

      const result = await controller.getMySubmission('assignment-1', {
        user: mockUser,
      });
      expect(result).toBeNull();
    });
  });

  describe('grade', () => {
    it('should grade a submission', async () => {
      const gradeDto = { score: 85, feedback: 'Good work!' };
      const graded = { id: 'sub-1', ...gradeDto };

      mockPrisma.submission.update.mockResolvedValue(graded);

      const result = await controller.grade('sub-1', gradeDto as any);
      expect(result).toEqual(graded);
    });
  });

  describe('delete', () => {
    it('should delete an assignment', async () => {
      mockPrisma.assignment.delete.mockResolvedValue({ id: 'assignment-1' });

      const result = await controller.delete('assignment-1');
      expect(result).toEqual({ message: 'Assignment deleted' });
    });
  });
});
