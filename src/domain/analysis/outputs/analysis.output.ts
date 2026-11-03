import type { AnalysisResult, AnalysisStatus } from '../entities/analysis.entity';

export interface AnalysisOutput {
  id: string;
  status: AnalysisStatus;
  createdAt: string;
  completedAt?: string;
  filters: Record<string, unknown>;
  model?: string;
  summary?: string;
  result?: AnalysisResult;
  errorCode?: string;
  logIds: string[];
}
