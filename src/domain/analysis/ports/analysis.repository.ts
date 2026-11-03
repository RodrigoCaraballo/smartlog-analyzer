import type { Analysis } from '../entities/analysis.entity';
import type { AnalysisResult } from '../entities/analysis.entity';

export const ANALYSIS_REPOSITORY = Symbol('ANALYSIS_REPOSITORY');

export interface AnalysisRepository {
  save(analysis: Analysis): Promise<Analysis>;
  findById(id: string): Promise<Analysis | null>;
  markRunning(id: string): Promise<void>;
  complete(id: string, result: AnalysisResult, summary: string, model: string): Promise<Analysis>;
  fail(id: string, errorCode: string): Promise<Analysis>;
}
