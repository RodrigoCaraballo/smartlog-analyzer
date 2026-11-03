import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalysisStatus, type AnalysisResult } from '../../../../domain/analysis/entities/analysis.entity';

export class AnalysisResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: AnalysisStatus }) status!: AnalysisStatus;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiPropertyOptional({ format: 'date-time' }) completedAt?: string;
  @ApiProperty() filters!: Record<string, unknown>;
  @ApiPropertyOptional() model?: string;
  @ApiPropertyOptional() summary?: string;
  @ApiPropertyOptional() result?: AnalysisResult;
  @ApiPropertyOptional() errorCode?: string;
  @ApiProperty({ type: [String] }) logIds!: string[];
}
