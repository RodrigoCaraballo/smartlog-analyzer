import { BadRequestException, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, ParseUUIDPipe, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ScheduleLogAnalysisUseCase } from '../../../domain/analysis/use-cases/schedule-log-analysis.use-case';
import { GetAnalysisUseCase } from '../../../domain/analysis/use-cases/get-analysis.use-case';
import type { AnalyzeLogsInput } from '../../../domain/analysis/inputs/analyze-logs.input';
import { AnalyzeLogsDto } from '../logs/dto/analyze-logs.dto';
import { AnalysisResponseDto } from '../logs/dto/analysis-response.dto';
import type { ScheduledAnalysisOutput } from '../../../domain/analysis/outputs/scheduled-analysis.output';
import { GetAnalysisReportUseCase } from '../../../domain/analysis/use-cases/get-analysis-report.use-case';
import type { AnalysisReportOutput } from '../../../domain/analysis/outputs/analysis-report.output';

@ApiTags('analysis')
@Controller('api')
export class AnalysisController {
  constructor(
    private readonly schedule: ScheduleLogAnalysisUseCase,
    private readonly getAnalysis: GetAnalysisUseCase,
    private readonly getReport: GetAnalysisReportUseCase,
  ) {}

  @Post('logs/analyze')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Schedule an asynchronous log analysis' })
  @ApiResponse({ status: 202, description: 'Analysis scheduled' })
  @ApiResponse({ status: 400, description: 'Invalid selection' })
  async analyze(@Body() dto: AnalyzeLogsDto): Promise<ScheduledAnalysisOutput> {
    const input: AnalyzeLogsInput = {
      logIds: dto.logIds,
      filters: dto.filters ? {
        service: dto.filters.service,
        level: dto.filters.level,
        from: dto.filters.from ? new Date(dto.filters.from) : undefined,
        to: dto.filters.to ? new Date(dto.filters.to) : undefined,
      } : undefined,
    };

    try {
      return await this.schedule.execute(input);
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('required') ||
        error.message.includes('matched') ||
        error.message.includes('more than 100')
      )) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get('analysis/:id')
  @ApiOperation({ summary: 'Get analysis status and result' })
  @ApiResponse({ status: 200, type: AnalysisResponseDto })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async get(@Param('id', new ParseUUIDPipe()) id: string): Promise<AnalysisResponseDto> {
    const analysis = await this.getAnalysis.execute(id);
    if (!analysis) throw new NotFoundException('Analysis not found');
    return analysis;
  }

  @Get('analysis/:id/report')
  @ApiOperation({ summary: 'Get the generated analysis report' })
  @ApiResponse({ status: 200, description: 'Analysis report generated' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async report(@Param('id', new ParseUUIDPipe()) id: string): Promise<AnalysisReportOutput> {
    const report = await this.getReport.execute(id);
    if (!report) throw new NotFoundException('Analysis not found');
    return report;
  }
}
