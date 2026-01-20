import { Module } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller';

@Module({
  controllers: [QuizzesController],
})
export class QuizzesModule {}
