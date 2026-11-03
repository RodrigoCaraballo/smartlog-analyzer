import type { AnalysisStatus } from '../entities/analysis.entity';

export interface ScheduledAnalysisOutput {
  id: string;
  status: AnalysisStatus;
  createdAt: string;
  message: string;
}
