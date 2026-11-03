import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { StructuredLogger } from './infrastructure/logging/structured.logger';
import { StructuredRequestLoggingInterceptor } from './presentation/http/logging/structured-request-logging.interceptor';

async function bootstrap() {
  const logger = new StructuredLogger();
  const app = await NestFactory.create(AppModule, { logger });
  app.setGlobalPrefix('');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new StructuredRequestLoggingInterceptor(logger));
  const config = new DocumentBuilder().setTitle('SmartLog Analyzer').setVersion('1.0').build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
