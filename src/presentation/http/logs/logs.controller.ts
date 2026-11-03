import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateLogUseCase } from '../../../domain/logs/use-cases/create-log.use-case';
import { ListLogsUseCase } from '../../../domain/logs/use-cases/list-logs.use-case';
import { CreateLogDto } from './dto/create-log.dto';
import { ListLogsQueryDto } from './dto/list-logs.query.dto';
import { LogResponseDto } from './dto/log-response.dto';
import { PaginatedLogsResponseDto } from './dto/paginated-logs-response.dto';
import { LogMapper } from './mappers/log.mapper';

@ApiTags('logs')
@Controller('api/logs')
export class LogsController {
  constructor(
    private readonly createLog: CreateLogUseCase,
    private readonly listLogs: ListLogsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List logs with filters and pagination' })
  @ApiResponse({ status: 200, type: PaginatedLogsResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid filters or pagination' })
  async list(@Query() query: ListLogsQueryDto): Promise<PaginatedLogsResponseDto> {
    const output = await this.listLogs.execute({
      service: query.service,
      level: query.level,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      limit: query.limit,
    });

    return LogMapper.toPaginatedResponse(output);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingest a structured log' })
  @ApiResponse({ status: 201, type: LogResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid log payload' })
  async create(@Body() dto: CreateLogDto): Promise<LogResponseDto> {
    const output = await this.createLog.execute({
      service: dto.service,
      level: dto.level,
      message: dto.message,
      timestamp: new Date(dto.timestamp),
      traceId: dto.traceId,
      metadata: dto.metadata,
    });

    return LogMapper.toResponse(output);
  }
}
