import type { AnalysisResult, AnalysisStatus } from '../entities/analysis.entity';

export interface AnalysisReportOutput {
  id: string;
  status: AnalysisStatus;
  summary?: string;
  result?: AnalysisResult;
  generatedAt?: string;
}
