import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CategoriesModule } from './categories/categories.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { CertificatesModule } from './certificates/certificates.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { DiscussionsModule } from './discussions/discussions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GamificationModule } from './gamification/gamification.module';
import { ChatModule } from './chat/chat.module';
import { DivisionsModule } from './divisions/divisions.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BadgesModule } from './badges/badges.module';
import { EmailModule } from './email/email.module';
import { LibraryModule } from './library/library.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ReviewsModule } from './reviews/reviews.module';
import { UploadsModule } from './uploads/uploads.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'), // Serve files from public folder
      serveRoot: '/', // Available at root level, e.g. /uploads/video.mp4
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    EmailModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    ModulesModule,
    LessonsModule,
    DashboardModule,
    CategoriesModule,
    EnrollmentsModule,
    CertificatesModule,
    QuizzesModule,
    AssignmentsModule,
    DiscussionsModule,
    NotificationsModule,
    GamificationModule,
    ChatModule,
    DivisionsModule,
    AnalyticsModule,
    BadgesModule,
    ReviewsModule,
    UploadsModule,
    LibraryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
