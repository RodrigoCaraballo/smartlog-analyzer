import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckHealthUseCase, type HealthCheckOutput } from '../../../domain/health/use-cases/check-health.use-case';

@ApiTags('health')
@Controller('api/health')
export class HealthController {
  constructor(private readonly checkHealth: CheckHealthUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check API dependencies' })
  @ApiResponse({ status: 200, description: 'All dependencies are available' })
  @ApiResponse({ status: 503, description: 'One or more dependencies are unavailable' })
  async get(): Promise<HealthCheckOutput> {
    const result = await this.checkHealth.execute();
    if (result.status === 'degraded') throw new ServiceUnavailableException(result);
    return result;
  }
}
