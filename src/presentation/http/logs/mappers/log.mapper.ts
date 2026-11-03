import type { LogOutput } from '../../../../domain/logs/outputs/log.output';
import type { PaginatedLogsOutput } from '../../../../domain/logs/outputs/paginated-logs.output';
import type { LogResponseDto } from '../dto/log-response.dto';
import type { PaginatedLogsResponseDto } from '../dto/paginated-logs-response.dto';
import type { AnalysisOutput } from '../../../../domain/analysis/outputs/analysis.output';
import type { AnalysisResponseDto } from '../dto/analysis-response.dto';

export class LogMapper {
  static toResponse(output: LogOutput): LogResponseDto {
    return output;
  }

  static toPaginatedResponse(output: PaginatedLogsOutput): PaginatedLogsResponseDto {
    return {
      ...output,
      items: output.items.map((item) => LogMapper.toResponse(item)),
    };
  }

  static toAnalysisResponse(output: AnalysisOutput): AnalysisResponseDto {
    return output;
  }
}
