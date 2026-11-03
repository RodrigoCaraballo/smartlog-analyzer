import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { LogLevel, LOG_LEVELS, type LogMetadata } from '../../../../domain/logs/entities/log.entity';

export class CreateLogDto {
  @ApiProperty({ example: 'payments' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  service!: string;

  @ApiProperty({ enum: LogLevel, example: LogLevel.ERROR })
  @IsEnum(LogLevel, { message: `level must be one of: ${LOG_LEVELS.join(', ')}` })
  level!: LogLevel;

  @ApiProperty({ example: 'Connection timeout' })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  message!: string;

  @ApiProperty({ example: '2026-11-02T14:00:00.000Z', format: 'date-time' })
  @IsDateString()
  timestamp!: string;

  @ApiPropertyOptional({ example: 'trace-123' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  traceId?: string;

  @ApiPropertyOptional({ example: { endpoint: '/payments', durationMs: 3000 } })
  @IsOptional()
  @IsObject()
  metadata?: LogMetadata;
}
