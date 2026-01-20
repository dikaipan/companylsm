import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesController } from './quizzes.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('QuizzesController', () => {
  let controller: QuizzesController;
  let prismaService: PrismaService;

  const mockPrismaService = {
    quiz: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    question: {
      create: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    quizAttempt: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    quizAnswer: {
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizzesController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<QuizzesController>(QuizzesController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a quiz with questions', async () => {
      const quizData = {
        title: 'Test Quiz',
        description: 'A test quiz',
        passingScore: 70,
        courseId: 'course-123',
        questions: [
          {
            text: 'Question 1',
            points: 1,
            options: [
              { text: 'Option A', isCorrect: true },
              { text: 'Option B', isCorrect: false },
            ],
          },
        ],
      };

      const expectedQuiz = {
        id: 'quiz-123',
        ...quizData,
        questions: [
          {
            id: 'question-1',
            text: 'Question 1',
            order: 0,
            points: 1,
            options: [
              { id: 'opt-1', text: 'Option A', isCorrect: true },
              { id: 'opt-2', text: 'Option B', isCorrect: false },
            ],
          },
        ],
      };

      mockPrismaService.quiz.create.mockResolvedValue(expectedQuiz);

      const result = await controller.create(quizData);

      expect(result).toEqual(expectedQuiz);
      expect(mockPrismaService.quiz.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Quiz',
          passingScore: 70,
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('should return a quiz without correct answers for students', async () => {
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Test Quiz',
        questions: [
          {
            id: 'q-1',
            text: 'Question 1',
            options: [
              { id: 'opt-1', text: 'Option A' },
              { id: 'opt-2', text: 'Option B' },
            ],
          },
        ],
      };

      mockPrismaService.quiz.findUnique.mockResolvedValue(mockQuiz);

      const result = await controller.findOne('quiz-123', {
        user: { userId: 'user-1' },
      });

      expect(result).toEqual(mockQuiz);
      expect(mockPrismaService.quiz.findUnique).toHaveBeenCalledWith({
        where: { id: 'quiz-123' },
        include: expect.objectContaining({
          questions: expect.any(Object),
        }),
      });
    });
  });

  describe('findOneAdmin', () => {
    it('should return a quiz with correct answers for admin', async () => {
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Test Quiz',
        questions: [
          {
            id: 'q-1',
            text: 'Question 1',
            options: [
              { id: 'opt-1', text: 'Option A', isCorrect: true },
              { id: 'opt-2', text: 'Option B', isCorrect: false },
            ],
          },
        ],
      };

      mockPrismaService.quiz.findUnique.mockResolvedValue(mockQuiz);

      const result = await controller.findOneAdmin('quiz-123');

      expect(result).toEqual(mockQuiz);
    });
  });

  describe('findByCourse', () => {
    it('should return all quizzes for a course', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Quiz 1',
          _count: { questions: 5, attempts: 10 },
        },
        {
          id: 'quiz-2',
          title: 'Quiz 2',
          _count: { questions: 3, attempts: 5 },
        },
      ];

      mockPrismaService.quiz.findMany.mockResolvedValue(mockQuizzes);

      const result = await controller.findByCourse('course-123');

      expect(result).toEqual(mockQuizzes);
      expect(mockPrismaService.quiz.findMany).toHaveBeenCalledWith({
        where: { courseId: 'course-123' },
        include: { _count: { select: { questions: true, attempts: true } } },
      });
    });
  });

  describe('startAttempt', () => {
    it('should return existing incomplete attempt if one exists', async () => {
      const existingAttempt = {
        id: 'attempt-1',
        userId: 'user-1',
        quizId: 'quiz-123',
        completedAt: null,
      };

      mockPrismaService.quizAttempt.findFirst.mockResolvedValue(
        existingAttempt,
      );

      const result = await controller.startAttempt('quiz-123', {
        user: { userId: 'user-1' },
      });

      expect(result).toEqual(existingAttempt);
      expect(mockPrismaService.quizAttempt.create).not.toHaveBeenCalled();
    });

    it('should create a new attempt if no incomplete attempt exists', async () => {
      const newAttempt = {
        id: 'attempt-2',
        userId: 'user-1',
        quizId: 'quiz-123',
      };

      mockPrismaService.quizAttempt.findFirst.mockResolvedValue(null);
      mockPrismaService.quizAttempt.create.mockResolvedValue(newAttempt);

      const result = await controller.startAttempt('quiz-123', {
        user: { userId: 'user-1' },
      });

      expect(result).toEqual(newAttempt);
      expect(mockPrismaService.quizAttempt.create).toHaveBeenCalled();
    });
  });

  describe('submitQuiz', () => {
    const mockQuiz = {
      id: 'quiz-123',
      passingScore: 70,
      questions: [
        {
          id: 'q-1',
          points: 1,
          options: [
            { id: 'opt-1', isCorrect: true },
            { id: 'opt-2', isCorrect: false },
          ],
        },
        {
          id: 'q-2',
          points: 1,
          options: [
            { id: 'opt-3', isCorrect: true },
            { id: 'opt-4', isCorrect: false },
          ],
        },
      ],
    };

    it('should return error for invalid attempt', async () => {
      mockPrismaService.quizAttempt.findFirst.mockResolvedValue(null);

      const result = await controller.submitQuiz(
        'quiz-123',
        { user: { userId: 'user-1' } },
        { attemptId: 'invalid', answers: [] },
      );

      expect(result).toEqual({ error: 'Invalid attempt' });
    });

    it('should return error for already submitted quiz', async () => {
      mockPrismaService.quizAttempt.findFirst.mockResolvedValue({
        id: 'attempt-1',
        completedAt: new Date(),
      });

      const result = await controller.submitQuiz(
        'quiz-123',
        { user: { userId: 'user-1' } },
        { attemptId: 'attempt-1', answers: [] },
      );

      expect(result).toEqual({ error: 'Quiz already submitted' });
    });

    it('should calculate score correctly with all correct answers', async () => {
      mockPrismaService.quizAttempt.findFirst.mockResolvedValue({
        id: 'attempt-1',
        userId: 'user-1',
        quizId: 'quiz-123',
        completedAt: null,
      });
      mockPrismaService.quiz.findUnique.mockResolvedValue(mockQuiz);
      mockPrismaService.quizAnswer.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.quizAttempt.update.mockResolvedValue({
        id: 'attempt-1',
        score: 100,
        passed: true,
        completedAt: new Date(),
      });

      const result = await controller.submitQuiz(
        'quiz-123',
        { user: { userId: 'user-1' } },
        {
          attemptId: 'attempt-1',
          answers: [
            { questionId: 'q-1', optionId: 'opt-1' },
            { questionId: 'q-2', optionId: 'opt-3' },
          ],
        },
      );

      expect((result as any).result.score).toBe(100);
      expect((result as any).result.passed).toBe(true);
      expect((result as any).result.correctCount).toBe(2);
    });

    it('should calculate score correctly with some wrong answers', async () => {
      mockPrismaService.quizAttempt.findFirst.mockResolvedValue({
        id: 'attempt-1',
        userId: 'user-1',
        quizId: 'quiz-123',
        completedAt: null,
      });
      mockPrismaService.quiz.findUnique.mockResolvedValue(mockQuiz);
      mockPrismaService.quizAnswer.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.quizAttempt.update.mockResolvedValue({
        id: 'attempt-1',
        score: 50,
        passed: false,
        completedAt: new Date(),
      });

      const result = await controller.submitQuiz(
        'quiz-123',
        { user: { userId: 'user-1' } },
        {
          attemptId: 'attempt-1',
          answers: [
            { questionId: 'q-1', optionId: 'opt-1' }, // correct
            { questionId: 'q-2', optionId: 'opt-4' }, // wrong
          ],
        },
      );

      expect((result as any).result.score).toBe(50);
      expect((result as any).result.passed).toBe(false);
      expect((result as any).result.correctCount).toBe(1);
    });
  });

  describe('update', () => {
    it('should update quiz settings', async () => {
      const updatedQuiz = {
        id: 'quiz-123',
        title: 'Updated Title',
        passingScore: 80,
      };

      mockPrismaService.quiz.update.mockResolvedValue(updatedQuiz);

      const result = await controller.update('quiz-123', {
        title: 'Updated Title',
        passingScore: 80,
      });

      expect(result).toEqual(updatedQuiz);
    });
  });

  describe('delete', () => {
    it('should delete a quiz', async () => {
      const deletedQuiz = { id: 'quiz-123' };

      mockPrismaService.quiz.delete.mockResolvedValue(deletedQuiz);

      const result = await controller.delete('quiz-123');

      expect(result).toEqual(deletedQuiz);
      expect(mockPrismaService.quiz.delete).toHaveBeenCalledWith({
        where: { id: 'quiz-123' },
      });
    });
  });

  describe('addQuestion', () => {
    it('should add a question to a quiz', async () => {
      const newQuestion = {
        id: 'question-new',
        text: 'New Question',
        order: 2,
        points: 2,
        options: [
          { id: 'opt-1', text: 'A', isCorrect: true },
          { id: 'opt-2', text: 'B', isCorrect: false },
        ],
      };

      mockPrismaService.question.count.mockResolvedValue(2);
      mockPrismaService.question.create.mockResolvedValue(newQuestion);

      const result = await controller.addQuestion('quiz-123', {
        text: 'New Question',
        points: 2,
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
        ],
      });

      expect(result).toEqual(newQuestion);
      expect(mockPrismaService.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          text: 'New Question',
          order: 2,
          points: 2,
          quizId: 'quiz-123',
        }),
        include: { options: true },
      });
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a question', async () => {
      const deletedQuestion = { id: 'question-1' };

      mockPrismaService.question.delete.mockResolvedValue(deletedQuestion);

      const result = await controller.deleteQuestion('question-1');

      expect(result).toEqual(deletedQuestion);
      expect(mockPrismaService.question.delete).toHaveBeenCalledWith({
        where: { id: 'question-1' },
      });
    });
  });
});
