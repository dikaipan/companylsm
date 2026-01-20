import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Quizzes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let adminToken: string;
  let testUserId: string;
  let testCourseId: string;
  let testQuizId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up test data
    await prisma.quizAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.questionOption.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.quiz.deleteMany({
      where: { title: { startsWith: 'E2E Test' } },
    });

    // Create test admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'e2e-admin@test.com' },
      update: {},
      create: {
        email: 'e2e-admin@test.com',
        password: '$2b$10$YourHashedPasswordHere', // Pre-hashed 'password123'
        name: 'E2E Admin',
        role: 'ADMIN',
      },
    });

    // Create test student user
    const studentUser = await prisma.user.upsert({
      where: { email: 'e2e-student@test.com' },
      update: {},
      create: {
        email: 'e2e-student@test.com',
        password: '$2b$10$YourHashedPasswordHere',
        name: 'E2E Student',
        role: 'STUDENT',
      },
    });
    testUserId = studentUser.id;

    // Create test course
    const course = await prisma.course.upsert({
      where: { id: 'e2e-test-course' },
      update: {},
      create: {
        id: 'e2e-test-course',
        title: 'E2E Test Course',
        instructorId: adminUser.id,
        status: 'PUBLISHED',
      },
    });
    testCourseId = course.id;

    // Login to get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2e-admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.access_token;

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2e-student@test.com', password: 'password123' });
    authToken = studentLogin.body.access_token;
  });

  afterAll(async () => {
    // Clean up
    await prisma.quizAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.questionOption.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.quiz.deleteMany({
      where: { title: { startsWith: 'E2E Test' } },
    });
    await app.close();
  });

  describe('Quiz CRUD Operations', () => {
    it('should create a quiz with questions (admin)', async () => {
      const response = await request(app.getHttpServer())
        .post('/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'E2E Test Quiz',
          description: 'A test quiz for e2e testing',
          passingScore: 70,
          courseId: testCourseId,
          questions: [
            {
              text: 'What is 2 + 2?',
              points: 1,
              options: [
                { text: '3', isCorrect: false },
                { text: '4', isCorrect: true },
                { text: '5', isCorrect: false },
              ],
            },
            {
              text: 'What is the capital of France?',
              points: 1,
              options: [
                { text: 'London', isCorrect: false },
                { text: 'Paris', isCorrect: true },
                { text: 'Berlin', isCorrect: false },
              ],
            },
          ],
        })
        .expect(201);

      expect(response.body.title).toBe('E2E Test Quiz');
      expect(response.body.questions).toHaveLength(2);
      testQuizId = response.body.id;
    });

    it('should get quiz by ID (student view - no correct answers)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/quizzes/${testQuizId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.title).toBe('E2E Test Quiz');
      expect(response.body.questions[0].options[0].isCorrect).toBeUndefined();
    });

    it('should get quiz by ID (admin view - with correct answers)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/quizzes/${testQuizId}/admin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.title).toBe('E2E Test Quiz');
      const hasCorrect = response.body.questions[0].options.some(
        (o: any) => o.isCorrect !== undefined,
      );
      expect(hasCorrect).toBe(true);
    });

    it('should get quizzes by course', async () => {
      const response = await request(app.getHttpServer())
        .get(`/quizzes/course/${testCourseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Quiz Attempt Flow', () => {
    let attemptId: string;
    let correctOptionId: string;
    let wrongOptionId: string;

    it('should start a quiz attempt', async () => {
      const response = await request(app.getHttpServer())
        .post(`/quizzes/${testQuizId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.id).toBeDefined();
      attemptId = response.body.id;
    });

    it('should return existing attempt if one is in progress', async () => {
      const response = await request(app.getHttpServer())
        .post(`/quizzes/${testQuizId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.id).toBe(attemptId);
    });

    it('should submit quiz with correct answers and pass', async () => {
      // Get quiz with admin view to get correct answers
      const quizResponse = await request(app.getHttpServer())
        .get(`/quizzes/${testQuizId}/admin`)
        .set('Authorization', `Bearer ${adminToken}`);

      const answers = quizResponse.body.questions.map((q: any) => ({
        questionId: q.id,
        optionId: q.options.find((o: any) => o.isCorrect).id,
      }));

      const response = await request(app.getHttpServer())
        .post(`/quizzes/${testQuizId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ attemptId, answers })
        .expect(201);

      expect(response.body.result.score).toBe(100);
      expect(response.body.result.passed).toBe(true);
    });

    it('should not allow resubmission of completed attempt', async () => {
      const response = await request(app.getHttpServer())
        .post(`/quizzes/${testQuizId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ attemptId, answers: [] })
        .expect(201);

      expect(response.body.error).toBe('Quiz already submitted');
    });

    it('should get user attempts', async () => {
      const response = await request(app.getHttpServer())
        .get(`/quizzes/${testQuizId}/attempts`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Quiz Management', () => {
    it('should update quiz settings', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/quizzes/${testQuizId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ passingScore: 80 })
        .expect(200);

      expect(response.body.passingScore).toBe(80);
    });

    it('should add a question to quiz', async () => {
      const response = await request(app.getHttpServer())
        .post(`/quizzes/${testQuizId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          text: 'New question',
          points: 2,
          options: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: false },
          ],
        })
        .expect(201);

      expect(response.body.text).toBe('New question');
      expect(response.body.points).toBe(2);
    });
  });
});
