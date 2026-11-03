import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PresentationModule } from './presentation/presentation.module';
import { WorkerModule } from './infrastructure/queue/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PresentationModule,
    ...(process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID
      ? []
      : [WorkerModule]),
  ],
})
export class AppModule {}
