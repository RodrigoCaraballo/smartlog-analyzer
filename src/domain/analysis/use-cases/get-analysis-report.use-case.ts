import type { AnalysisStatus } from '../entities/analysis.entity';
import type { AnalysisReportOutput } from '../outputs/analysis-report.output';
import type { AnalysisRepository } from '../ports/analysis.repository';

export class GetAnalysisReportUseCase {
  constructor(private readonly repository: AnalysisRepository) {}

  async execute(id: string): Promise<AnalysisReportOutput | null> {
    const analysis = await this.repository.findById(id);
    if (!analysis) return null;

    const value = analysis.toPrimitives();
    return {
      id: value.id,
      status: value.status as AnalysisStatus,
      summary: value.summary,
      result: value.result,
      generatedAt: value.completedAt?.toISOString(),
    };
  }
}
