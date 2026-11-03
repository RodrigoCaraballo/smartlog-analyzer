import type { AnalysisOutput } from '../outputs/analysis.output';
import type { AnalysisRepository } from '../ports/analysis.repository';

export class GetAnalysisUseCase {
  constructor(private readonly repository: AnalysisRepository) {}

  async execute(id: string): Promise<AnalysisOutput | null> {
    const analysis = await this.repository.findById(id);
    if (!analysis) return null;
    const value = analysis.toPrimitives();
    return {
      id: value.id,
      status: value.status,
      createdAt: value.createdAt.toISOString(),
      completedAt: value.completedAt?.toISOString(),
      filters: value.filters,
      model: value.model,
      summary: value.summary,
      result: value.result,
      errorCode: value.errorCode,
      logIds: value.logIds,
    };
  }
}
