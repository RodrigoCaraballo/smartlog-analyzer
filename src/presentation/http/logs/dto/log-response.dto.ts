import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogLevel, type LogMetadata } from '../../../../domain/logs/entities/log.entity';

export class LogResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() service!: string;
  @ApiProperty({ enum: LogLevel }) level!: LogLevel;
  @ApiProperty() message!: string;
  @ApiProperty({ format: 'date-time' }) timestamp!: string;
  @ApiProperty({ format: 'date-time' }) receivedAt!: string;
  @ApiPropertyOptional() traceId?: string;
  @ApiProperty() metadata!: LogMetadata;
}
