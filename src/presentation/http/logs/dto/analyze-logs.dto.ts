import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { LogLevel } from '../../../../domain/logs/entities/log.entity';

export class AnalyzeLogsFiltersDto {
  @ApiPropertyOptional({ example: 'payments' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  service?: string;

  @ApiPropertyOptional({ enum: LogLevel })
  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AnalyzeLogsDto {
  @ApiPropertyOptional({ type: [String], maxItems: 100 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  logIds?: string[];

  @ApiPropertyOptional({ type: AnalyzeLogsFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AnalyzeLogsFiltersDto)
  filters?: AnalyzeLogsFiltersDto;
}
